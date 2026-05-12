import {
  findConversation,
  findContactList,
  sendMessage,
  markMessagesRead,
  countUnreadMessages,
  findTopicMessages,
  findUserTopicsWithMessages,
} from "../models/message.model.js";
import { createNotification } from "../models/notification.model.js";
import { io } from "../server.js";

export async function getConversation(req, res, next) {
  try {
    const { userId } = req.params;
    const { limit, offset } = req.query;
    const myId = req.user.id;

    const messages = await findConversation(myId, Number(userId), {
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    await markMessagesRead(Number(userId), myId);

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
}

export async function getContactList(req, res, next) {
  try {
    const contacts = await findContactList(req.user.id);
    return res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    next(error);
  }
}

export async function send(req, res, next) {
  try {
    const { receiver_id, content, topic_id } = req.body;
    const senderId = req.user.id;

    if (!receiver_id) {
      return res.status(400).json({ success: false, message: "receiver_id không hợp lệ" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn không được để trống" });
    }

    const id = await sendMessage({ 
      senderId, 
      receiverId: Number(receiver_id), 
      content: content.trim(),
      topicId: topic_id ? Number(topic_id) : null
    });

    // Notify receiver via notification
    const notifId = await createNotification({
      userId: Number(receiver_id),
      title: "Tin nhắn mới",
      message: `${req.user.full_name}: ${content.trim().slice(0, 80)}${content.length > 80 ? "..." : ""}`,
      type: "info",
      relatedUrl: topic_id ? `/messages?topic=${topic_id}` : `/messages/${senderId}`,
    });

    // Real-time: emit to receiver's personal room
    io.to(`user:${receiver_id}`).emit("new_message", {
      id,
      senderId,
      senderName: req.user.full_name,
      content: content.trim(),
      topicId: topic_id || null,
      createdAt: new Date().toISOString(),
    });

    // Real-time: emit notification to receiver
    io.to(`user:${receiver_id}`).emit("new_notification", {
      id: notifId,
      title: "Tin nhắn mới",
      message: `${req.user.full_name}: ${content.trim().slice(0, 80)}${content.length > 80 ? "..." : ""}`,
      type: "info",
      relatedUrl: topic_id ? `/messages?topic=${topic_id}` : `/messages/${senderId}`,
    });

    return res.status(201).json({ success: true, message: "Gửi tin nhắn thành công", data: { id } });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const count = await countUnreadMessages(req.user.id);
    return res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

export async function getTopicMessages(req, res, next) {
  try {
    const { topicId } = req.params;
    const { limit, offset } = req.query;

    const messages = await findTopicMessages(Number(topicId), {
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
}

export async function getUserTopicsWithMessages(req, res, next) {
  try {
    const topics = await findUserTopicsWithMessages(req.user.id);
    return res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
}
