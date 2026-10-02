import type { Metadata } from "next";
import { ResourcesPage } from "@/components/rich-pages";

export const metadata: Metadata = {
  title: "Learning resources",
  description: "A searchable learning library of courses, project examples, tutorials, and practical next steps.",
};

export default function Page() { return <ResourcesPage />; }
