import type { Metadata } from "next";
import { CoursesPage } from "@/components/collection-pages";

export const metadata: Metadata = { title: "Courses" };
export default function Page() { return <CoursesPage />; }
