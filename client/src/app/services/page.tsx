import type { Metadata } from "next";
import { ServicesPage } from "@/components/rich-pages";

export const metadata: Metadata = {
  title: "Services & project planner",
  description: "Explore product engineering, integrations, AI, design, and learning-product support from Coding With Bashir.",
};

export default function Page() { return <ServicesPage />; }
