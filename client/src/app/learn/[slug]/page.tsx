import type { Metadata } from "next";
import { LearningPage } from "@/components/workspace-pages";

export const metadata: Metadata = { title: "Keep learning" };
export default function Page() { return <LearningPage />; }
