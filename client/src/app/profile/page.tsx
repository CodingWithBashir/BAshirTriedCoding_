import type { Metadata } from "next";
import { ProfilePage } from "@/components/workspace-pages";
import { RequireLearner } from "@/components/learner-auth";

export const metadata: Metadata = { title: "My learning profile" };
export default function Page() { return <RequireLearner><ProfilePage /></RequireLearner>; }
