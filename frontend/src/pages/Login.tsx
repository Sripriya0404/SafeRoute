import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { AuthResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login({ theme, onThemeToggle }: { theme: "light" | "dark"; onThemeToggle: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", student_id: "", email: "student@anurag.edu.in", password: "SafeRoute@2026" });
  const mutation = useMutation({
    mutationFn: () => apiPost<AuthResponse>(mode === "login" ? "/auth/login" : "/auth/signup", form),
    onSuccess: (data) => { beginSession(); toast.success(`Welcome, ${data.student.name.split(" ")[0]}`); window.location.assign("/"); },
    onError: () => toast.error(mode === "login" ? "Check your university email and password" : "Unable to create this account"),
  });
  return <main className="auth-page min-h-svh" data-testid="student-login-page">
    <div className="absolute right-5 top-5 z-20"><ThemeToggle theme={theme} onToggle={onThemeToggle} /></div>
    <section className="auth-image-panel" data-testid="university-image-panel">
      <img src="https://images.unsplash.com/photo-1666582091218-e84e59b11abe?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400" alt="Modern university campus building" loading="eager" fetchPriority="high" data-testid="university-campus-image" />
      <div className="auth-image-overlay" />
      <div className="relative z-10 max-w-lg self-end p-8 text-white lg:p-12"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur"><MapPin size={14} />Venkatapur, Hyderabad</div><h1 className="font-heading text-4xl font-bold leading-tight lg:text-5xl">A safer way around Anurag University.</h1><p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">Plan trusted routes, keep your circle informed, and reach campus help quickly.</p></div>
    </section>
    <section className="auth-form-panel"><div className="w-full max-w-md"><div className="mb-9 flex items-center gap-3"><div className="brand-mark"><ShieldCheck size={21} /></div><div><div className="font-heading text-xl font-bold text-[var(--ink)]">Safe<span className="text-[#0891b2]">Route</span></div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted-ink)]">Anurag University · Hyderabad</div></div></div><div className="mb-7"><h2 className="font-heading text-3xl font-bold text-[var(--ink)]">{mode === "login" ? "Welcome back" : "Create student account"}</h2><p className="mt-2 text-sm text-[var(--muted-ink)]">{mode === "login" ? "Sign in to access your personal safety dashboard." : "Register with your university details."}</p></div>
      <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="space-y-4" data-testid="student-auth-form">
        {mode === "signup" && <div className="grid grid-cols-2 gap-3"><div><label className="auth-label" htmlFor="student-name">Full name</label><div className="auth-input-wrap"><UserRound size={16} /><Input id="student-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required data-testid="student-name-input" /></div></div><div><label className="auth-label" htmlFor="student-id">Student ID</label><Input id="student-id" value={form.student_id} onChange={(event) => setForm({ ...form, student_id: event.target.value })} required data-testid="student-id-input" /></div></div>}
        <div><label className="auth-label" htmlFor="student-email">University email</label><div className="auth-input-wrap"><Mail size={16} /><Input id="student-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required data-testid="student-email-input" /></div></div>
        <div><label className="auth-label" htmlFor="student-password">Password</label><div className="auth-input-wrap"><LockKeyhole size={16} /><Input id="student-password" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} required data-testid="student-password-input" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility" data-testid="password-visibility-button">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
        <Button type="submit" className="h-11 w-full bg-[#0d9488] text-white hover:bg-[#0f766e]" disabled={mutation.isPending} data-testid="student-auth-submit-button">{mutation.isPending ? "Please wait..." : mode === "login" ? "Sign in securely" : "Create account"}<ArrowRight size={16} /></Button>
      </form>
      <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-5 w-full text-center text-sm text-[var(--muted-ink)] hover:text-[#0d9488]" data-testid="auth-mode-toggle">{mode === "login" ? "New student? Create an account" : "Already registered? Sign in"}</button>
      <div className="demo-credentials mt-7" data-testid="demo-credentials"><ShieldCheck size={16} /><div><strong>Project demo account</strong><span>student@anurag.edu.in · SafeRoute@2026</span></div></div>
    </div></section>
  </main>;
}