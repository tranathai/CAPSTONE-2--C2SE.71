export const GROUP_MESSAGE_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const GROUP_MESSAGE_EDIT_WINDOW_HOURS = 24;

export function isGroupMessageWithinEditWindow(createdAt) {
  if (!createdAt) return false;
  const sent = new Date(createdAt).getTime();
  if (Number.isNaN(sent)) return false;
  return Date.now() - sent < GROUP_MESSAGE_EDIT_WINDOW_MS;
}

export const GROUP_MESSAGE_EDIT_EXPIRED_MESSAGE =
  "Chỉ có thể chỉnh sửa hoặc xóa tin nhắn trong vòng 24 giờ kể từ khi gửi";
