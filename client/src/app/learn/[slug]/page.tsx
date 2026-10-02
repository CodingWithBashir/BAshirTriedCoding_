import type { Metadata } from "next";
import { LearningPage } from "@/components/workspace-pages";
import { RequireLearner } from "@/components/learner-auth";

export const metadata: Metadata = { title: "Keep learning" };
export default function Page() { return <RequireLearner><LearningPage /></RequireLearner>; }
