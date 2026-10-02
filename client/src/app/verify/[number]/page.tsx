import type { Metadata } from "next";
import { CertificateVerificationPage } from "@/components/detail-pages";

export const metadata: Metadata = { title: "Verify a course certificate" };
export default function Page() { return <CertificateVerificationPage />; }
