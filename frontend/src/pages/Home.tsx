import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Bookmark,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Crosshair,
  Flame,
  Headphones,
  Lightbulb,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Route,
  Shield,
  LogOut,
  Siren,
  Signal,
  Sparkles,
  Timer,
  Users,
  UserRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api";
import { endSession } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import type {
  CampusLocation,
  DashboardResponse,
  EmergencyResponse,
  Hazard,
  HazardCategory,
  HazardCreate,
  HazardSeverity,
  RouteOption,
  RoutePlan,
  SavedRoute,
  Student,
  StudentOverview,
} from "@/lib/types";

const fallbackLocations: CampusLocation[] = [
  { id: "library", name: "Central Library", short_code: "LIB", kind: "Study hub", x: 22, y: 32, description: "Anurag University learning and resource centre" },
  { id: "science-quad", name: "Pharmacy Block", short_code: "PHR", kind: "Academic", x: 43, y: 24, description: "School of Pharmacy academic wing" },
  { id: "student-union", name: "Student Activity Centre", short_code: "SAC", kind: "Community", x: 59, y: 43, description: "Student clubs, dining, and events" },
  { id: "north-dorms", name: "University Hostels", short_code: "HST", kind: "Residence", x: 78, y: 20, description: "Student residence and evening shuttle point" },
  { id: "engineering", name: "Engineering Block", short_code: "ENG", kind: "Academic", x: 35, y: 59, description: "Engineering classrooms and labs" },
  { id: "athletics", name: "Sports Complex", short_code: "SPT", kind: "Recreation", x: 66, y: 73, description: "Outdoor courts and student recreation" },
  { id: "west-gate", name: "Main Gate", short_code: "GATE", kind: "Entry", x: 12, y: 72, description: "Primary campus entrance at Venkatapur" },
  { id: "arts-center", name: "Administration Block", short_code: "ADM", kind: "Administration", x: 84, y: 58, description: "University administration and student support" },
];

const hazardCategories: HazardCategory[] = ["Poor lighting", "Broken blue light", "Construction", "Suspicious activity"];
const severityOptions: HazardSeverity[] = ["Low", "Medium", "High"];

const fetchLocations = () => apiGet<CampusLocation[]>("/safety/locations");
const fetchHazards = () => apiGet<Hazard[]>("/safety/hazards");
const fetchDashboard = () => apiGet<DashboardResponse>("/safety/dashboard");

function formatReportedAt(date: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(date));
}

function severityClass(severity: HazardSeverity) {
  return severity === "High" ? "text-[#ff6b6b] border-[#ef4444]/30 bg-[#ef4444]/10" : severity === "Medium" ? "text-[#fbbf24] border-[#f59e0b]/30 bg-[#f59e0b]/10" : "text-[#8ce8c1] border-[#10b981]/30 bg-[#10b981]/10";
}

function MetricCard({ metric }: { metric: DashboardResponse["metrics"][number] }) {
  const icon = metric.tone === "cyan" ? <Signal size={16} /> : metric.tone === "emerald" ? <Users size={16} /> : metric.tone === "amber" ? <AlertTriangle size={16} /> : <Timer size={16} />;
  const color = metric.tone === "cyan" ? "text-[#22d3ee]" : metric.tone === "emerald" ? "text-[#34d399]" : metric.tone === "amber" ? "text-[#fbbf24]" : "text-[#fb7185]";
  return (
    <Card data-testid={`metric-card-${metric.id}`} className="app-card border-[var(--line)] bg-[var(--panel)] shadow-none transition-transform duration-200 hover:-translate-y-1">
      <CardContent className="p-5">
        <div className={`mb-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${color}`} data-testid={`metric-label-${metric.id}`}>{icon}{metric.label}</div>
        <div className="font-heading text-3xl font-bold tracking-tight text-slate-50" data-testid={`metric-value-${metric.id}`}>{metric.value}</div>
        <div className="mt-2 text-xs text-slate-500" data-testid={`metric-detail-${metric.id}`}>{metric.detail}</div>
      </CardContent>
    </Card>
  );
}

