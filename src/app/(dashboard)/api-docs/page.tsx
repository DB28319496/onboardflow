import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ApiDocsClient } from "@/components/api-docs/api-docs-client";

export default async function ApiDocsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: { select: { apiKey: true, slug: true } } },
  });
  if (!member) redirect("/login");

  return (
    <ApiDocsClient
      apiKey={member.workspace.apiKey}
      slug={member.workspace.slug}
    />
  );
}
