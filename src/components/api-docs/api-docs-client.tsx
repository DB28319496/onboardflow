"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Endpoint = {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  body?: string;
  response?: string;
};

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/clients",
    description: "List all clients in your workspace. Supports filtering by pipelineId, stageId, and status query parameters.",
    auth: true,
    response: '[{ "id": "...", "name": "Acme Corp", "email": "...", "status": "ACTIVE", ... }]',
  },
  {
    method: "POST",
    path: "/api/clients",
    description: "Create a new client. Automatically assigns to the default pipeline's first stage if no pipelineId/stageId provided.",
    auth: true,
    body: '{ "name": "Acme Corp", "email": "hello@acme.com", "projectType": "Consulting", "projectValue": 5000 }',
  },
  {
    method: "GET",
    path: "/api/clients/:clientId",
    description: "Get full client details including stage, pipeline, activities, documents, and custom field values.",
    auth: true,
  },
  {
    method: "PATCH",
    path: "/api/clients/:clientId",
    description: "Update client fields. Supports partial updates — only send fields you want to change.",
    auth: true,
    body: '{ "status": "COMPLETED", "notes": "Project delivered" }',
  },
  {
    method: "POST",
    path: "/api/clients/:clientId/move",
    description: "Move a client to a different stage. Fires STAGE_ENTRY automations and webhooks.",
    auth: true,
    body: '{ "stageId": "stage_abc123" }',
  },
  {
    method: "GET",
    path: "/api/pipelines",
    description: "List all pipelines in your workspace.",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/pipelines/:pipelineId",
    description: "Get pipeline details including all stages with client counts.",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/email-templates",
    description: "List all email templates in your workspace.",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/clients/:clientId/send-email",
    description: "Send a manual email to a client. Use templateId for template-based or provide subject + body for custom.",
    auth: true,
    body: '{ "templateId": "tmpl_abc123" }\n// or\n{ "subject": "Follow up", "body": "<p>Hi {{client_name}}...</p>" }',
  },
  {
    method: "POST",
    path: "/api/intake/:slug",
    description: "Submit an intake form (public, no auth). Creates a client in the workspace and fires automations.",
    auth: false,
    body: '{ "name": "New Lead", "email": "lead@example.com", "phone": "555-1234" }',
  },
  {
    method: "GET",
    path: "/api/webhooks",
    description: "List all configured webhooks.",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/webhooks",
    description: "Create a new webhook endpoint. Events: CLIENT_CREATED, STAGE_CHANGE, CLIENT_COMPLETED, CLIENT_DELETED, EMAIL_SENT.",
    auth: true,
    body: '{ "url": "https://example.com/webhook", "events": ["CLIENT_CREATED", "STAGE_CHANGE"] }',
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-600",
};

export function ApiDocsClient({ apiKey, slug }: { apiKey: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  function copyKey() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4 border-b border-border/50">
        <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Use these endpoints to integrate Cadence with external tools.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-3xl">
        {/* Authentication */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Authentication</h2>
          <p className="text-sm text-muted-foreground">
            Include your API key in the <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">Authorization</code> header as a Bearer token.
          </p>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Your API Key</span>
              <button
                onClick={copyKey}
                className="text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <code className="text-xs font-mono break-all">{apiKey}</code>
          </div>
          <div className="rounded-lg border border-border bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400 mb-1">Example request</p>
            <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap">
{`curl -H "Authorization: Bearer ${apiKey.slice(0, 8)}..." \\
     -H "Content-Type: application/json" \\
     https://your-domain.com/api/clients`}
            </pre>
          </div>
        </section>

        {/* Webhook Payload */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Webhook Payloads</h2>
          <p className="text-sm text-muted-foreground">
            Webhooks send POST requests with an HMAC-SHA256 signature in the <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">X-Cadence-Signature</code> header. Verify against your webhook secret.
          </p>
          <div className="rounded-lg border border-border bg-zinc-950 p-3">
            <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap">
{`{
  "event": "CLIENT_CREATED",
  "timestamp": "2026-03-22T10:30:00.000Z",
  "data": {
    "clientId": "cl_abc123",
    "name": "Acme Corp",
    "email": "hello@acme.com",
    "stage": "New Lead"
  }
}`}
            </pre>
          </div>
        </section>

        {/* Intake Form */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Intake Form URL</h2>
          <p className="text-sm text-muted-foreground">
            Your public intake form accepts POST requests without authentication:
          </p>
          <code className="text-xs font-mono bg-muted px-2 py-1 rounded block">
            POST /api/intake/{slug}
          </code>
        </section>

        {/* Endpoints */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Endpoints</h2>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border/50">
            {ENDPOINTS.map((ep) => {
              const key = `${ep.method}-${ep.path}`;
              const isExpanded = expanded === key;
              return (
                <div key={key}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : key)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors text-left"
                  >
                    <Badge className={`${METHOD_COLORS[ep.method]} text-[10px] font-bold w-12 justify-center`}>
                      {ep.method}
                    </Badge>
                    <code className="text-xs font-mono flex-1">{ep.path}</code>
                    {!ep.auth && (
                      <Badge variant="outline" className="text-[10px]">Public</Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-2">
                      <p className="text-xs text-muted-foreground">{ep.description}</p>
                      {ep.body && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Request Body</p>
                          <div className="rounded border border-border bg-zinc-950 p-2">
                            <pre className="text-[11px] text-zinc-200 font-mono whitespace-pre-wrap">{ep.body}</pre>
                          </div>
                        </div>
                      )}
                      {ep.response && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Response</p>
                          <div className="rounded border border-border bg-zinc-950 p-2">
                            <pre className="text-[11px] text-zinc-200 font-mono whitespace-pre-wrap">{ep.response}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Merge Fields */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Email Merge Fields</h2>
          <p className="text-sm text-muted-foreground">
            Use these tokens in email templates — they're automatically replaced with client data.
          </p>
          <div className="grid grid-cols-2 gap-1">
            {[
              "{{client_name}}", "{{client_email}}", "{{client_phone}}",
              "{{project_type}}", "{{project_value}}", "{{stage_name}}",
              "{{workspace_name}}", "{{company_name}}", "{{portal_url}}",
              "{{days_in_stage}}",
            ].map((token) => (
              <code key={token} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {token}
              </code>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