function CampusMap({ locations, hazards, selectedRoute, zoom, onLocationClick }: { locations: CampusLocation[]; hazards: Hazard[]; selectedRoute: RouteOption | null; zoom: number; onLocationClick: (locationId: string) => void }) {
  const routePath = selectedRoute ? "M 14 72 C 25 69, 26 57, 36 59 S 52 45, 59 43 S 70 29, 78 20" : "M 12 72 C 25 66, 28 45, 43 24 S 65 12, 78 20";
  return (
    <div className="relative h-full min-h-[470px] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0d1724]" data-testid="campus-map-canvas">
      <div className="map-grid absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(6,182,212,0.13),transparent_28%),radial-gradient(circle_at_25%_75%,rgba(16,185,129,0.08),transparent_32%)]" />
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#0b111d]/80 px-5 py-4 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#22d3ee]" data-testid="map-status-label"><span className="live-dot" />Live campus view</div>
          <h2 className="mt-1 font-heading text-lg font-bold text-white" data-testid="map-title">Anurag University campus</h2>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-[#111b2b]/80 p-1">
          <Button variant="ghost" size="icon-sm" onClick={() => {}} data-testid="map-zoom-in" aria-label="Zoom in"><ZoomIn size={16} /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => {}} data-testid="map-zoom-out" aria-label="Zoom out"><ZoomOut size={16} /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => {}} data-testid="map-recenter-btn" aria-label="Recenter map"><Crosshair size={16} /></Button>
        </div>
      </div>
      <svg viewBox="0 0 100 100" className="relative z-10 h-[390px] w-full p-4 transition-transform duration-300" style={{ transform: `scale(${zoom})` }} role="img" aria-label="Anurag University campus safety route map" data-testid="campus-map-svg">
        <defs>
          <filter id="cyan-glow"><feGaussianBlur stdDeviation="1.7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="green-glow"><feGaussianBlur stdDeviation="1.1" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d="M 8 16 L 90 16 M 17 7 L 17 91 M 35 10 L 35 87 M 55 12 L 55 91 M 74 8 L 74 90 M 91 14 L 91 87 M 7 38 L 92 38 M 8 57 L 92 57 M 8 78 L 92 78" stroke="#334155" strokeWidth="0.45" strokeDasharray="1.4 1.6" opacity=".75" />
        <path d="M 7 88 C 21 79, 22 59, 38 56 S 56 47, 66 34 S 79 16, 94 12" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".3" filter="url(#green-glow)" />
        <path d={routePath} stroke="#22d3ee" strokeWidth="1.1" strokeDasharray="3 2" strokeLinecap="round" fill="none" filter="url(#cyan-glow)" className={selectedRoute ? "route-dash" : ""} />
        <path d="M 5 86 Q 45 78 62 55 T 95 10" stroke="#64748b" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".45" />
        <path d="M 5 86 Q 45 78 62 55 T 95 10" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <rect x="45" y="68" width="16" height="7" rx="1" fill="#172335" stroke="#475569" strokeWidth=".5" /><rect x="46" y="69" width="5" height="5" fill="#23334a" /><rect x="53" y="69" width="7" height="5" fill="#23334a" />
        {locations.map((location) => {
          const hasHazard = hazards.some((hazard) => hazard.location_id === location.id && hazard.status !== "Resolved");
          return <g key={location.id} tabIndex={0} role="button" aria-label={`Set ${location.name}`} onClick={() => onLocationClick(location.id)} onKeyDown={(event) => { if (event.key === "Enter") onLocationClick(location.id); }} data-testid={`map-location-${location.id}`} className="cursor-pointer outline-none">
            <circle cx={location.x} cy={location.y} r="5" fill="#0b1524" stroke={hasHazard ? "#f59e0b" : "#22d3ee"} strokeWidth=".7" opacity=".85" />
            <circle cx={location.x} cy={location.y} r="2.1" fill={hasHazard ? "#f59e0b" : "#22d3ee"} className={hasHazard ? "hazard-pulse" : ""} />
            <text x={location.x + 5} y={location.y + 1} fill="#cbd5e1" fontSize="2.7" fontWeight="600">{location.short_code}</text>
          </g>;
        })}
        <g data-testid="blue-light-towers" fill="#34d399"><circle cx="31" cy="42" r="1.2" /><circle cx="70" cy="31" r="1.2" /><circle cx="62" cy="64" r="1.2" /></g>
        <g fill="#34d399" opacity=".7"><circle cx="31" cy="42" r="3" fill="none" stroke="#34d399" strokeWidth=".4" className="radar-pulse" /><circle cx="70" cy="31" r="3" fill="none" stroke="#34d399" strokeWidth=".4" className="radar-pulse" /></g>
      </svg>
      <div className="absolute bottom-4 left-5 z-20 flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-white/10 bg-[#0b111d]/85 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-slate-400 backdrop-blur" data-testid="map-legend">
        <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#22d3ee]" />Safe route</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />Blue light</span><span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />Hazard</span>
      </div>
      <div className="absolute bottom-4 right-5 z-20 rounded-md border border-[#10b981]/20 bg-[#0b111d]/85 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-[#6ee7b7]" data-testid="map-coverage-status">89% illuminated coverage</div>
    </div>
  );
}

