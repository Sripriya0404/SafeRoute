import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import { fetchSession, sessionQueryKey } from "@/lib/session";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("saferoute-theme") as "light" | "dark") || "light");
  const session = useQuery({ queryKey: sessionQueryKey, queryFn: fetchSession, retry: false });
  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); localStorage.setItem("saferoute-theme", theme); }, [theme]);
  const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light");
  if (session.isLoading) return <div className="grid min-h-svh place-items-center bg-[var(--app-bg)] text-sm text-[var(--muted-ink)]" data-testid="session-loading-state">Preparing your safety dashboard...</div>;
  return (
    <Routes>
      <Route path="/login" element={<Login theme={theme} onThemeToggle={toggleTheme} />} />
      <Route path="/" element={session.data ? <Home student={session.data.student} theme={theme} onThemeToggle={toggleTheme} /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
