// Re-export from generic hook for backward compatibility
import { usePortalNotifications } from "./usePortalNotifications";

export function useDirectorNotifications() {
  return usePortalNotifications("director");
}
