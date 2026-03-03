import { redirect } from "next/navigation";

interface BudgetRedirectPageProps {
  params: Promise<{
    id: string;
  }>;
}

const UUID_V4_OR_COMPAT_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function BudgetRedirectPage({ params }: BudgetRedirectPageProps) {
  const { id } = await params;
  if (!id || id === "undefined" || id === "null" || !UUID_V4_OR_COMPAT_REGEX.test(id)) {
    redirect("/dashboard");
  }
  redirect(`/rfx-result-wrapper-v2/data/${id}?tab=presupuesto`);
}
