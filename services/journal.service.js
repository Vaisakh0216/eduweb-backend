const Journal = require('../models/Journal');
const AppError = require('../utils/AppError');
const { getPaginationOptions, formatPaginationResponse } = require('../utils/helpers');
const { JOURNAL_TYPES, JOURNAL_STATUSES } = require('../utils/constants');

class JournalService {
  async create(data, createdBy) {
    // Set correct default status based on type
    const status =
      data.type === JOURNAL_TYPES.SC_COLLECTED_BY_AGENT
        ? JOURNAL_STATUSES.PENDING
        : JOURNAL_STATUSES.COMPLETED;

    const journal = await Journal.create({ ...data, status, createdBy });

    // Only recalculate admission if this journal affects SC numbers
    if (data.admissionId) {
      const admissionService = require('./admission.service');
      await admissionService.updatePaymentSummary(data.admissionId);
    }

    return journal.populate([
      { path: 'admissionId', select: 'admissionNo student.firstName student.lastName' },
      { path: 'agentId', select: 'name agentType' },
      { path: 'branchId', select: 'name code' },
      { path: 'createdBy', select: 'firstName lastName' },
    ]);
  }

  async findByAdmission(admissionId) {
    return Journal.find({ admissionId })
      .populate('agentId', 'name agentType')
      .populate('createdBy', 'firstName lastName')
      .sort({ journalDate: -1 });
  }

  async findByAgent(agentId, query = {}) {
    const { page, limit, skip } = getPaginationOptions(query);
    const filter = { agentId };
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;

    const [journals, total] = await Promise.all([
      Journal.find(filter)
        .populate('admissionId', 'admissionNo student.firstName student.lastName')
        .populate('branchId', 'name code')
        .sort({ journalDate: -1 })
        .skip(skip)
        .limit(limit),
      Journal.countDocuments(filter),
    ]);

    return formatPaginationResponse(journals, total, page, limit);
  }

  async findAll(query, branchFilter = {}) {
    const { page, limit, skip } = getPaginationOptions(query);
    const filter = { ...branchFilter };
    if (query.agentId) filter.agentId = query.agentId;
    if (query.admissionId) filter.admissionId = query.admissionId;
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;

    const [journals, total] = await Promise.all([
      Journal.find(filter)
        .populate('admissionId', 'admissionNo student.firstName student.lastName')
        .populate('agentId', 'name agentType')
        .populate('branchId', 'name code')
        .populate('createdBy', 'firstName lastName')
        .sort({ journalDate: -1 })
        .skip(skip)
        .limit(limit),
      Journal.countDocuments(filter),
    ]);

    return formatPaginationResponse(journals, total, page, limit);
  }

  async settle(id, updatedBy) {
    const journal = await Journal.findById(id);
    if (!journal) throw new AppError('Journal not found', 404);
    if (journal.type !== JOURNAL_TYPES.SC_COLLECTED_BY_AGENT)
      throw new AppError('Only SC-collected-by-agent entries can be settled', 400);
    if (journal.status === JOURNAL_STATUSES.SETTLED)
      throw new AppError('Journal already settled', 400);

    journal.status = JOURNAL_STATUSES.SETTLED;
    journal.settledAt = new Date();
    journal.updatedBy = updatedBy;
    await journal.save();

    if (journal.admissionId) {
      const admissionService = require('./admission.service');
      await admissionService.updatePaymentSummary(journal.admissionId);
    }

    return journal;
  }

  async delete(id, deletedBy) {
    const journal = await Journal.findById(id);
    if (!journal) throw new AppError('Journal not found', 404);

    const admissionId = journal.admissionId;
    journal.isDeleted = true;
    journal.deletedAt = new Date();
    journal.deletedBy = deletedBy;
    await journal.save();

    if (admissionId) {
      const admissionService = require('./admission.service');
      await admissionService.updatePaymentSummary(admissionId);
    }

    return true;
  }
}

module.exports = new JournalService();
