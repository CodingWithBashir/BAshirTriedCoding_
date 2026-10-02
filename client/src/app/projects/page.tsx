import type { Metadata } from "next";
import { ProjectsPage } from "@/components/collection-pages";

export const metadata: Metadata = { title: "Projects" };
export default function Page() { return <ProjectsPage />; }
