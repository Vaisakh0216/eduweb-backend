const Admission = require('../models/Admission');
const Payment = require('../models/Payment');
const AgentPayment = require('../models/AgentPayment');
const Voucher = require('../models/Voucher');
const AppError = require('../utils/AppError');
const {
  getPaginationOptions,
  formatPaginationResponse,
  buildDateRangeFilter,
  cleanObject,
} = require('../utils/helpers');
const { ROLES } = require('../utils/constants');

class AdmissionService {
  async create(data, createdBy) {
    const admission = await Admission.create({
      ...data,
      createdBy,
    });

    return admission.populate([
      { path: 'branchId', select: 'name code' },
      { path: 'collegeId', select: 'name code' },
      { path: 'courseId', select: 'name code' },
      { path: 'agent.agentId', select: 'name agentType' },
    ]);
  }

  async findAll(query, branchFilter, hideServiceCharge = false) {
    const { page, limit, skip } = getPaginationOptions(query);
    let filter = { ...branchFilter };

    // Search
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { admissionNo: searchRegex },
        { 'student.firstName': searchRegex },
        { 'student.lastName': searchRegex },
        { 'student.phone': searchRegex },
        { 'student.email': searchRegex },
      ];
    }

    // Filter by branch
    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    // Filter by status
    if (query.admissionStatus) {
      filter.admissionStatus = query.admissionStatus;
    }

    // Filter by college
    if (query.collegeId) {
      filter.collegeId = query.collegeId;
    }

    // Filter by course
    if (query.courseId) {
      filter.courseId = query.courseId;
    }

    // Filter by academic year
    if (query.academicYear) {
      filter.academicYear = query.academicYear;
    }

    // Date range filter
    const dateFilter = buildDateRangeFilter(
      query.startDate,
      query.endDate,
      'admissionDate'
    );
    filter = { ...filter, ...dateFilter };

    let selectFields = '-__v';
    if (hideServiceCharge) {
      selectFields += ' -serviceCharge';
    }

    const [admissions, total] = await Promise.all([
      Admission.find(filter)
        .select(selectFields)
        .populate('branchId', 'name code')
        .populate('collegeId', 'name code')
        .populate('courseId', 'name code')
        .populate('agent.agentId', 'name agentType')
        .populate('createdBy', 'firstName lastName')
        .sort({ admissionDate: -1 })
        .skip(skip)
        .limit(limit),
      Admission.countDocuments(filter),
    ]);

    return formatPaginationResponse(admissions, total, page, limit);
  }

  async findById(id, hideServiceCharge = false) {
    let selectFields = '-__v';
    if (hideServiceCharge) {
      selectFields += ' -serviceCharge';
    }

    const admission = await Admission.findById(id)
      .select(selectFields)
      .populate('branchId', 'name code')
      .populate('collegeId', 'name code')
      .populate('courseId', 'name code degree duration')
      .populate('agent.agentId', 'name agentType phone commissionRate')
      .populate('agents.mainAgent.agentId', 'name agentType phone')
      .populate('agents.collegeAgent.agentId', 'name agentType phone')
      .populate('agents.subAgent.agentId', 'name agentType phone')
      .populate('createdBy', 'firstName lastName');

    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    return admission;
  }

  async getAdmissionDetails(id, userRole) {
    const hideServiceCharge = userRole === ROLES.STAFF;
    const admission = await this.findById(id, hideServiceCharge);

    // Get payments for this admission
    const payments = await Payment.find({
      admissionId: id,
      isDeleted: false,
    })
      .populate('voucherId', 'voucherNo')
      .populate('createdBy', 'firstName lastName')
      .sort({ paymentDate: -1 });

    // Get agent payments
    const agentPayments = await AgentPayment.find({
      admissionId: id,
      isDeleted: false,
    })
      .populate('agentId', 'name')
      .populate('voucherId', 'voucherNo')
      .populate('createdBy', 'firstName lastName')
      .sort({ paymentDate: -1 });

    // Get vouchers
    const vouchers = await Voucher.find({
      admissionId: id,
      isDeleted: false,
    })
      .sort({ voucherDate: -1 });

    return {
      admission,
      payments,
      agentPayments,
      vouchers,
    };
  }

  async update(id, data, updatedBy, userRole) {
    const admission = await Admission.findById(id);

    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    // Staff cannot update service charge
    if (userRole === ROLES.STAFF && data.serviceCharge) {
      delete data.serviceCharge;
    }

    // Deep merge for nested objects
    if (data.student) {
      data.student = { ...admission.student.toObject(), ...data.student };
    }
    if (data.fees) {
      data.fees = { ...admission.fees.toObject(), ...data.fees };
    }
    if (data.agent) {
      data.agent = { ...admission.agent.toObject(), ...data.agent };
    }
    if (data.serviceCharge && userRole !== ROLES.STAFF) {
      data.serviceCharge = { ...admission.serviceCharge.toObject(), ...data.serviceCharge };
    }

    Object.assign(admission, cleanObject(data));
    admission.updatedBy = updatedBy;
    await admission.save();

    return admission.populate([
      { path: 'branchId', select: 'name code' },
      { path: 'collegeId', select: 'name code' },
      { path: 'courseId', select: 'name code' },
      { path: 'agent.agentId', select: 'name agentType' },
    ]);
  }

  async updatePaymentSummary(admissionId, paymentInfo = null) {
    const mongoose = require('mongoose');
    const admission = await Admission.findById(admissionId);
    if (!admission) return;

    // Convert admissionId to ObjectId for aggregation
    const admissionObjectId = new mongoose.Types.ObjectId(admissionId);

    // Calculate payments aggregation
    const paymentStats = await Payment.aggregate([
      {
        $match: {
          admissionId: admissionObjectId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          // Direct student payments to consultancy
          studentToConsultancy: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$payerType', 'Student'] },
                    { $eq: ['$receiverType', 'Consultancy'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          // Student to Agent payments (agent collects from student)
          studentToAgent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$payerType', 'Student'] },
                    { $eq: ['$receiverType', 'Agent'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          // Student to College payments (direct payment to college)
          studentToCollege: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$payerType', 'Student'] },
                    { $eq: ['$receiverType', 'College'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          // Agent fee deducted when agent transfers to consultancy
          agentFeeDeducted: {
            $sum: { $ifNull: ['$agentFeeDeducted', 0] },
          },
          // Amount received from agent (after deducting fee)
          agentToConsultancy: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$payerType', 'Agent'] },
                    { $eq: ['$receiverType', 'Consultancy'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          // Service charge received directly from college
          serviceChargeFromCollege: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$isServiceChargePayment', true] },
                    { $eq: ['$payerType', 'College'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          // Service charge deducted from student payments
          serviceChargeDeducted: {
            $sum: { $ifNull: ['$serviceChargeDeducted', 0] },
          },
          // Total amount due to college from student payments
          totalAmountDueToCollege: {
            $sum: { $ifNull: ['$amountDueToCollege', 0] },
          },
          // Amount paid by consultancy to college
          paidToCollege: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$payerType', 'Consultancy'] },
                    { $eq: ['$receiverType', 'College'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
          // Amount paid by consultancy to agent
          paidToAgent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$payerType', 'Consultancy'] },
                    { $eq: ['$receiverType', 'Agent'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
        },
      },
    ]);

    // Calculate agent paid from AgentPayment collection (legacy)
    const agentPaidLegacy = await AgentPayment.aggregate([
      {
        $match: {
          admissionId: admissionObjectId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
        },
      },
    ]);

    const stats = paymentStats[0] || {};

    // Debug logging
    console.log('Payment Stats:', {
      studentToConsultancy: stats.studentToConsultancy,
      studentToAgent: stats.studentToAgent,
      studentToCollege: stats.studentToCollege,
      paidToCollege: stats.paidToCollege,
    });

    // CORRECT CALCULATION:
    // Student Paid = All payments made by student (to Consultancy + to Agent + to College)
    // This represents the total amount the student has paid towards their fee
    const studentPaid = (stats.studentToConsultancy || 0) + (stats.studentToAgent || 0) + (stats.studentToCollege || 0);
    console.log('Calculated studentPaid:', studentPaid);
    admission.paymentSummary.studentPaid = studentPaid;
    
    // Agent fee calculation:
    // Agent is "paid" when:
    // 1. Agent deducted fee while transferring to consultancy (agentFeeDeducted)
    // 2. Consultancy paid agent directly (paidToAgent)
    // 3. Legacy agent payments
    const totalAgentPaid = (stats.agentFeeDeducted || 0) + (stats.paidToAgent || 0) + (agentPaidLegacy[0]?.totalPaid || 0);
    admission.paymentSummary.agentPaid = totalAgentPaid;

    // Update service charge tracking
    // Service charge comes from:
    // 1. College paying service charge directly
    // 2. Consultancy deducting from student payments
    // 3. Agent deducting fee (agent fee is part of service charge commitment)
    admission.serviceCharge.receivedFromCollege = stats.serviceChargeFromCollege || 0;
    admission.serviceCharge.deductedFromStudent = stats.serviceChargeDeducted || 0;
    admission.serviceCharge.deductedByAgent = stats.agentFeeDeducted || 0;
    
    // Calculate how much of the "paid to college" is from the deducted service charge
    // Logic: If you deducted SC and then paid to college, that reduces your net SC received
    // paidBackToCollege = min(paidToCollege, totalSCDeducted)
    // This ensures we only count as "paid back" up to what was deducted
    const totalDeducted = (stats.serviceChargeDeducted || 0) + (stats.agentFeeDeducted || 0);
    const paidToCollege = stats.paidToCollege || 0;
    
    // The amount "paid back" is limited by:
    // 1. What was actually paid to college
    // 2. What was deducted as service charge (can't pay back more than you took)
    // 3. But we also need to consider if there was a "due to college" from student payments
    // If amountDueToCollege > 0, those payments are NOT from service charge
    const totalDueToCollege = stats.totalAmountDueToCollege || 0;
    
    // Payments to college that are NOT from the "due to college" pool are from service charge
    const paidFromServiceCharge = Math.max(0, paidToCollege - totalDueToCollege);
    admission.serviceCharge.paidBackToCollege = Math.min(paidFromServiceCharge, totalDeducted);
    
    // Total received is calculated in pre-save hook

    // Update college payment tracking
    admission.collegePayment.totalDueToCollege = totalDueToCollege;
    admission.collegePayment.paidToCollege = paidToCollege;
    // Balance is calculated in pre-save hook

    // Update multiple agents payment tracking
    if (admission.agents) {
      // Calculate total agent fee
      const mainAgentFee = admission.agents.mainAgent?.agentFee || 0;
      const collegeAgentFee = admission.agents.collegeAgent?.agentFee || 0;
      const subAgentFee = admission.agents.subAgent?.agentFee || 0;
      admission.agents.totalAgentFee = mainAgentFee + collegeAgentFee + subAgentFee;
      admission.agents.totalAgentFeePaid = totalAgentPaid;
      admission.agents.totalAgentFeeDue = Math.max(0, admission.agents.totalAgentFee - totalAgentPaid);
    }

    await admission.save();
  }

  async delete(id, deletedBy) {
    const admission = await Admission.findById(id);

    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    admission.isDeleted = true;
    admission.deletedAt = new Date();
    admission.deletedBy = deletedBy;
    await admission.save();

    return true;
  }
}

module.exports = new AdmissionService();
