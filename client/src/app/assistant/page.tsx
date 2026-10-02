import type { Metadata } from "next";
import { AssistantPage } from "@/components/workspace-pages";

export const metadata: Metadata = { title: "AI learning assistant" };
export default function Page() { return <AssistantPage />; }
