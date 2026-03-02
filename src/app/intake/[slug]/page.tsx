import { prisma } from "@/lib/prisma";
import { IntakeForm } from "@/components/intake/intake-form";

export default async function IntakePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { name: true, brandColor: true, intakeEnabled: true },
  });

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-border p-8 max-w-md w-full text-center">
          <p className="text-xl font-bold text-gray-900 mb-2">Not Found</p>
          <p className="text-sm text-muted-foreground">This intake form doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  if (!workspace.intakeEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-border p-8 max-w-md w-full text-center">
          <div
            className="w-10 h-10 rounded-lg mb-5 mx-auto flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: workspace.brandColor }}
          >
            {workspace.name.charAt(0)}
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">{workspace.name}</p>
          <p className="text-sm text-muted-foreground">
            The intake form for this workspace is currently unavailable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Branded header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: workspace.brandColor }}
          >
            {workspace.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{workspace.name}</p>
            <p className="text-xs text-muted-foreground">New Client Intake</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Get in Touch</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Fill out the form below and we&apos;ll reach out to get your project started.
          </p>
          <IntakeForm slug={slug} />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by OnboardFlow
        </p>
      </div>
    </div>
  );
}
