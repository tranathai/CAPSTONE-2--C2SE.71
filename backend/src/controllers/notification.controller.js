import {
  listNotifications,
  markNotificationAsRead,
} from "../models/notification.model.js";

export async function getMyNotifications(req, res, next) {
  try {
    const unreadOnly = req.query.unreadOnly === "1";
    const rows = await listNotifications(req.user.id, unreadOnly);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function readNotification(req, res, next) {
  try {
    await markNotificationAsRead(Number(req.params.id), req.user.id);
    return res.status(200).json({ success: true, message: "Da danh dau da doc" });
  } catch (error) {
    return next(error);
  }
}
