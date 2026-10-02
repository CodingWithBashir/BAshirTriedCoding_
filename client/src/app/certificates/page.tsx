import type { Metadata } from "next";
import { CertificatesPage } from "@/components/collection-pages";
import { RequireLearner } from "@/components/learner-auth";

export const metadata: Metadata = { title: "Certificates" };
export default function Page() { return <RequireLearner><CertificatesPage /></RequireLearner>; }
