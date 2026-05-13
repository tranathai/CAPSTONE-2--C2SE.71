import { useEffect } from "react";
import { useSocket } from "../context/SocketContext.jsx";

/**
 * Gọi lại fetch khi admin đổi giảng viên hướng dẫn nhóm (socket `mentor_scope_refresh`).
 * Truyền callback ổn định (useCallback) để tránh đăng ký lặp.
 */
export function useMentorScopeRefresh(onRefresh) {
  const { on, off } = useSocket();
  useEffect(() => {
    const handler = () => {
      onRefresh();
    };
    on("mentor_scope_refresh", handler);
    return () => off("mentor_scope_refresh", handler);
  }, [on, off, onRefresh]);
}
