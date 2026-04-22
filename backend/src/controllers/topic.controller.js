import { createTopic, listTopics, reviewTopic } from "../models/topic.model.js";

export async function createTopicRequest(req, res, next) {
  try {
    const { teamId, title, description, technologiesUsed } = req.body;
    const topicId = await createTopic({
      teamId: teamId ? Number(teamId) : null,
      studentId: req.user.id,
      title,
      description,
      technologiesUsed,
    });
    return res.status(201).json({
      success: true,
      message: "Gui de xuat de tai thanh cong",
      data: { id: topicId, status: "PendingApproval" },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTopics(req, res, next) {
  try {
    const status = req.query.status || null;
    const onlyMine = req.query.onlyMine === "1";
    const topics = await listTopics({
      status,
      studentId: onlyMine ? req.user.id : null,
    });
    return res.status(200).json({ success: true, data: topics });
  } catch (error) {
    return next(error);
  }
}

export async function approveTopic(req, res, next) {
  try {
    await reviewTopic({
      topicId: Number(req.params.id),
      supervisorId: req.user.id,
      status: "Approved",
    });
    return res.status(200).json({ success: true, message: "Phe duyet de tai thanh cong" });
  } catch (error) {
    return next(error);
  }
}

export async function rejectTopic(req, res, next) {
  try {
    await reviewTopic({
      topicId: Number(req.params.id),
      supervisorId: req.user.id,
      status: "Rejected",
      rejectionReason: req.body.rejectionReason,
    });
    return res.status(200).json({ success: true, message: "Tu choi de tai thanh cong" });
  } catch (error) {
    return next(error);
  }
}
