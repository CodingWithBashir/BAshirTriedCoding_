import type { Metadata } from "next";
import { CertificatesPage } from "@/components/collection-pages";

export const metadata: Metadata = { title: "Certificates" };
export default function Page() { return <CertificatesPage />; }
