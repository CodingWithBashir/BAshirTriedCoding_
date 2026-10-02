import type { Metadata } from "next";
import { DashboardPage } from "@/components/workspace-pages";

export const metadata: Metadata = { title: "Learning dashboard" };
export default function Page() { return <DashboardPage />; }
