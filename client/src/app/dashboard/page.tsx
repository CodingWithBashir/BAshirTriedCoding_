import type { Metadata } from "next";
import { DashboardPage } from "@/components/workspace-pages";
import { RequireLearner } from "@/components/learner-auth";

export const metadata: Metadata = { title: "Learning dashboard" };
export default function Page() { return <RequireLearner><DashboardPage /></RequireLearner>; }
