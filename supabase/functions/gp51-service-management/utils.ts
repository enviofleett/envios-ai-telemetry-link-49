
import { md5_for_gp51_only } from "../_shared/crypto_utils.ts";
import { GP51_API_URL } from "../_shared/constants.ts";

// Re-export commonly used utilities
export { md5_for_gp51_only as md5_sync, GP51_API_URL };

// Additional utility functions for GP51 service management
export function calculateLatency(startTime: number): number {
  return Date.now() - startTime;
}

export function formatApiError(error: any, context?: string): string {
  const baseMessage = error instanceof Error ? error.message : 'Unknown error';
  return context ? `${context}: ${baseMessage}` : baseMessage;
}

export function isSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

export function getTimeUntilExpiry(expiresAt: string): number {
  return new Date(expiresAt).getTime() - new Date().getTime();
}

export function needsSessionRefresh(expiresAt: string, bufferMinutes: number = 10): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(expiresAt);
  return timeUntilExpiry < bufferMinutes * 60 * 1000;
}
