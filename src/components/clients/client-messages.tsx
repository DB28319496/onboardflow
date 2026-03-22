"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Message = {
  id: string;
  content: string;
  senderType: string;
  senderName: string;
  createdAt: string;
};

export function ClientMessages({ clientId }: { clientId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/clients/${clientId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setContent("");
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Portal Messages
        </p>
        {messages.length > 0 && (
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
            {messages.length}
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No messages yet.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.senderType === "TEAM" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-1.5 ${
                  msg.senderType === "TEAM"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 px-1">
                {msg.senderName} ·{" "}
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Reply to client..."
          rows={2}
          className="text-xs resize-none flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="shrink-0 self-end h-8"
        >
          {sending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}
