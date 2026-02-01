const Agent = require('../models/Agent');
const Admission = require('../models/Admission');
const AgentPayment = require('../models/AgentPayment');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const { getPaginationOptions, formatPaginationResponse, cleanObject } = require('../utils/helpers');

class AgentService {
  async create(data, createdBy) {
    const agent = await Agent.create({
      ...data,
      createdBy,
    });

    return agent;
  }

  async findAll(query) {
    const { page, limit, skip } = getPaginationOptions(query);
    const filter = {};

    // Search
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    // Filter by type
    if (query.agentType) {
      filter.agentType = query.agentType;
    }

    // Filter by status
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    const [agents, total] = await Promise.all([
      Agent.find(filter)
        .populate('parentAgentId', 'name agentType')
        .populate('linkedColleges', 'name')
        .populate('createdBy', 'firstName lastName')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Agent.countDocuments(filter),
    ]);

    return formatPaginationResponse(agents, total, page, limit);
  }

  async findAllActive(agentType) {
    const filter = { isActive: true, isDeleted: false };
    if (agentType) {
      filter.agentType = agentType;
    }
    return Agent.find(filter)
      .select('name agentType phone commissionRate')
      .sort({ name: 1 });
  }

  async findById(id) {
    const agent = await Agent.findById(id)
      .populate('parentAgentId', 'name agentType')
      .populate('linkedColleges', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    return agent;
  }

  async getAgentDetails(id) {
    const agent = await this.findById(id);

    // Get admissions linked to this agent - check both legacy and multiple agents structure
    const admissions = await Admission.find({
      $or: [
        { 'agent.agentId': id },
        { 'agents.mainAgent.agentId': id },
        { 'agents.collegeAgent.agentId': id },
        { 'agents.subAgent.agentId': id },
      ],
      isDeleted: false,
    })
      .populate('branchId', 'name code')
      .populate('collegeId', 'name')
      .populate('courseId', 'name')
      .select('admissionNo admissionDate student.firstName student.lastName agent agents paymentSummary admissionStatus');

    // Calculate totals - check which agent type this agent is for each admission
    const totals = admissions.reduce(
      (acc, adm) => {
        let agentFee = 0;
        
        // Check legacy agent
        if (adm.agent?.agentId?.toString() === id) {
          agentFee = adm.agent.agentFee || 0;
        }
        // Check multiple agents
        if (adm.agents?.mainAgent?.agentId?.toString() === id) {
          agentFee = adm.agents.mainAgent.agentFee || 0;
        }
        if (adm.agents?.collegeAgent?.agentId?.toString() === id) {
          agentFee = adm.agents.collegeAgent.agentFee || 0;
        }
        if (adm.agents?.subAgent?.agentId?.toString() === id) {
          agentFee = adm.agents.subAgent.agentFee || 0;
        }
        
        acc.totalAgentFee += agentFee;
        return acc;
      },
      { totalAgentFee: 0, totalPaid: 0, totalDue: 0 }
    );

    // Get legacy agent payments
    const legacyPayments = await AgentPayment.find({
      agentId: id,
      isDeleted: false,
    })
      .populate('admissionId', 'admissionNo student.firstName student.lastName')
      .populate('voucherId', 'voucherNo')
      .sort({ paymentDate: -1 })
      .limit(50);

    // Get payments from Payment collection where this agent was paid (Consultancy -> Agent)
    const agentPaymentsFromPayment = await Payment.find({
      paidToAgentId: id,
      isDeleted: false,
    })
      .populate('admissionId', 'admissionNo student.firstName student.lastName')
      .populate('voucherId', 'voucherNo')
      .sort({ paymentDate: -1 })
      .limit(50);

    // Calculate total paid to this agent
    const legacyPaidTotal = legacyPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paymentPaidTotal = agentPaymentsFromPayment.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    totals.totalPaid = legacyPaidTotal + paymentPaidTotal;
    totals.totalDue = Math.max(0, totals.totalAgentFee - totals.totalPaid);

    // Combine payments for display
    const payments = [
      ...legacyPayments.map(p => ({
        _id: p._id,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMode: p.paymentMode,
        transactionRef: p.transactionRef,
        admissionId: p.admissionId,
        voucherId: p.voucherId,
        source: 'legacy',
      })),
      ...agentPaymentsFromPayment.map(p => ({
        _id: p._id,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMode: p.paymentMode,
        transactionRef: p.transactionRef,
        admissionId: p.admissionId,
        voucherId: p.voucherId,
        source: 'payment',
      })),
    ].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    return {
      agent,
      admissions,
      payments,
      totals,
    };
  }

  async update(id, data, updatedBy) {
    const agent = await Agent.findById(id);

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      { ...cleanObject(data), updatedBy },
      { new: true, runValidators: true }
    )
      .populate('parentAgentId', 'name agentType')
      .populate('linkedColleges', 'name');

    return updatedAgent;
  }

  async delete(id, deletedBy) {
    const agent = await Agent.findById(id);

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    // Check if agent has admissions (both legacy and multiple agents)
    const admissionCount = await Admission.countDocuments({
      $or: [
        { 'agent.agentId': id },
        { 'agents.mainAgent.agentId': id },
        { 'agents.collegeAgent.agentId': id },
        { 'agents.subAgent.agentId': id },
      ],
      isDeleted: false,
    });

    if (admissionCount > 0) {
      throw new AppError('Cannot delete agent with linked admissions', 400);
    }

    agent.isDeleted = true;
    agent.deletedAt = new Date();
    agent.deletedBy = deletedBy;
    await agent.save();

    return true;
  }
}

module.exports = new AgentService();
