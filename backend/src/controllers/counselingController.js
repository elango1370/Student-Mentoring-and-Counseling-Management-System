import CounselingSession from '../models/CounselingSession.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';

const mentorPopulate = { path: 'mentor', select: 'employeeId department user', populate: { path: 'user', select: 'name email avatarColor' } };

export const listSessions = asyncHandler(async (req, res) => {
  const { sessionType = '', status = '', search = '' } = req.query;
  const filter = { student: req.targetStudent._id };
  if (sessionType) filter.sessionType = sessionType;
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { issueDiscussed: rx }, { actionPlan: rx }];
  }
  if (req.user.role === ROLES.STUDENT) filter.confidential = false;

  const sessions = await CounselingSession.find(filter).populate(mentorPopulate).sort({ sessionDate: -1 });

  res.status(200).json({
    success: true,
    data: sessions,
    summary: {
      total: sessions.length,
      completed: sessions.filter((s) => s.status === 'completed').length,
      scheduled: sessions.filter((s) => s.status === 'scheduled').length,
      followUpsPending: sessions.filter((s) => s.followUpRequired && s.status !== 'cancelled').length,
    },
  });
});

export const createSession = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(403, 'Only a mentor can record counseling sessions.');

  const session = await CounselingSession.create({
    student: req.targetStudent._id,
    mentor: req.mentorProfile._id,
    sessionDate: req.body.sessionDate,
    durationMinutes: req.body.durationMinutes || 30,
    sessionType: req.body.sessionType,
    mode: req.body.mode || 'in-person',
    priority: req.body.priority || 'medium',
    title: req.body.title,
    issueDiscussed: req.body.issueDiscussed,
    guidanceGiven: req.body.guidanceGiven || '',
    actionPlan: req.body.actionPlan || '',
    studentFeedback: req.body.studentFeedback || '',
    followUpRequired: Boolean(req.body.followUpRequired),
    followUpDate: req.body.followUpDate || null,
    status: req.body.status || 'completed',
    confidential: Boolean(req.body.confidential),
  });

  const populated = await CounselingSession.findById(session._id).populate(mentorPopulate);
  res.status(201).json({ success: true, message: 'Counseling session recorded', data: populated });
});

export const updateSession = asyncHandler(async (req, res) => {
  const session = await CounselingSession.findById(req.params.recordId);
  if (!session) throw new ApiError(404, 'Counseling session not found.');
  if (String(session.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This session does not belong to the specified student.');
  }
  if (req.user.role === ROLES.MENTOR && String(session.mentor) !== String(req.mentorProfile?._id)) {
    throw new ApiError(403, 'You can only edit sessions you recorded.');
  }

  [
    'sessionDate', 'durationMinutes', 'sessionType', 'mode', 'priority', 'title', 'issueDiscussed',
    'guidanceGiven', 'actionPlan', 'studentFeedback', 'followUpRequired', 'followUpDate', 'status', 'confidential',
  ].forEach((k) => {
    if (req.body[k] !== undefined) session[k] = req.body[k];
  });

  await session.save();
  const populated = await CounselingSession.findById(session._id).populate(mentorPopulate);
  res.status(200).json({ success: true, message: 'Counseling session updated', data: populated });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const session = await CounselingSession.findById(req.params.recordId);
  if (!session) throw new ApiError(404, 'Counseling session not found.');
  if (String(session.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This session does not belong to the specified student.');
  }
  if (req.user.role === ROLES.MENTOR && String(session.mentor) !== String(req.mentorProfile?._id)) {
    throw new ApiError(403, 'You can only delete sessions you recorded.');
  }
  await session.deleteOne();
  res.status(200).json({ success: true, message: 'Counseling session deleted' });
});
