import { getProfileByUserId, updateProfileByUserId } from "../models/profile.model.js";

export async function getMyProfile(req, res, next) {
  try {
    const profile = await getProfileByUserId(req.user.id);
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const { fullName, phone } = req.body;
    const profile = await updateProfileByUserId(req.user.id, { fullName, phone });
    return res.status(200).json({ success: true, message: "Cap nhat thanh cong", data: profile });
  } catch (error) {
    return next(error);
  }
}
