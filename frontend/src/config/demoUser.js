/** Cấu hình demo cho đến khi có đăng nhập thật (JWT / session). */
export const DEMO_ROLE =
  import.meta.env.VITE_DEMO_ROLE === "supervisor" ||
  import.meta.env.VITE_DEMO_ROLE === "mentor"
    ? "supervisor"
    : "student";

export const DEMO_TEAM_ID = Number(import.meta.env.VITE_DEMO_TEAM_ID || 1);

export const DEMO_SUPERVISOR_ID = Number(
  import.meta.env.VITE_DEMO_SUPERVISOR_ID || 2,
);
