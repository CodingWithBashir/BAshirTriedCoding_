import type { Metadata } from "next";
import { AdminPage } from "@/components/admin-page";

export const metadata: Metadata = {
  title: "Creator studio",
  description: "Private role-aware workspace for managing Coding With Bashir content, messages, and team access.",
  robots: { index: false, follow: false },
};

export default function Page() { return <AdminPage />; }
