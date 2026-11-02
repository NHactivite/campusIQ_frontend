import ChatClient from "@/sections/ChatClinent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CampusIQ Assistant | Sibsagar University",
  description:
    "Bilingual (Assamese and English) AI assistant for Sibsagar University regulations, exams, scholarships, admissions and notices.",
};

export default function ChatPage() {
  return <ChatClient/>;
}