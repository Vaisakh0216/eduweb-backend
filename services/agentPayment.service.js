const AgentPayment = require('../models/AgentPayment');
const Admission = require('../models/Admission');
const Agent = require('../models/Agent');
const Branch = require('../models/Branch');
const Voucher = require('../models/Voucher');
const Cashbook = require('../models/Cashbook');
const Daybook = require('../models/Daybook');
const AppError = require('../utils/AppError');
const {
  getPaginationOptions,
  formatPaginationResponse,
  buildDateRangeFilter,
  generateVoucherNumber,
} = require('../utils/helpers');
const { DAYBOOK_TYPES } = require('../utils/constants');
const admissionService = require('./admission.service');

class AgentPaymentService {
  async create(data, createdBy) {
    // Verify admission exists
    const admission = await Admission.findById(data.admissionId);
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    // Verify agent exists
    const agent = await Agent.findById(data.agentId);
    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    // Create agent payment
    const agentPayment = await AgentPayment.create({
      ...data,
      paymentDate: data.paymentDate || new Date(),
      createdBy,
    });

    // Generate voucher
    const branch = await Branch.findById(data.branchId);
    const voucherNo = await generateVoucherNumber(branch.code, Voucher);

    const voucher = await Voucher.create({
      voucherNo,
      branchId: data.branchId,
      voucherDate: agentPayment.paymentDate,
      voucherType: 'agent_payment',
      referenceType: 'AgentPayment',
      referenceId: agentPayment._id,
      admissionId: data.admissionId,
      amount: data.amount,
      paymentMode: data.paymentMode,
      transactionRef: data.transactionRef,
      description: `Agent commission payment to ${agent.name}`,
      partyName: agent.name,
      partyType: 'Agent',
      createdBy,
    });

    // Update payment with voucher reference
    agentPayment.voucherId = voucher._id;
    await agentPayment.save();

    // Create daybook entry
    await Daybook.create({
      date: agentPayment.paymentDate,
      branchId: data.branchId,
      category: 'paid_to_agent',
      type: DAYBOOK_TYPES.EXPENSE,
      amount: data.amount,
      description: `Commission paid to ${agent.name} for ${admission.admissionNo}`,
      admissionId: data.admissionId,
      agentPaymentId: agentPayment._id,
      voucherId: voucher._id,
      createdBy,
    });

    // Update cashbook if cash payment
    if (data.paymentMode === 'Cash') {
      const lastEntry = await Cashbook.findOne({ branchId: data.branchId })
        .sort({ date: -1, createdAt: -1 });

      const runningBalance = (lastEntry?.runningBalance || 0) - data.amount;

      await Cashbook.create({
        date: agentPayment.paymentDate,
        branchId: data.branchId,
        category: 'paid_to_agent',
        description: `Cash paid to agent ${agent.name}`,
        credited: 0,
        debited: data.amount,
        runningBalance,
        voucherId: voucher._id,
        createdBy,
      });
    }

    // Update admission payment summary
    await admissionService.updatePaymentSummary(data.admissionId);

    return agentPayment.populate([
      { path: 'admissionId', select: 'admissionNo student.firstName student.lastName' },
      { path: 'agentId', select: 'name agentType' },
      { path: 'voucherId', select: 'voucherNo' },
    ]);
  }

  async findAll(query, branchFilter) {
    const { page, limit, skip } = getPaginationOptions(query);
    let filter = { ...branchFilter };

    // Filter by admission
    if (query.admissionId) {
      filter.admissionId = query.admissionId;
    }

    // Filter by agent
    if (query.agentId) {
      filter.agentId = query.agentId;
    }

    // Filter by branch
    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    // Filter by payment mode
    if (query.paymentMode) {
      filter.paymentMode = query.paymentMode;
    }

    // Date range filter
    const dateFilter = buildDateRangeFilter(
      query.startDate,
      query.endDate,
      'paymentDate'
    );
    filter = { ...filter, ...dateFilter };

    // Get legacy agent payments
    const [legacyPayments, legacyTotal] = await Promise.all([
      AgentPayment.find(filter)
        .populate('admissionId', 'admissionNo student.firstName student.lastName')
        .populate('agentId', 'name agentType')
        .populate('branchId', 'name code')
        .populate('voucherId', 'voucherNo')
        .populate('createdBy', 'firstName lastName')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit),
      AgentPayment.countDocuments(filter),
    ]);

