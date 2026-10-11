export type HazardCategory =
  | "Poor lighting"
  | "Broken blue light"
  | "Construction"
  | "Suspicious activity";
export type HazardSeverity = "Low" | "Medium" | "High";

export interface CampusLocation {
  id: string;
  name: string;
  short_code: string;
  kind: string;
  x: number;
  y: number;
  description: string;
}

export interface Hazard {
  id: string;
  category: HazardCategory;
  severity: HazardSeverity;
  location_id: string;
  location_name: string;
  description: string;
  status: "Open" | "Investigating" | "Resolved";
  reported_at: string;
}

export interface HazardCreate {
  category: HazardCategory;
  severity: HazardSeverity;
  location_id: string;
  description: string;
}

export interface RouteOption {
  id: string;
  name: string;
  summary: string;
  distance_m: number;
  minutes: number;
  safety_score: number;
  lighting_score: number;
  patrol_status: string;
  waypoints: string[];
}

export interface RoutePlan {
  origin: CampusLocation;
  destination: CampusLocation;
  options: RouteOption[];
  recommended_id: string;
}

export interface SafetyMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "cyan" | "emerald" | "amber" | "crimson";
}

export interface DashboardResponse {
  metrics: SafetyMetric[];
  recent_hazards: Hazard[];
  campus_status: string;
  updated_at: string;
}

export interface EmergencyResponse {
  id: string;
  status: "Dispatched";
  location_name: string;
  message: string;
  eta_minutes: number;
  created_at: string;
}