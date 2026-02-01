const Payment = require('../models/Payment');
const Admission = require('../models/Admission');
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
const { PAYER_TYPES, RECEIVER_TYPES, DAYBOOK_TYPES } = require('../utils/constants');
const admissionService = require('./admission.service');

class PaymentService {
  async create(data, createdBy) {
    console.log('Payment create - received data:', {
      payerType: data.payerType,
      receiverType: data.receiverType,
      amount: data.amount,
      deductServiceCharge: data.deductServiceCharge,
      serviceChargeDeducted: data.serviceChargeDeducted,
      isServiceChargePayment: data.isServiceChargePayment,
      isAgentCollection: data.isAgentCollection,
      transactionRef: data.transactionRef,
    });

    // Check for duplicate transaction reference
    if (data.transactionRef && data.transactionRef.trim() !== '') {
      const existingPayment = await Payment.findOne({ 
        transactionRef: data.transactionRef.trim(),
        isDeleted: false 
      });
      if (existingPayment) {
        throw new AppError(`Payment with transaction reference '${data.transactionRef}' already exists`, 400);
      }
    }

    // Verify admission exists
    const admission = await Admission.findById(data.admissionId).populate('branchId', 'code');
    if (!admission) {
      throw new AppError('Admission not found', 404);
    }

    console.log('Admission service charge due:', admission.serviceCharge?.due);

    // Calculate service charge deduction if applicable
    let serviceChargeDeducted = 0;
    let amountDueToCollege = 0;
    let agentFeeDeducted = 0;
    let amountTransferredToConsultancy = 0;

    const isStudentToConsultancy = 
      data.payerType === PAYER_TYPES.STUDENT &&
      data.receiverType === RECEIVER_TYPES.CONSULTANCY &&
      !data.isServiceChargePayment &&
      !data.isAgentCollection;

    // Agent Collection Flow: Agent collects from student and transfers to consultancy
    const isAgentToConsultancy = 
      data.payerType === PAYER_TYPES.AGENT &&
      data.receiverType === RECEIVER_TYPES.CONSULTANCY;

    // Consultancy paying agent fee
    const isConsultancyToAgent = 
      data.payerType === PAYER_TYPES.CONSULTANCY &&
      data.receiverType === RECEIVER_TYPES.AGENT;

    // Student paying to Agent (agent collects from student)
    const isStudentToAgent = 
      data.payerType === PAYER_TYPES.STUDENT &&
      data.receiverType === RECEIVER_TYPES.AGENT;

    console.log('Is Student to Consultancy payment:', isStudentToConsultancy);
    console.log('Is Agent to Consultancy payment:', isAgentToConsultancy);
    console.log('Is Student to Agent payment:', isStudentToAgent);
    console.log('deductServiceCharge value:', data.deductServiceCharge, 'type:', typeof data.deductServiceCharge);

    if (isStudentToConsultancy) {
      // Only deduct if explicitly enabled (deductServiceCharge must be true)
      if (data.deductServiceCharge === true) {
        const serviceChargeDue = admission.serviceCharge?.due || 0;
        console.log('Service charge due:', serviceChargeDue);

        if (serviceChargeDue > 0) {
          if (data.serviceChargeDeducted !== undefined && data.serviceChargeDeducted > 0) {
            serviceChargeDeducted = Math.min(data.serviceChargeDeducted, serviceChargeDue, data.amount);
          } else {
            serviceChargeDeducted = Math.min(serviceChargeDue, data.amount);
          }
        }
        console.log('Service charge to deduct:', serviceChargeDeducted);
      } else {
        console.log('Deduction NOT enabled - serviceChargeDeducted will be 0');
      }

      amountDueToCollege = data.amount - serviceChargeDeducted;
      console.log('Amount due to college:', amountDueToCollege);
    }

    // Handle Agent collection flow - Agent transfers to Consultancy
    if (isAgentToConsultancy) {
      // Agent collected from student and transferring to consultancy
      if (data.deductAgentFee === true && data.agentFeeDeducted > 0) {
        agentFeeDeducted = data.agentFeeDeducted;
      }
      // Amount transferred is what consultancy actually receives
      amountTransferredToConsultancy = data.amount;
      
      // CORRECT CALCULATION:
      // When agent transfers amount after deducting fee, the transferred amount CONTAINS
      // the remaining service charge (consultancy's portion).
      // 
      // Example: 
      // - Total Service Charge: ₹75,000 (₹40,000 agent + ₹35,000 consultancy)
      // - Agent deducted: ₹40,000
      // - Agent transferred: ₹1,15,000
      // - This ₹1,15,000 contains: ₹35,000 (consultancy SC) + ₹80,000 (college payment)
      //
      // So consultancy's service charge portion is automatically received in the transfer!
      // We need to calculate how much of the transferred amount is the consultancy's SC portion
      
      const totalServiceCharge = admission.serviceCharge?.agreed || 0;
      const agentFee = admission.agents?.totalAgentFee || admission.agent?.agentFee || 0;
      const consultancyServiceChargePortion = Math.max(0, totalServiceCharge - agentFee);
      
      // The consultancy's service charge portion is included in the transferred amount
      // This should be recorded as "deducted from student" (via agent transfer)
      // because it's part of what the student paid that consultancy is keeping
      serviceChargeDeducted = Math.min(consultancyServiceChargePortion, data.amount);
      
      // Amount due to college = transferred amount - consultancy's SC portion
      amountDueToCollege = Math.max(0, data.amount - serviceChargeDeducted);
      
      console.log('Agent to Consultancy - Total SC:', totalServiceCharge, 'Agent Fee:', agentFee);
      console.log('Consultancy SC portion (deducted from transfer):', serviceChargeDeducted);
      console.log('Amount due to college:', amountDueToCollege);
    }

    // Student to Agent - no amount due to college yet (will be calculated when agent transfers)
    if (isStudentToAgent) {
      console.log('Student to Agent payment - no college dues calculated yet');
    }

    console.log('Final values - serviceChargeDeducted:', serviceChargeDeducted, 'amountDueToCollege:', amountDueToCollege, 'agentFeeDeducted:', agentFeeDeducted);

    // Clean transaction reference
    const cleanTransactionRef = data.transactionRef && data.transactionRef.trim() !== '' 
      ? data.transactionRef.trim() 
      : null;

    // Determine which specific agent is being paid (for Consultancy -> Agent payments)
    let paidToAgentId = null;
    if (isConsultancyToAgent && data.agentIdForFeePayment) {
      paidToAgentId = data.agentIdForFeePayment;
    }

    // Create payment
    const payment = await Payment.create({
      ...data,
      transactionRef: cleanTransactionRef,
      paymentDate: data.paymentDate || new Date(),
      serviceChargeDeducted,
      amountDueToCollege,
      agentFeeDeducted,
      amountTransferredToConsultancy: isAgentToConsultancy ? amountTransferredToConsultancy : 0,
      collectingAgentId: data.collectingAgentId || null,
      isAgentCollection: data.isAgentCollection || false,
      isAgentFeePayment: isConsultancyToAgent && data.isAgentFeePayment,
      agentIdForFeePayment: isConsultancyToAgent ? data.agentIdForFeePayment : null,
      paidToAgentId, // Track which specific agent was paid
      createdBy,
    });

    // Generate voucher
    const branch = await Branch.findById(data.branchId);
    const voucherNo = await generateVoucherNumber(branch.code, Voucher);

    // Determine voucher type:
    // receipt = money received (income for consultancy)
    // payment = money paid out (expense for consultancy)
    let voucherType = 'receipt'; // Default: we received money
    if (data.payerType === PAYER_TYPES.CONSULTANCY) {
      voucherType = 'payment'; // We are paying out
    }

    let voucherDescription = '';
    if (voucherType === 'receipt') {
      voucherDescription = `Payment received from ${data.payerType} to ${data.receiverType}`;
    } else {
      voucherDescription = `Payment made from ${data.payerType} to ${data.receiverType}`;
    }
    
    if (serviceChargeDeducted > 0) {
      voucherDescription += ` (includes SC: ₹${serviceChargeDeducted}, due to college: ₹${amountDueToCollege})`;
    }
    if (agentFeeDeducted > 0) {
      voucherDescription += ` (Agent fee already deducted: ₹${agentFeeDeducted})`;
    }

    const voucher = await Voucher.create({
      voucherNo,
      branchId: data.branchId,
      voucherDate: payment.paymentDate,
      voucherType,
      referenceType: 'Payment',
      referenceId: payment._id,
      admissionId: data.admissionId,
      amount: data.amount,
      paymentMode: data.paymentMode,
      transactionRef: data.transactionRef,
      description: voucherDescription,
      partyName: `${admission.student.firstName} ${admission.student.lastName}`,
      partyType: data.payerType,
      createdBy,
    });

    // Update payment with voucher reference
    payment.voucherId = voucher._id;
    await payment.save();

    // Create daybook entries based on payment type
    if (data.receiverType === RECEIVER_TYPES.CONSULTANCY) {
      // Determine the category based on payment type
      let category = 'received_from_student';
      let description = `Payment from ${data.payerType}: ${admission.student.firstName} ${admission.student.lastName}`;
      
      if (data.isServiceChargePayment && data.payerType === PAYER_TYPES.COLLEGE) {
        // College paying service charge to Consultancy
        category = 'received_from_college_service_charge';
      } else if (data.payerType === PAYER_TYPES.AGENT) {
        // Agent transferring to Consultancy
        category = 'received_from_student'; // It's originally from student via agent
        description = `Payment from Agent: ${admission.student.firstName} ${admission.student.lastName}`;
        if (agentFeeDeducted > 0) {
          description += ` (Agent deducted ₹${agentFeeDeducted} fee)`;
        }
      }

      // IMPORTANT: Only ONE daybook entry for the actual amount received
      // The service charge deduction is just for TRACKING purposes - 
      // it shows how much of this received amount is consultancy's vs college's
      // We do NOT create a separate income entry for service charge as it would be double-counting
      
      let remarks = '';
      if (serviceChargeDeducted > 0) {
        remarks = `Service charge portion: ₹${serviceChargeDeducted}, Due to college: ₹${amountDueToCollege}`;
      }

      await Daybook.create({
        date: payment.paymentDate,
        branchId: data.branchId,
        category,
        type: DAYBOOK_TYPES.INCOME,
        amount: data.amount,
        description,
        admissionId: data.admissionId,
        paymentId: payment._id,
        voucherId: voucher._id,
        remarks,
        createdBy,
      });

      // NO SEPARATE SERVICE CHARGE ENTRY - it's already part of the amount received above!

      // Update cashbook if cash payment
      if (data.paymentMode === 'Cash') {
        const lastEntry = await Cashbook.findOne({ branchId: data.branchId })
          .sort({ date: -1, createdAt: -1 });

        const runningBalance = (lastEntry?.runningBalance || 0) + data.amount;

        await Cashbook.create({
          date: payment.paymentDate,
          branchId: data.branchId,
          category,
          description: `Cash received from ${data.payerType}: ${admission.student.firstName} ${admission.student.lastName}`,
          credited: data.amount,
          debited: 0,
          runningBalance,
          voucherId: voucher._id,
          createdBy,
        });
      }
    }

    // Handle Consultancy paying to College
    if (data.payerType === PAYER_TYPES.CONSULTANCY && data.receiverType === RECEIVER_TYPES.COLLEGE) {
      await Daybook.create({
        date: payment.paymentDate,
        branchId: data.branchId,
        category: 'paid_to_college',
        type: DAYBOOK_TYPES.EXPENSE,
        amount: data.amount,
        description: `Paid to college for ${admission.student.firstName} ${admission.student.lastName}`,
        admissionId: data.admissionId,
        paymentId: payment._id,
        voucherId: voucher._id,
        createdBy,
      });

      // Update cashbook if cash payment
      if (data.paymentMode === 'Cash') {
        const lastEntry = await Cashbook.findOne({ branchId: data.branchId })
          .sort({ date: -1, createdAt: -1 });

        const runningBalance = (lastEntry?.runningBalance || 0) - data.amount;

        await Cashbook.create({
          date: payment.paymentDate,
          branchId: data.branchId,
          category: 'paid_to_college',
          description: `Cash paid to college for ${admission.student.firstName} ${admission.student.lastName}`,
          credited: 0,
          debited: data.amount,
          runningBalance,
          voucherId: voucher._id,
          createdBy,
        });
      }
    }

    // Update admission payment summary and service charge tracking
    await admissionService.updatePaymentSummary(data.admissionId, {
      serviceChargeDeducted,
      amountDueToCollege,
      isServiceChargePayment: data.isServiceChargePayment,
      payerType: data.payerType,
      receiverType: data.receiverType,
      amount: data.amount,
    });

    return payment.populate([
      { path: 'admissionId', select: 'admissionNo student.firstName student.lastName' },
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

    // Filter by branch
    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    // Filter by payer type
    if (query.payerType) {
      filter.payerType = query.payerType;
    }

    // Filter by receiver type
    if (query.receiverType) {
      filter.receiverType = query.receiverType;
    }

    // Filter by payment mode
    if (query.paymentMode) {
      filter.paymentMode = query.paymentMode;
    }

    // Filter by transaction reference
    if (query.transactionRef) {
      filter.transactionRef = { $regex: query.transactionRef, $options: 'i' };
    }

    // Search by transaction reference or student name
    if (query.search) {
      filter.$or = [
        { transactionRef: { $regex: query.search, $options: 'i' } },
      ];
    }

    // Date range filter
    const dateFilter = buildDateRangeFilter(
      query.startDate,
      query.endDate,
      'paymentDate'
    );
    filter = { ...filter, ...dateFilter };

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('admissionId', 'admissionNo student.firstName student.lastName')
        .populate('branchId', 'name code')
        .populate('voucherId', 'voucherNo')
        .populate('createdBy', 'firstName lastName')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    return formatPaginationResponse(payments, total, page, limit);
  }

  async findById(id) {
    const payment = await Payment.findById(id)
      .populate('admissionId', 'admissionNo student.firstName student.lastName')
      .populate('branchId', 'name code')
      .populate('voucherId', 'voucherNo')
      .populate('createdBy', 'firstName lastName');

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  async update(id, data, updatedBy) {
    const payment = await Payment.findById(id);

    if (!payment) {
      throw new AppError('Payment not found', 404);
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
      { path: 'voucherId', select: 'voucherNo' },
    ]);
  }

  async delete(id, deletedBy) {
    const payment = await Payment.findById(id);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    payment.isDeleted = true;
    payment.deletedAt = new Date();
    payment.deletedBy = deletedBy;
    await payment.save();

    // Update admission payment summary
    await admissionService.updatePaymentSummary(payment.admissionId);

    return true;
  }

  async checkTransactionRef(transactionRef) {
    if (!transactionRef || transactionRef.trim() === '') {
      return { exists: false };
    }
    
    const existingPayment = await Payment.findOne({ 
      transactionRef: transactionRef.trim(),
      isDeleted: false 
    }).populate('admissionId', 'admissionNo student.firstName student.lastName');
    
    if (existingPayment) {
      return { 
        exists: true, 
        payment: {
          _id: existingPayment._id,
          amount: existingPayment.amount,
          paymentDate: existingPayment.paymentDate,
          admissionNo: existingPayment.admissionId?.admissionNo,
          studentName: existingPayment.admissionId 
            ? `${existingPayment.admissionId.student.firstName} ${existingPayment.admissionId.student.lastName}`
            : 'N/A'
        }
      };
    }
    
    return { exists: false };
  }
}

module.exports = new PaymentService();
