import {
  createMessage,
  ensureParticipant,
  getOrCreateTeamConversation,
  listMessages,
} from "../models/chat.model.js";

export async function getTeamMessages(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const conversationId = await getOrCreateTeamConversation(teamId);
    await ensureParticipant(conversationId, req.user.id);
    const rows = await listMessages(conversationId);
    return res.status(200).json({ success: true, data: { conversationId, messages: rows } });
  } catch (error) {
    return next(error);
  }
}

export async function postTeamMessage(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const conversationId = await getOrCreateTeamConversation(teamId);
    await ensureParticipant(conversationId, req.user.id);
    const messageId = await createMessage({
      conversationId,
      senderUserId: req.user.id,
      body: req.body.body,
    });
    return res.status(201).json({
      success: true,
      message: "Gui tin nhan thanh cong",
      data: { id: messageId, conversationId },
    });
  } catch (error) {
    return next(error);
  }
}
