import ChatClient from "@/sections/ChatClinent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RDC & IIC Assistant| Sibsagar University",
  description:
    "Bilingual (Assamese and English) AI assistant for Sibsagar University",
};

export default function ChatPage() {
  return <ChatClient/>;
}