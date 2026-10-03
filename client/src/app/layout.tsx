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
    default: "Coding With Bashir — Learn, Practice, Grow",
    template: "%s · Coding With Bashir",
  },
  description:
    "Learn coding at your own pace with authored lessons, private progress tracking, and verifiable course-completion certificates.",
  applicationName: "Coding With Bashir Learning",
  keywords: ["Coding With Bashir", "coding courses", "web development lessons", "learn to code", "learner certificates"],
  openGraph: {
    title: "Coding With Bashir Learning",
    description: "A learner-first space for real lessons, steady practice, and earned certificates.",
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
