/**
 * URL tĩnh /uploads/... — dev: cùng origin (Vite proxy tới backend); prod: VITE_API_ORIGIN hoặc backend mặc định.
 */
export function getUploadUrl(filePath) {
  if (!filePath) return "";
  const path = filePath.startsWith("/") ? filePath : `/${filePath}`;

  const origin = import.meta.env.VITE_API_ORIGIN;
  if (origin) {
    return `${String(origin).replace(/\/$/, "")}${path}`;
  }
  if (import.meta.env.DEV) {
    return path;
  }
  return `http://localhost:5000${path}`;
}
