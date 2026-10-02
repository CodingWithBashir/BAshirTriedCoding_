import type { Metadata } from "next";
import { AboutPage } from "@/components/rich-pages";

export const metadata: Metadata = {
  title: "About Bashir",
  description: "The values, process, and curiosity behind Coding With Bashir.",
};

export default function Page() { return <AboutPage />; }
