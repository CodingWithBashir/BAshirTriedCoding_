import type { Metadata } from "next";
import { CertificateDetailPage } from "@/components/detail-pages";
import { RequireLearner } from "@/components/learner-auth";

export const metadata: Metadata = { title: "Certificate details" };
export default function Page() { return <RequireLearner><CertificateDetailPage /></RequireLearner>; }
