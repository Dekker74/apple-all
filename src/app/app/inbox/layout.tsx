import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox",
  description:
    "Connessioni, messaggi e appuntamenti di ritiro/consegna: prenota la logistica Offcut con breakdown economico trasparente.",
};

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
