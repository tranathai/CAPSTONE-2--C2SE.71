import {
  findByUserId,
  createNotification,
  markAsRead,
  markAllRead,
  countUnread,
} from "../models/notification.model.js";

export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { unread_only, limit } = req.query;

    const notifications = await findByUserId(userId, {
      unreadOnly: unread_only === "true",
      limit: limit ? Number(limit) : 50,
    });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const count = await countUnread(req.user.id);
    return res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    await markAsRead(Number(id), req.user.id);
    return res.status(200).json({ success: true, message: "Đã đánh dấu đã đọc" });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await markAllRead(req.user.id);
    return res.status(200).json({ success: true, message: "Đã đánh dấu tất cả đã đọc" });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { user_id, title, message, type, related_url } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "title và message không được để trống" });
    }

    const id = await createNotification({
      userId: user_id,
      title,
      message,
      type,
      relatedUrl: related_url,
    });

    return res.status(201).json({ success: true, data: { id } });
  } catch (error) {
    next(error);
  }
}