function RouteOptionCard({ option, selected, recommended, onSelect, index }: { option: RouteOption; selected: boolean; recommended: boolean; onSelect: () => void; index: number }) {
  return <button type="button" onClick={onSelect} className={`w-full rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${selected ? "border-[#22d3ee]/60 bg-[#0c3141]/45 shadow-[0_0_22px_rgba(6,182,212,0.1)]" : "border-white/[0.08] bg-[#0e1725]/70 hover:border-white/20"}`} data-testid={`route-option-card-${index}`}>
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-lg ${selected ? "bg-[#06b6d4]/15 text-[#22d3ee]" : "bg-white/5 text-slate-500"}`}><Route size={15} /></span><div><div className="flex items-center gap-2 font-heading text-sm font-bold text-slate-100">{option.name}{recommended && <Badge className="border-[#10b981]/30 bg-[#10b981]/10 px-1.5 py-0 text-[9px] text-[#6ee7b7]">Recommended</Badge>}</div><div className="mt-1 text-[11px] leading-relaxed text-slate-500">{option.summary}</div></div></div>{selected && <span className="text-[#22d3ee]"><Check size={16} /></span>}</div>
    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3"><div><div className="font-heading text-sm font-bold text-slate-100">{option.safety_score}%</div><div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">safe score</div></div><div><div className="font-heading text-sm font-bold text-slate-100">{option.minutes} min</div><div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">walk time</div></div><div><div className="font-heading text-sm font-bold text-slate-100">{option.distance_m}m</div><div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">distance</div></div></div>
  </button>;
}

export default function Home({ student, theme, onThemeToggle }: { student: Student; theme: "light" | "dark"; onThemeToggle: () => void }) {
  const queryClient = useQueryClient();
  const [originId, setOriginId] = useState("library");
  const [destinationId, setDestinationId] = useState("north-dorms");
  const [priority, setPriority] = useState<"safety" | "speed" | "patrol">("safety");
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState("illuminated");
  const [zoom, setZoom] = useState(1);
  const [hazardOpen, setHazardOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [navigationActive, setNavigationActive] = useState(false);
  const [hazardForm, setHazardForm] = useState<HazardCreate>({ category: "Poor lighting", severity: "Medium", location_id: "engineering", description: "" });
  const [sosLocationId, setSosLocationId] = useState("student-union");

  const locationsQuery = useQuery({ queryKey: ["safety-locations"], queryFn: fetchLocations, retry: false });
  const hazardsQuery = useQuery({ queryKey: ["safety-hazards"], queryFn: fetchHazards, retry: false });
  const dashboardQuery = useQuery({ queryKey: ["safety-dashboard"], queryFn: fetchDashboard, retry: false });
  const overviewQuery = useQuery({ queryKey: ["student-overview"], queryFn: () => apiGet<StudentOverview>("/auth/overview"), retry: false });
  const locations = locationsQuery.data ?? fallbackLocations;
  const hazards = hazardsQuery.data ?? [];
  const dashboard = dashboardQuery.data;
  const selectedRoute = routePlan?.options.find((option) => option.id === selectedRouteId) ?? null;
  const openHazards = useMemo(() => hazards.filter((hazard) => hazard.status !== "Resolved"), [hazards]);

  const planMutation = useMutation({ mutationFn: (payload: { origin_id: string; destination_id: string; priority: "safety" | "speed" | "patrol" }) => apiPost<RoutePlan>("/safety/routes/plan", payload), onSuccess: (data) => { setRoutePlan(data); setSelectedRouteId(data.recommended_id); toast.success("Safe route calculated", { description: `${data.origin.name} to ${data.destination.name}` }); }, onError: () => toast.error("Could not calculate route") });
  const hazardMutation = useMutation({ mutationFn: (payload: HazardCreate) => apiPost<Hazard>("/safety/hazards", payload), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["safety-hazards"] }); queryClient.invalidateQueries({ queryKey: ["safety-dashboard"] }); queryClient.invalidateQueries({ queryKey: ["student-overview"] }); setHazardOpen(false); setHazardForm({ category: "Poor lighting", severity: "Medium", location_id: "engineering", description: "" }); toast.success("Report received", { description: "Campus safety has been notified." }); }, onError: () => toast.error("Please add a little more detail to your report") });
  const emergencyMutation = useMutation({ mutationFn: (payload: { location_id: string; message: string }) => apiPost<EmergencyResponse>("/safety/emergency", payload), onSuccess: (data) => { setSosOpen(false); toast.success("Campus dispatch notified", { description: `Help is moving to ${data.location_name} · ETA ${data.eta_minutes} min` }); }, onError: () => toast.error("Dispatch is unavailable. Call campus police at 555-0144.") });
  const saveRouteMutation = useMutation({ mutationFn: (payload: Omit<SavedRoute, "id" | "student_id" | "saved_at">) => apiPost<SavedRoute>("/auth/saved-routes", payload), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["student-overview"] }); toast.success("Route saved to your profile"); }, onError: () => toast.error("Could not save this route") });
  const arrivalMutation = useMutation({ mutationFn: () => apiPost<void>("/auth/arrivals"), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["student-overview"] }); setNavigationActive(false); toast.success("Arrival checked in", { description: "Your safe arrival is now in your activity history." }); } });

  function calculateRoute() { planMutation.mutate({ origin_id: originId, destination_id: destinationId, priority }); }
  function handleMapLocation(locationId: string) { if (originId === locationId) setDestinationId(locationId === destinationId ? "student-union" : destinationId); else setOriginId(locationId); toast.info(`${locations.find((location) => location.id === locationId)?.name} selected`, { description: "Use the planner to set your route." }); }

  return <div className="dashboard-shell min-h-svh bg-[var(--app-bg)] text-[var(--ink)] selection:bg-[#06b6d4]/30">
    <header className="app-header sticky top-0 z-50 border-b backdrop-blur-xl" data-testid="header-navbar">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[#0891b2]/25 bg-[#0891b2]/10 text-[#0891b2]"><Shield size={19} /></div><div><div className="font-heading text-[15px] font-bold tracking-tight text-[var(--ink)]">Safe<span className="text-[#0891b2]">Route</span></div><div className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--muted-ink)]">Anurag University · Hyderabad</div></div></div>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation"><a href="#map" className="nav-link active" data-testid="nav-link-map"><Compass size={14} />Map & planner</a><a href="#hazards" className="nav-link" data-testid="nav-link-hazards"><AlertTriangle size={14} />Hazard hub <span className="ml-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#f59e0b]/15 px-1 text-[9px] text-[#fbbf24]">{openHazards.length || 3}</span></a><a href="#emergency" className="nav-link" data-testid="nav-link-emergency"><Siren size={14} />Emergency</a><a href="#dashboard" className="nav-link" data-testid="nav-link-dashboard"><Signal size={14} />Dashboard</a></nav>
        <div className="flex items-center gap-1"><ThemeToggle theme={theme} onToggle={onThemeToggle} /><div className="hidden items-center gap-2 rounded-lg border border-[var(--line)] px-2.5 py-1.5 sm:flex" data-testid="student-header-profile"><div className="grid h-6 w-6 place-items-center rounded-full bg-[#0d9488]/10 text-[#0d9488]"><UserRound size={13} /></div><span className="max-w-24 truncate text-xs font-semibold text-[var(--ink)]">{student.name}</span></div><Button variant="ghost" size="icon-sm" onClick={() => endSession()} aria-label="Sign out" data-testid="student-logout-button"><LogOut size={15} /></Button><Button variant="outline" size="sm" onClick={() => setSosOpen(true)} className="border-[#ef4444]/35 bg-[#ef4444]/10 text-[#dc2626] hover:bg-[#ef4444]/20" data-testid="sos-trigger-button"><Siren size={14} />Quick SOS</Button></div>
      </div>
    </header>

    <main className="mx-auto max-w-[1440px] space-y-7 px-4 py-7 sm:px-6 lg:px-8">
      {routePlan && selectedRoute && <section className="route-action-bar app-card" data-testid="personal-route-actions"><div><span className="route-action-eyebrow"><Bookmark size={13} />Personal route</span><strong>{routePlan.origin.name} → {routePlan.destination.name}</strong><small>{selectedRoute.name} · {selectedRoute.safety_score}% safety · {selectedRoute.minutes} min</small></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => saveRouteMutation.mutate({ origin_id: routePlan.origin.id, origin_name: routePlan.origin.name, destination_id: routePlan.destination.id, destination_name: routePlan.destination.name, route_name: selectedRoute.name, minutes: selectedRoute.minutes, safety_score: selectedRoute.safety_score })} disabled={saveRouteMutation.isPending} data-testid="save-route-button"><Bookmark size={14} />Save route</Button>{navigationActive && <Button size="sm" className="bg-[#0d9488] text-white hover:bg-[#0f766e]" onClick={() => arrivalMutation.mutate()} disabled={arrivalMutation.isPending} data-testid="record-safe-arrival-button"><Check size={14} />Record safe arrival</Button>}</div></section>}
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end" data-testid="page-intro"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#0891b2]"><span className="live-dot" />Anurag University · campus safety online</div><h1 className="max-w-3xl font-heading text-4xl font-extrabold leading-[.98] tracking-tight text-[var(--ink)] sm:text-5xl">Good evening, {student.name.split(" ")[0]}.<br /><span className="text-gradient">Where are you headed?</span></h1><p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted-ink)] sm:text-base">Plan a trusted route across campus, share a safe arrival, and keep help one tap away.</p></div><div className="campus-status flex items-center gap-3 rounded-xl px-4 py-3" data-testid="campus-status-banner"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#10b981]/10 text-[#059669]"><Check size={17} /></div><div><div className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#059669]">Campus status</div><div className="mt-0.5 text-sm font-semibold text-[var(--ink)]">{dashboard?.campus_status ?? "ALL CLEAR"}</div></div><ChevronRight size={15} className="ml-2 text-[#059669]" /></div></section>

      <section className="student-overview-grid" data-testid="student-overview-section"><div className="profile-summary app-card"><div className="student-avatar">{student.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><div className="text-xs font-bold uppercase tracking-[.16em] text-[#0d9488]">Student safety profile</div><h2 className="mt-1 font-heading text-xl font-bold text-[var(--ink)]">{student.name}</h2><p className="mt-1 text-xs text-[var(--muted-ink)]">{student.student_id} · {student.department}</p></div></div><div className="overview-stat app-card" data-testid="saved-routes-stat"><Bookmark size={17} /><strong>{overviewQuery.data?.saved_routes.length ?? 0}</strong><span>Saved routes</span></div><div className="overview-stat app-card" data-testid="safe-arrivals-stat"><Check size={17} /><strong>{overviewQuery.data?.safe_arrivals ?? 0}</strong><span>Safe arrivals</span></div><div className="overview-stat app-card" data-testid="report-history-stat"><AlertTriangle size={17} /><strong>{overviewQuery.data?.report_count ?? 0}</strong><span>Your reports</span></div></section>

      <section id="map" className="grid grid-cols-1 gap-5 lg:grid-cols-12" data-testid="map-planner-section"><div className="min-h-[470px] lg:col-span-8"><CampusMap locations={locations} hazards={hazards} selectedRoute={selectedRoute} zoom={zoom} onLocationClick={handleMapLocation} /></div><Card className="border-white/[0.09] bg-[#111827]/80 shadow-2xl shadow-black/20 lg:col-span-4" data-testid="safe-route-planner"><CardHeader className="border-b border-white/[0.07] px-5 pb-4 pt-5"><div className="flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#22d3ee]"><Navigation size={13} />Route planner</div><CardTitle className="font-heading text-xl text-white" data-testid="route-planner-title">Where are you headed?</CardTitle></div><span className="rounded-lg bg-white/5 p-2 text-slate-500"><ArrowRight size={16} /></span></div></CardHeader><CardContent className="space-y-4 p-5"><div><label htmlFor="origin-location" className="field-label">Starting from</label><select id="origin-location" value={originId} onChange={(event) => setOriginId(event.target.value)} className="route-select" data-testid="origin-location-select">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div><div className="relative"><div className="route-connector" /><label htmlFor="destination-location" className="field-label">Going to</label><select id="destination-location" value={destinationId} onChange={(event) => setDestinationId(event.target.value)} className="route-select" data-testid="destination-location-select">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div><div><div className="mb-2 flex items-center justify-between"><label htmlFor="route-priority" className="field-label mb-0">Route priority</label><span className="font-mono text-[9px] uppercase tracking-wider text-[#22d3ee]">{priority === "safety" ? "Safety first" : priority === "speed" ? "Fastest" : "Patrol nearby"}</span></div><div className="grid grid-cols-3 gap-1 rounded-lg border border-white/[0.08] bg-[#0b111d] p-1" id="route-priority">{(["safety", "speed", "patrol"] as const).map((item) => <button key={item} type="button" onClick={() => setPriority(item)} className={`rounded-md py-2 font-mono text-[9px] uppercase tracking-wider transition-colors ${priority === item ? "bg-[#06b6d4]/15 text-[#67e8f9]" : "text-slate-500 hover:text-slate-300"}`} data-testid={`route-priority-${item}`}>{item}</button>)}</div></div><Button className="h-11 w-full bg-[#06b6d4] font-bold text-[#06131a] shadow-[0_0_24px_rgba(6,182,212,0.16)] hover:bg-[#22d3ee]" onClick={calculateRoute} disabled={planMutation.isPending || originId === destinationId} data-testid="calculate-safe-route-btn"><Route size={16} />{planMutation.isPending ? "Calculating corridor..." : "Find safest route"}</Button>{routePlan && <div className="space-y-2 pt-2" data-testid="route-options-list"><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Route options</span><span className="font-mono text-[9px] text-[#6ee7b7]">{routePlan.origin.short_code} → {routePlan.destination.short_code}</span></div>{routePlan.options.map((option, index) => <RouteOptionCard key={option.id} option={option} index={index} selected={selectedRouteId === option.id} recommended={routePlan.recommended_id === option.id} onSelect={() => setSelectedRouteId(option.id)} />)}<Button variant="outline" className="mt-1 w-full border-white/10 text-slate-200 hover:bg-white/5" onClick={() => setNavigationActive(true)} data-testid="start-navigation-btn"><Navigation size={15} />Start navigation</Button></div>}</CardContent></Card></section>

      {navigationActive && selectedRoute && <section className="escort-hud rounded-2xl border border-[#22d3ee]/25 p-5 shadow-[0_0_40px_rgba(6,182,212,0.08)]" data-testid="active-escort-mode-hud"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-[#06b6d4]/15 text-[#67e8f9]"><Navigation size={21} /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#0d1e2c] bg-[#34d399]" /></div><div><div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#67e8f9]"><span className="live-dot" />Walk mode active</div><div className="font-heading text-lg font-bold text-white">Head to {routePlan?.destination.name}</div><div className="mt-1 text-xs text-slate-400">Stay on the illuminated corridor · {selectedRoute.minutes} min remaining</div></div></div><div className="flex gap-2"><Button variant="outline" size="sm" className="border-white/10 text-slate-300" onClick={() => { setNavigationActive(false); toast.success("Walk mode ended"); }} data-testid="end-navigation-btn"><X size={14} />End walk</Button><Button size="sm" className="bg-[#10b981] text-[#03140d] hover:bg-[#34d399]" onClick={() => { setNavigationActive(false); toast.success("Arrival checked in", { description: "Glad you made it safely." }); }} data-testid="arrived-safely-btn"><Check size={14} />I arrived safely</Button></div></div></section>}

      <section id="dashboard" className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="safety-metrics-container">{(dashboard?.metrics ?? [{ id: "coverage", label: "Safe path coverage", value: "89%", detail: "Live campus average", tone: "cyan" }, { id: "patrols", label: "Active patrols", value: "06 units", detail: "Across 4 campus zones", tone: "emerald" }, { id: "resolved", label: "Resolved today", value: "14", detail: "Safety team updates", tone: "amber" }, { id: "escort-eta", label: "Average escort ETA", value: "04 min", detail: "Fast response time", tone: "crimson" }]).map((metric) => <MetricCard key={metric.id} metric={metric} />)}</section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-7"><Card id="hazards" className="border-white/[0.09] bg-[#111827]/70 lg:col-span-4" data-testid="recent-hazards-panel"><CardHeader className="flex-row items-start justify-between border-b border-white/[0.07] px-5 py-5"><div><div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#fbbf24]">Situational awareness</div><CardTitle className="font-heading text-xl text-white">Recent campus reports</CardTitle></div><Button variant="outline" size="sm" onClick={() => setHazardOpen(true)} className="border-[#f59e0b]/25 text-[#fbbf24] hover:bg-[#f59e0b]/10" data-testid="report-hazard-btn"><AlertTriangle size={14} />Report hazard</Button></CardHeader><CardContent className="space-y-1 p-3">{(dashboard?.recent_hazards ?? hazards).slice(0, 4).map((hazard) => <div key={hazard.id} className="flex items-start gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-white/[0.035]" data-testid={`hazard-row-${hazard.id}`}><div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${hazard.severity === "High" ? "bg-[#ef4444]/10 text-[#fb7185]" : hazard.severity === "Medium" ? "bg-[#f59e0b]/10 text-[#fbbf24]" : "bg-[#10b981]/10 text-[#6ee7b7]"}`}><AlertTriangle size={15} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-200" data-testid={`hazard-category-${hazard.id}`}>{hazard.category}</span><Badge variant="outline" className={`px-1.5 py-0 text-[9px] ${severityClass(hazard.severity)}`}>{hazard.severity}</Badge></div><div className="mt-1 truncate text-xs text-slate-500" data-testid={`hazard-description-${hazard.id}`}>{hazard.description}</div><div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-slate-600"><MapPin size={11} />{hazard.location_name}<span>·</span>{formatReportedAt(hazard.reported_at)}</div></div><span className="mt-1 text-slate-600"><ChevronRight size={15} /></span></div>)}{(dashboard?.recent_hazards ?? hazards).length === 0 && <div className="px-3 py-8 text-center text-sm text-slate-500" data-testid="hazards-empty-state">No open reports on the map.</div>}</CardContent></Card><Card id="emergency" className="relative overflow-hidden border-[#ef4444]/20 bg-[radial-gradient(circle_at_100%_0%,rgba(239,68,68,0.13),transparent_42%),#111827]/85 lg:col-span-3" data-testid="emergency-contacts-panel"><div className="absolute -right-12 -top-12 h-36 w-36 rounded-full border border-[#ef4444]/10" /><CardHeader className="relative px-5 pb-3 pt-5"><div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#fb7185]"><Phone size={13} />Always within reach</div><CardTitle className="font-heading text-xl text-white">Need immediate help?</CardTitle><p className="mt-2 text-xs leading-relaxed text-slate-400">Connect with campus safety or send your live location to dispatch.</p></CardHeader><CardContent className="relative space-y-3 px-5 pb-5"><button type="button" onClick={() => setSosOpen(true)} className="sos-card flex w-full items-center justify-between rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-4 text-left transition-all duration-200 hover:border-[#ef4444]/60 hover:bg-[#ef4444]/15" data-testid="emergency-sos-card"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#ef4444]/15 text-[#fb7185]"><Siren size={19} /></div><div><div className="text-sm font-bold text-[#ffe4e6]">Campus Safety Dispatch</div><div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#fb7185]/70">24 / 7 · respond in ~3 min</div></div></div><ArrowRight size={17} className="text-[#fb7185]" /></button><div className="grid grid-cols-2 gap-2"><a href="tel:5550144" className="contact-link" data-testid="campus-police-call"><Phone size={14} />Campus police<span>555-0144</span></a><a href="tel:5550112" className="contact-link" data-testid="night-escort-call"><Headphones size={14} />Night escort<span>555-0112</span></a></div><div className="flex items-center gap-2 border-t border-white/[0.07] pt-3 font-mono text-[9px] uppercase tracking-wider text-slate-500" data-testid="emergency-location-note"><MapPin size={12} className="text-[#fb7185]" />Live location sharing is off until you ask for help</div></CardContent></Card></section>

      <footer className="flex flex-col justify-between gap-3 border-t border-[var(--line)] py-5 font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--muted-ink)] sm:flex-row" data-testid="app-footer"><span>SafeRoute · Anurag University, Hyderabad</span><span className="flex items-center gap-2"><CircleHelp size={12} />Need help? Contact student services</span></footer>
    </main>

    <Dialog open={hazardOpen} onOpenChange={setHazardOpen}><DialogContent className="border-white/10 bg-[#111827] text-slate-100 sm:max-w-[500px]" data-testid="hazard-report-form"><DialogHeader><DialogTitle className="font-heading text-2xl text-white">Report a campus hazard</DialogTitle><DialogDescription className="text-slate-400">Your report helps the next person choose a safer path.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div><label className="field-label" htmlFor="hazard-category">What did you notice?</label><select id="hazard-category" value={hazardForm.category} onChange={(event) => setHazardForm({ ...hazardForm, category: event.target.value as HazardCategory })} className="route-select" data-testid="hazard-category-select">{hazardCategories.map((category) => <option key={category}>{category}</option>)}</select></div><div><label className="field-label" htmlFor="hazard-severity">How urgent is it?</label><select id="hazard-severity" value={hazardForm.severity} onChange={(event) => setHazardForm({ ...hazardForm, severity: event.target.value as HazardSeverity })} className="route-select" data-testid="hazard-severity-select">{severityOptions.map((severity) => <option key={severity}>{severity}</option>)}</select></div><div><label className="field-label" htmlFor="hazard-location">Where is it?</label><select id="hazard-location" value={hazardForm.location_id} onChange={(event) => setHazardForm({ ...hazardForm, location_id: event.target.value })} className="route-select" data-testid="hazard-location-select">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div><div><label className="field-label" htmlFor="hazard-description">Add context</label><Textarea id="hazard-description" value={hazardForm.description} onChange={(event) => setHazardForm({ ...hazardForm, description: event.target.value })} placeholder="What should other students know?" className="min-h-24 resize-none border-white/10 bg-[#0b111d] text-slate-100 placeholder:text-slate-600" data-testid="hazard-description-input" /></div></div><DialogFooter><Button variant="outline" onClick={() => setHazardOpen(false)} className="border-white/10 text-slate-300" data-testid="hazard-cancel-btn">Cancel</Button><Button onClick={() => hazardMutation.mutate(hazardForm)} disabled={hazardMutation.isPending || hazardForm.description.trim().length < 5} className="bg-[#f59e0b] text-[#1b1203] hover:bg-[#fbbf24]" data-testid="hazard-submit-btn"><BellRing size={15} />{hazardMutation.isPending ? "Sending..." : "Send report"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={sosOpen} onOpenChange={setSosOpen}><DialogContent className="border-[#ef4444]/25 bg-[#17121c] text-slate-100 sm:max-w-[480px]" data-testid="emergency-sos-modal"><DialogHeader><div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-[#ef4444]/15 text-[#fb7185] shadow-[0_0_30px_rgba(239,68,68,0.18)]"><Siren size={25} className="sos-icon" /></div><DialogTitle className="text-center font-heading text-2xl text-white">Connect to campus dispatch?</DialogTitle><DialogDescription className="text-center text-slate-400">Your current location will be shared with Campus Safety. A dispatcher will call you back within 3 minutes.</DialogDescription></DialogHeader><div className="space-y-4 py-3"><div><label className="field-label" htmlFor="sos-location">Your location</label><select id="sos-location" value={sosLocationId} onChange={(event) => setSosLocationId(event.target.value)} className="route-select" data-testid="sos-location-select">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></div><div className="rounded-xl border border-[#ef4444]/15 bg-[#ef4444]/[0.06] p-3 text-xs leading-relaxed text-[#fecaca]" data-testid="sos-dispatch-note"><Radio size={14} className="mb-1 inline mr-2" />This is a demo dispatch. For immediate danger, call 911.</div></div><DialogFooter><Button variant="outline" onClick={() => setSosOpen(false)} className="border-white/10 text-slate-300" data-testid="cancel-sos-btn">Not now</Button><Button onClick={() => emergencyMutation.mutate({ location_id: sosLocationId, message: "Student requested immediate campus safety assistance." })} disabled={emergencyMutation.isPending} className="bg-[#ef4444] text-white hover:bg-[#f87171]" data-testid="emergency-call-dispatch-btn"><Phone size={15} />{emergencyMutation.isPending ? "Connecting..." : "Call campus dispatch"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}