import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ UUID Validation Utilities
export function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

export function validateAndSecureUUID(uuid: string | null | undefined, context?: string): string | null {
  if (!isValidUUID(uuid)) {
    console.warn(`⚠️ Invalid UUID provided${context ? ` in ${context}` : ''}:`, { 
      providedValue: uuid,
      type: typeof uuid,
      context 
    });
    return null;
  }
  return uuid as string;
}

// Helper for API calls that require UUIDs
export function assertValidUUID(uuid: string | null | undefined, apiEndpoint?: string): string {
  const validUuid = validateAndSecureUUID(uuid, apiEndpoint);
  if (!validUuid) {
    throw new Error(`Invalid UUID required for API call${apiEndpoint ? ` to ${apiEndpoint}` : ''}: ${uuid}`);
  }
  return validUuid;
}
