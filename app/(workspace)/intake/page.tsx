/**
 * Legacy /intake redirect. Phase 4 of the Proposal unification moved the
 * proposal creation form to /proposals/new. This redirect preserves any
 * external bookmarks, deep links, or query-string flows (e.g.
 * /intake?review_rfx_id=...) for one release; Phase 5 deletes the file.
 */

import { redirect } from "next/navigation";

export default async function IntakeRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) query.append(key, v);
    }
  }
  const suffix = query.toString();
  redirect(suffix ? `/proposals/new?${suffix}` : "/proposals/new");
}
