import {
  findConversation,
  findContactList,
  sendMessage,
  canUsersMessageEachOther,
  canAccessTeamChat,
  findUserChatGroups,
  findGroupMessages,
  findGroupMessageById,
  updateGroupChatMessage,
  softDeleteGroupChatMessage,
  insertGroupSystemNotice,
  getGroupChatMemberIds,
  sendGroupMessage,
  markGroupMessagesRead,
  markMessagesRead,
  countUnreadMessages,
  findTopicMessages,
  findUserTopicsWithMessages,
} from "../models/message.model.js";
import { createNotification } from "../models/notification.model.js";
import { io } from "../server.js";
import {
  isGroupMessageWithinEditWindow,
  GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE,
} from "../utils/groupMessageWindow.js";

export async function getConversation(req, res, next) {
  try {
    const { userId } = req.params;
    const { limit, offset } = req.query;
    const myId = req.user.id;
    const peerId = Number(userId);

    const allowed = await canUsersMessageEachOther(myId, peerId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem cuộc hội thoại này" });
    }

    const messages = await findConversation(myId, peerId, {
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    await markMessagesRead(peerId, myId);

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
    const receiverId = Number(receiver_id);

    if (!receiver_id) {
      return res.status(400).json({ success: false, message: "receiver_id không hợp lệ" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn không được để trống" });
    }
    const allowed = await canUsersMessageEachOther(senderId, receiverId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Chỉ có thể nhắn tin trong phạm vi nhóm của bạn" });
    }

    const id = await sendMessage({ 
      senderId, 
      receiverId, 
      content: content.trim(),
      topicId: topic_id ? Number(topic_id) : null
    });

    // Notify receiver via notification
    const notifId = await createNotification({
      userId: receiverId,
      title: "Tin nhắn mới",
      message: `${req.user.full_name}: ${content.trim().slice(0, 80)}${content.length > 80 ? "..." : ""}`,
      type: "info",
      relatedUrl: topic_id ? `/messages?topic=${topic_id}` : `/messages/${senderId}`,
    });

    // Real-time: emit to receiver's personal room
    io.to(`user:${receiverId}`).emit("new_message", {
      id,
      senderId,
      senderName: req.user.full_name,
      content: content.trim(),
      topicId: topic_id || null,
      createdAt: new Date().toISOString(),
    });

    // Real-time: emit notification to receiver
    io.to(`user:${receiverId}`).emit("new_notification", {
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

export async function getGroupList(req, res, next) {
  try {
    const groups = await findUserChatGroups(req.user.id);
    return res.status(200).json({ success: true, data: groups });
  } catch (error) {
    next(error);
  }
}

export async function getGroupMessages(req, res, next) {
  try {
    const teamId = Number(req.params.teamId);
    const { limit, offset } = req.query;
    const userId = req.user.id;

    const allowed = await canAccessTeamChat(teamId, userId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem chat nhóm này" });
    }

    const messages = await findGroupMessages(teamId, {
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    });
    await markGroupMessagesRead(teamId, userId);
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
}

function emitGroupChatToMembers(teamId, event, payload) {
  getGroupChatMemberIds(teamId)
    .then((memberIds) => {
      for (const uid of memberIds) {
        io.to(`user:${uid}`).emit(event, payload);
      }
    })
    .catch(() => {});
}

export async function updateGroupMessage(req, res, next) {
  try {
    const messageId = Number(req.params.messageId);
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn không được để trống" });
    }

    const msg = await findGroupMessageById(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tin nhắn" });
    }
    if (msg.sender_id !== userId) {
      return res.status(403).json({ success: false, message: "Chỉ có thể chỉnh sửa tin nhắn của bạn" });
    }
    if (msg.message_kind !== "chat" || msg.is_deleted) {
      return res.status(400).json({ success: false, message: "Không thể chỉnh sửa tin nhắn này" });
    }
    if (!isGroupMessageWithinEditWindow(msg.created_at)) {
      return res.status(400).json({ success: false, message: GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE });
    }

    const allowed = await canAccessTeamChat(msg.team_id, userId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền trong nhóm chat này" });
    }

    const trimmed = String(content).trim();
    const updated = await updateGroupChatMessage(messageId, userId, trimmed);
    if (!updated) {
      return res.status(400).json({ success: false, message: GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE });
    }

    const notice = `${req.user.full_name} đã chỉnh sửa tin nhắn`;
    const systemId = await insertGroupSystemNotice({
      teamId: msg.team_id,
      actorId: userId,
      content: notice,
    });

    emitGroupChatToMembers(msg.team_id, "group_chat_updated", {
      teamId: msg.team_id,
      messageId,
      systemMessageId: systemId,
    });

    return res.status(200).json({
      success: true,
      message: "Chỉnh sửa tin nhắn thành công",
      data: { id: messageId, content: trimmed, system_message_id: systemId },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteGroupMessage(req, res, next) {
  try {
    const messageId = Number(req.params.messageId);
    const userId = req.user.id;

    const msg = await findGroupMessageById(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tin nhắn" });
    }
    if (msg.sender_id !== userId) {
      return res.status(403).json({ success: false, message: "Chỉ có thể xóa tin nhắn của bạn" });
    }
    if (msg.message_kind !== "chat" || msg.is_deleted) {
      return res.status(400).json({ success: false, message: "Không thể xóa tin nhắn này" });
    }
    if (!isGroupMessageWithinEditWindow(msg.created_at)) {
      return res.status(400).json({ success: false, message: GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE });
    }

    const allowed = await canAccessTeamChat(msg.team_id, userId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền trong nhóm chat này" });
    }

    const deleted = await softDeleteGroupChatMessage(messageId, userId);
    if (!deleted) {
      return res.status(400).json({ success: false, message: GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE });
    }

    const notice = `${req.user.full_name} đã xóa tin nhắn`;
    const systemId = await insertGroupSystemNotice({
      teamId: msg.team_id,
      actorId: userId,
      content: notice,
    });

    emitGroupChatToMembers(msg.team_id, "group_chat_updated", {
      teamId: msg.team_id,
      messageId,
      systemMessageId: systemId,
    });

    return res.status(200).json({
      success: true,
      message: "Xóa tin nhắn thành công",
      data: { id: messageId, system_message_id: systemId },
    });
  } catch (error) {
    next(error);
  }
}

export async function sendGroup(req, res, next) {
  try {
    const { team_id, content } = req.body;
    const senderId = req.user.id;
    const teamId = Number(team_id);

    if (!teamId) {
      return res.status(400).json({ success: false, message: "team_id không hợp lệ" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn không được để trống" });
    }
    const allowed = await canAccessTeamChat(teamId, senderId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Bạn không thuộc nhóm chat này" });
    }

    const result = await sendGroupMessage({
      senderId,
      teamId,
      content: content.trim(),
    });

    for (const receiverId of result.receivers) {
      io.to(`user:${receiverId}`).emit("new_group_message", {
        teamId,
        senderId,
        senderName: req.user.full_name,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      });
    }

    return res.status(201).json({ success: true, message: "Gửi tin nhắn nhóm thành công", data: { id: result.insertedId } });
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
