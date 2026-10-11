# SafeRoute MVP Specification

## Purpose
SafeRoute is a no-login campus safety command center for Vanguard State University. Students can plan safer walking routes, see active campus hazards, report new hazards, access emergency contacts, and dispatch campus safety from a live-looking demo interface.

## Data model
- `CampusLocation`: fixed fictional campus landmarks with map coordinates.
- `Hazard`: category, severity, location, description, status, and server timestamp.
- `RoutePlan`: origin, destination, route options, safety scores, lighting scores, and patrol status.
- `EmergencyResponse`: dispatch status, location, message, ETA, and server timestamp.

## Key flows
1. Select an origin, destination, and route priority in the planner; calculate routes and select an option.
2. Start walk mode to display an active escort HUD, then check in safely or end navigation.
3. Open Report hazard, submit a category/severity/location/description, and see the dashboard refresh.
4. Open Quick SOS or the emergency card, select a location, and dispatch campus safety.
5. Review metrics and recent hazard reports in the command dashboard.

## Auth and roles
No authentication in the MVP. The experience is intentionally demo-ready and public.

## Backend API
All routes are under `/api/safety`: locations, hazards GET/POST, routes/plan POST, dashboard GET, and emergency POST.

## Demo assumptions
The map is a self-contained SVG campus map. Hazard and emergency records use MongoDB; the backend returns safe fallback campus data if the hazard collection is empty. No third-party integrations are used.