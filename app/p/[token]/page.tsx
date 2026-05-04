import { PublicProposalViewer } from "@/components/features/budy/PublicProposalViewer";

interface PublicProposalPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PublicProposalPage({ params }: PublicProposalPageProps) {
  const { token } = await params;

  return <PublicProposalViewer token={token} />;
}
