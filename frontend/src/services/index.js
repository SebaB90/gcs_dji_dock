// ======================
// SERVICES INDEX
// Export all services from a single location
// ======================

export { default as authService } from "./auth.service";
export { default as missionService } from "./mission.service";
export { default as videoService } from "./video.service";
export { default as dockService } from "./dock.service";
export { default as api } from "./api";

// Note: telemetryService has been merged into dockService
// Use dockService.getTelemetry() instead
