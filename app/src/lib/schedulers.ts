// Stubs for scheduling providers (wire real APIs later)
export type SchedulerProvider = "calendly" | "nexhealth" | "jane" | "flexbooker" | "custom";

export function getSchedulerLink(provider: SchedulerProvider, idOrUrl?: string) {
  if (!idOrUrl) return "https://calendly.com/your-link"; // default demo
  return idOrUrl; // for now, treat as URL
}