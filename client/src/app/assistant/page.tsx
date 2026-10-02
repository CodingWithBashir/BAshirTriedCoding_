import type { Metadata } from "next";
import { AssistantPage } from "@/components/workspace-pages";
import { RequireLearner } from "@/components/learner-auth";

export const metadata: Metadata = { title: "AI learning assistant" };
export default function Page() { return <RequireLearner><AssistantPage /></RequireLearner>; }
