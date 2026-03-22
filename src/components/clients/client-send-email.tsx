"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { SendEmailDialog } from "./send-email-dialog";

export function ClientSendEmail({
  clientId,
  clientEmail,
}: {
  clientId: string;
  clientEmail: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-center"
        onClick={() => setOpen(true)}
      >
        <Mail className="h-3.5 w-3.5 mr-1.5" />
        Send Email
      </Button>
      <SendEmailDialog
        open={open}
        onClose={() => setOpen(false)}
        clientId={clientId}
        clientEmail={clientEmail}
      />
    </>
  );
}
