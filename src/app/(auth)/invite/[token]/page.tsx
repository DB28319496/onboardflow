import { prisma } from "@/lib/prisma";
import { InviteAcceptForm } from "@/components/invite/invite-accept-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { name: true, brandColor: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-border p-8 max-w-md w-full text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</p>
          <p className="text-sm text-muted-foreground">
            This invitation link is invalid or does not exist.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.acceptedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-border p-8 max-w-md w-full text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Already Accepted</p>
          <p className="text-sm text-muted-foreground">
            This invitation has already been used.{" "}
            <a href="/login" className="text-primary underline underline-offset-2">
              Sign in
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-border p-8 max-w-md w-full text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">Link Expired</p>
          <p className="text-sm text-muted-foreground">
            This invitation expired on{" "}
            {invitation.expiresAt.toLocaleDateString()}. Ask your workspace
            admin to send a new invite.
          </p>
        </div>
      </div>
    );
  }

  const inviterName =
    invitation.invitedBy.name ?? invitation.invitedBy.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-border p-8 max-w-md w-full">
        <div
          className="w-10 h-10 rounded-lg mb-5 flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: invitation.workspace.brandColor }}
        >
          {invitation.workspace.name.charAt(0)}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">You&apos;re invited!</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          <span className="font-medium text-gray-700">{inviterName}</span> has
          invited you to join{" "}
          <span className="font-medium text-gray-700">
            {invitation.workspace.name}
          </span>{" "}
          as a {invitation.role.charAt(0) + invitation.role.slice(1).toLowerCase()}.
        </p>
        <InviteAcceptForm token={token} email={invitation.email} />
      </div>
    </div>
  );
}
