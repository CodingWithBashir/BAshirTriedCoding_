import type { Metadata } from "next";
import { CertificateDetailPage } from "@/components/detail-pages";

export const metadata: Metadata = { title: "Certificate details" };
export default function Page() { return <CertificateDetailPage />; }
