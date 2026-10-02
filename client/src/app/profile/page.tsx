import type { Metadata } from "next";
import { ProfilePage } from "@/components/workspace-pages";

export const metadata: Metadata = { title: "Bashir's profile" };
export default function Page() { return <ProfilePage />; }