    // Build filter for Payment collection (Consultancy -> Agent payments)
    const Payment = require('../models/Payment');
    let paymentFilter = {
      payerType: 'Consultancy',
      receiverType: 'Agent',
      isDeleted: false,
    };
    
    if (branchFilter.branchId) {
      paymentFilter.branchId = branchFilter.branchId;
    }
    if (query.branchId) {
      paymentFilter.branchId = query.branchId;
    }
    if (query.agentId) {
      paymentFilter.paidToAgentId = query.agentId;
    }
    if (query.admissionId) {
      paymentFilter.admissionId = query.admissionId;
    }
    if (query.paymentMode) {
      paymentFilter.paymentMode = query.paymentMode;
    }
    if (dateFilter.paymentDate) {
      paymentFilter.paymentDate = dateFilter.paymentDate;
    }

    // Get Payment collection agent payments
    const [paymentCollectionPayments, paymentTotal] = await Promise.all([
      Payment.find(paymentFilter)
        .populate('admissionId', 'admissionNo student.firstName student.lastName')
        .populate('paidToAgentId', 'name agentType')
        .populate('branchId', 'name code')
        .populate('voucherId', 'voucherNo')
        .populate('createdBy', 'firstName lastName')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(paymentFilter),
    ]);

    // Combine and format results
    const combinedPayments = [
      ...legacyPayments.map(p => ({
        _id: p._id,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMode: p.paymentMode,
        transactionRef: p.transactionRef,
        notes: p.notes,
        admissionId: p.admissionId,
        agentId: p.agentId,
        branchId: p.branchId,
        voucherId: p.voucherId,
        createdBy: p.createdBy,
        source: 'legacy',
      })),
      ...paymentCollectionPayments.map(p => ({
        _id: p._id,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMode: p.paymentMode,
        transactionRef: p.transactionRef,
        notes: p.notes,
        admissionId: p.admissionId,
        agentId: p.paidToAgentId,
        branchId: p.branchId,
        voucherId: p.voucherId,
        createdBy: p.createdBy,
        source: 'payment',
      })),
    ].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    // Apply pagination to combined results
    const paginatedPayments = combinedPayments.slice(0, limit);
    const total = legacyTotal + paymentTotal;

    return formatPaginationResponse(paginatedPayments, total, page, limit);
  }

  async findById(id) {
    const payment = await AgentPayment.findById(id)
      .populate('admissionId', 'admissionNo student.firstName student.lastName')
      .populate('agentId', 'name agentType phone')
      .populate('branchId', 'name code')
      .populate('voucherId', 'voucherNo')
      .populate('createdBy', 'firstName lastName');

    if (!payment) {
      throw new AppError('Agent payment not found', 404);
    }

    return payment;
  }

  async update(id, data, updatedBy) {
    const payment = await AgentPayment.findById(id);

    if (!payment) {
      throw new AppError('Agent payment not found', 404);
    }

    const originalAmount = payment.amount;

    Object.assign(payment, data);
    payment.updatedBy = updatedBy;
    await payment.save();

    // Update admission payment summary if amount changed
    if (data.amount && data.amount !== originalAmount) {
      await admissionService.updatePaymentSummary(payment.admissionId);
    }

    return payment.populate([
      { path: 'admissionId', select: 'admissionNo student.firstName student.lastName' },
      { path: 'agentId', select: 'name agentType' },
      { path: 'voucherId', select: 'voucherNo' },
    ]);
  }

  async delete(id, deletedBy) {
    const payment = await AgentPayment.findById(id);

    if (!payment) {
      throw new AppError('Agent payment not found', 404);
    }

    payment.isDeleted = true;
    payment.deletedAt = new Date();
    payment.deletedBy = deletedBy;
    await payment.save();

    // Update admission payment summary
    await admissionService.updatePaymentSummary(payment.admissionId);

    return true;
  }
}

module.exports = new AgentPaymentService();
