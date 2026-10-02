import type { Metadata } from "next";
import { BlogPage } from "@/components/collection-pages";

export const metadata: Metadata = { title: "Blog & Articles" };
export default function Page() { return <BlogPage />; }
