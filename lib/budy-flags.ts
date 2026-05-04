import type { Organization } from "@/lib/api-organizations";

export function isBudyWorkspaceEnabled(_organization: Organization | null): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_BUDY_WORKSPACE === "false") {
    return false;
  }

  return true;
}
