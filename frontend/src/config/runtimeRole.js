import { useEffect, useState } from "react";

const ROLE_KEY = "demo_role";

export function getRuntimeRole() {
  const saved = localStorage.getItem(ROLE_KEY);
  if (saved === "supervisor" || saved === "mentor" || saved === "student") {
    return saved === "mentor" ? "supervisor" : saved;
  }
  return import.meta.env.VITE_DEMO_ROLE === "supervisor" ||
    import.meta.env.VITE_DEMO_ROLE === "mentor"
    ? "supervisor"
    : "student";
}

export function setRuntimeRole(role) {
  localStorage.setItem(ROLE_KEY, role);
  window.dispatchEvent(new Event("demo-role-changed"));
}

export function useRuntimeRole() {
  const [role, setRole] = useState(() => getRuntimeRole());

  useEffect(() => {
    function sync() {
      setRole(getRuntimeRole());
    }
    window.addEventListener("storage", sync);
    window.addEventListener("demo-role-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("demo-role-changed", sync);
    };
  }, []);

  return role;
}
