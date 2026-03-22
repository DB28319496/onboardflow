"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Message = {
  id: string;
  content: string;
  senderType: string;
  senderName: string;
  createdAt: string;
};

export function PortalMessages({
  token,
  clientName,
  brandColor,
}: {
  token: string;
  clientName: string;
  brandColor: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/portal/${token}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/portal/${token}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), senderName: clientName }),
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-4 w-4 text-gray-500" />
        <p className="text-sm font-semibold text-gray-700">Messages</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No messages yet. Send a message to your project team.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.senderType === "CLIENT" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 ${
                      msg.senderType === "CLIENT"
                        ? "text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                    style={
                      msg.senderType === "CLIENT"
                        ? { background: brandColor }
                        : undefined
                    }
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 px-1">
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
              placeholder="Type a message..."
              rows={2}
              className="text-sm resize-none flex-1 border-gray-200"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!content.trim() || sending}
              className="shrink-0 self-end"
              style={{ background: brandColor }}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
