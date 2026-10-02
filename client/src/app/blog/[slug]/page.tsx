import type { Metadata } from "next";
import { BlogArticlePage } from "@/components/detail-pages";

export const metadata: Metadata = { title: "From the journal" };
export default function Page() { return <BlogArticlePage />; }
