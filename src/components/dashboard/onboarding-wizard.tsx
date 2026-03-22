"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GitBranch,
  Users,
  Zap,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type Step = "pipeline" | "client" | "done";

const DEFAULT_STAGES = [
  { name: "New Lead", color: "#6366F1" },
  { name: "Contacted", color: "#3B82F6" },
  { name: "In Progress", color: "#F59E0B" },
  { name: "Review", color: "#10B981" },
  { name: "Completed", color: "#22C55E" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pipeline");
  const [loading, setLoading] = useState(false);

  // Pipeline step
  const [pipelineName, setPipelineName] = useState("");

  // Client step
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  async function createPipeline() {
    if (!pipelineName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pipelineName.trim(),
          isDefault: true,
        }),
      });
      if (!res.ok) throw new Error();
      const pipeline = await res.json();

      // Create default stages
      for (let i = 0; i < DEFAULT_STAGES.length; i++) {
        await fetch(`/api/pipelines/${pipeline.id}/stages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: DEFAULT_STAGES[i].name,
            color: DEFAULT_STAGES[i].color,
            daysExpected: i < DEFAULT_STAGES.length - 1 ? 7 : undefined,
          }),
        });
      }

      toast.success("Pipeline created with default stages");
      setStep("client");
    } catch {
      toast.error("Failed to create pipeline");
    } finally {
      setLoading(false);
    }
  }

  async function addClient() {
    if (!clientName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName.trim(),
          email: clientEmail.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("First client added!");
      setStep("done");
    } catch {
      toast.error("Failed to add client");
    } finally {
      setLoading(false);
    }
  }

  function finish() {
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { key: "pipeline", icon: GitBranch, label: "Pipeline" },
            { key: "client", icon: Users, label: "Client" },
            { key: "done", icon: Check, label: "Done" },
          ].map((s, i) => {
            const isActive = s.key === step;
            const isDone =
              (s.key === "pipeline" && step !== "pipeline") ||
              (s.key === "client" && step === "done");
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 ${isDone || isActive ? "bg-primary" : "bg-border"}`}
                  />
                )}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary/10 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {step === "pipeline" && (
          <div className="text-center space-y-6">
            <div>
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold">Welcome to Cadence!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Let's set up your first pipeline to start tracking clients.
              </p>
            </div>
            <div className="text-left space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Pipeline Name</label>
                <Input
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="e.g., Sales Pipeline, Client Onboarding"
                  className="h-10"
                  onKeyDown={(e) => e.key === "Enter" && createPipeline()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                We'll create 5 default stages: New Lead → Contacted → In Progress → Review → Completed.
                You can customize them later.
              </p>
            </div>
            <Button onClick={createPipeline} disabled={!pipelineName.trim() || loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Create Pipeline
            </Button>
          </div>
        )}

        {step === "client" && (
          <div className="text-center space-y-6">
            <div>
              <Users className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold">Add Your First Client</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Start tracking a client through your pipeline.
              </p>
            </div>
            <div className="text-left space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Client Name *</label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="contact@acme.com"
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={finish} className="flex-1">
                Skip for now
              </Button>
              <Button onClick={addClient} disabled={!clientName.trim() || loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                Add Client
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-6">
            <div>
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold">You're All Set!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your pipeline is ready and your first client has been added. Head to the dashboard to start managing your workflow.
              </p>
            </div>
            <Button onClick={finish} className="w-full">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
