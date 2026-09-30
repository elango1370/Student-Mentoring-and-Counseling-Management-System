import Intervention from '../models/Intervention.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';

const mentorPopulate = { path: 'mentor', select: 'employeeId department user', populate: { path: 'user', select: 'name email avatarColor' } };

export const listInterventions = asyncHandler(async (req, res) => {
  const { interventionType = '', status = '', priority = '', search = '' } = req.query;
  const filter = { student: req.targetStudent._id };
  if (interventionType) filter.interventionType = interventionType;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { reason: rx }, { actionTaken: rx }, { outcome: rx }];
  }

  const interventions = await Intervention.find(filter).populate(mentorPopulate).sort({ startDate: -1 });

  res.status(200).json({
    success: true,
    data: interventions,
    summary: {
      total: interventions.length,
      open: interventions.filter((i) => ['planned', 'in-progress', 'escalated'].includes(i.status)).length,
      completed: interventions.filter((i) => i.status === 'completed').length,
      closed: interventions.filter((i) => i.status === 'closed').length,
      critical: interventions.filter((i) => i.priority === 'critical').length,
    },
  });
});

export const createIntervention = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(403, 'Only a mentor can create interventions.');

  const intervention = await Intervention.create({
    student: req.targetStudent._id,
    mentor: req.mentorProfile._id,
    interventionType: req.body.interventionType,
    title: req.body.title,
    reason: req.body.reason,
    actionTaken: req.body.actionTaken || '',
    outcome: req.body.outcome || '',
    priority: req.body.priority || 'medium',
    status: req.body.status || 'planned',
    startDate: req.body.startDate || new Date(),
    targetDate: req.body.targetDate || null,
    completedDate: req.body.status === 'completed' ? req.body.completedDate || new Date() : null,
    parentNotified: Boolean(req.body.parentNotified),
  });

  const populated = await Intervention.findById(intervention._id).populate(mentorPopulate);
  res.status(201).json({ success: true, message: 'Intervention created', data: populated });
});

export const updateIntervention = asyncHandler(async (req, res) => {
  const intervention = await Intervention.findById(req.params.recordId);
  if (!intervention) throw new ApiError(404, 'Intervention not found.');
  if (String(intervention.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This intervention does not belong to the specified student.');
  }
  if (req.user.role === ROLES.MENTOR && String(intervention.mentor) !== String(req.mentorProfile?._id)) {
    throw new ApiError(403, 'You can only edit interventions you created.');
  }

  [
    'interventionType', 'title', 'reason', 'actionTaken', 'outcome', 'priority',
    'status', 'startDate', 'targetDate', 'parentNotified',
  ].forEach((k) => {
    if (req.body[k] !== undefined) intervention[k] = req.body[k];
  });

  if (intervention.status === 'completed' && !intervention.completedDate) {
    intervention.completedDate = req.body.completedDate || new Date();
  }
  if (intervention.status !== 'completed') {
    intervention.completedDate = null;
  }

  await intervention.save();
  const populated = await Intervention.findById(intervention._id).populate(mentorPopulate);
  res.status(200).json({ success: true, message: 'Intervention updated', data: populated });
});

export const deleteIntervention = asyncHandler(async (req, res) => {
  const intervention = await Intervention.findById(req.params.recordId);
  if (!intervention) throw new ApiError(404, 'Intervention not found.');
  if (String(intervention.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This intervention does not belong to the specified student.');
  }
  if (req.user.role === ROLES.MENTOR && String(intervention.mentor) !== String(req.mentorProfile?._id)) {
    throw new ApiError(403, 'You can only delete interventions you created.');
  }
  await intervention.deleteOne();
  res.status(200).json({ success: true, message: 'Intervention deleted' });
});
