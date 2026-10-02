import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource/caveat/500.css";
import "./globals.css";
import "./platform.css";
import "./learner.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LearnerProvider } from "@/components/learner-auth";

export const metadata: Metadata = {
  title: {
    default: "Bashir Hussein — Developer, Builder & Mentor",
    template: "%s · Coding With Bashir",
  },
  description:
    "The home of Bashir Hussein — a full-stack developer and founder building useful products and helping a new generation of African developers learn by creating.",
  applicationName: "Coding With Bashir",
  keywords: ["Bashir Hussein", "Rwanda developer", "Next.js", "web development", "learn to code"],
  openGraph: {
    title: "Bashir Hussein — Coding With Bashir",
    description: "Build, learn, create. A portfolio and learning home for developers.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <LearnerProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </LearnerProvider>
      </body>
    </html>
  );
}
