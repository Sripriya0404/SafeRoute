# SafeRoute MVP Specification

## Purpose
SafeRoute is a student campus safety platform for Anurag University, Hyderabad. Students sign in to plan safer walking routes, save preferred routes, record safe arrivals, see active hazards, report concerns, access emergency contacts, and dispatch campus safety from a polished light/dark interface.

## Data model
- `CampusLocation`: fixed fictional campus landmarks with map coordinates.
- `Hazard`: category, severity, location, description, status, and server timestamp.
- `RoutePlan`: origin, destination, route options, safety scores, lighting scores, and patrol status.
- `EmergencyResponse`: dispatch status, location, message, ETA, and server timestamp.
- `Student`: name, university email, student ID, department, year, and account timestamp.
- `SavedRoute`: student-owned origin/destination, route type, travel time, and safety score.

## Key flows
1. Select an origin, destination, and route priority in the planner; calculate routes and select an option.
2. Start walk mode to display an active escort HUD, then check in safely or end navigation.
3. Open Report hazard, submit a category/severity/location/description, and see the dashboard refresh.
4. Open Quick SOS or the emergency card, select a location, and dispatch campus safety.
5. Review metrics and recent hazard reports in the command dashboard.
6. Save a calculated route for quick access from the student overview.
7. Toggle between light and dark mode; preference is stored in the browser.

## Auth and roles
Email/password student authentication uses an httpOnly same-origin session cookie. Demo account: `student@anurag.edu.in` / `SafeRoute@2026`. New students can register from the login screen.

## Backend API
Safety routes remain under `/api/safety`. Student authentication and personalized data are under `/api/auth`: signup, login, me, logout, overview, saved-routes, and arrivals.

## Demo assumptions
The route map is a self-contained SVG modeled with Anurag University campus labels. The login page uses a public university-style campus photograph from Unsplash; it is illustrative rather than an official Anurag University asset. Emergency dispatch remains a demo flow and does not contact real emergency services.