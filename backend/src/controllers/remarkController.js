import MentorRemark from '../models/MentorRemark.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ROLES } from '../config/constants.js';

const mentorPopulate = { path: 'mentor', select: 'employeeId department user', populate: { path: 'user', select: 'name email avatarColor' } };

export const listRemarks = asyncHandler(async (req, res) => {
  const { category = '', sentiment = '', search = '' } = req.query;
  const filter = { student: req.targetStudent._id };
  if (category) filter.category = category;
  if (sentiment) filter.sentiment = sentiment;
  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.remark = rx;
  }
  if (req.user.role === ROLES.STUDENT) filter.visibleToStudent = true;

  const remarks = await MentorRemark.find(filter).populate(mentorPopulate).sort({ remarkDate: -1 });

  const avgRating = remarks.length
    ? Number((remarks.reduce((s, r) => s + r.rating, 0) / remarks.length).toFixed(2))
    : 0;

  res.status(200).json({
    success: true,
    data: remarks,
    summary: {
      total: remarks.length,
      averageRating: avgRating,
      positive: remarks.filter((r) => r.sentiment === 'positive').length,
      negative: remarks.filter((r) => r.sentiment === 'negative').length,
      neutral: remarks.filter((r) => r.sentiment === 'neutral').length,
    },
  });
});

export const createRemark = asyncHandler(async (req, res) => {
  if (!req.mentorProfile) throw new ApiError(403, 'Only a mentor can add remarks.');

  const remark = await MentorRemark.create({
    student: req.targetStudent._id,
    mentor: req.mentorProfile._id,
    category: req.body.category,
    sentiment: req.body.sentiment || 'neutral',
    remark: req.body.remark,
    rating: req.body.rating || 3,
    visibleToStudent: req.body.visibleToStudent !== undefined ? Boolean(req.body.visibleToStudent) : true,
    remarkDate: req.body.remarkDate || new Date(),
  });

  const populated = await MentorRemark.findById(remark._id).populate(mentorPopulate);
  res.status(201).json({ success: true, message: 'Remark added', data: populated });
});

export const updateRemark = asyncHandler(async (req, res) => {
  const remark = await MentorRemark.findById(req.params.recordId);
  if (!remark) throw new ApiError(404, 'Remark not found.');
  if (String(remark.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This remark does not belong to the specified student.');
  }
  if (req.user.role === ROLES.MENTOR && String(remark.mentor) !== String(req.mentorProfile?._id)) {
    throw new ApiError(403, 'You can only edit your own remarks.');
  }

  ['category', 'sentiment', 'remark', 'rating', 'visibleToStudent', 'remarkDate'].forEach((k) => {
    if (req.body[k] !== undefined) remark[k] = req.body[k];
  });
  await remark.save();

  const populated = await MentorRemark.findById(remark._id).populate(mentorPopulate);
  res.status(200).json({ success: true, message: 'Remark updated', data: populated });
});

export const deleteRemark = asyncHandler(async (req, res) => {
  const remark = await MentorRemark.findById(req.params.recordId);
  if (!remark) throw new ApiError(404, 'Remark not found.');
  if (String(remark.student) !== String(req.targetStudent._id)) {
    throw new ApiError(403, 'This remark does not belong to the specified student.');
  }
  if (req.user.role === ROLES.MENTOR && String(remark.mentor) !== String(req.mentorProfile?._id)) {
    throw new ApiError(403, 'You can only delete your own remarks.');
  }
  await remark.deleteOne();
  res.status(200).json({ success: true, message: 'Remark deleted' });
});
