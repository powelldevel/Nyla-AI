import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nyla — Engineering foundation",
    template: "%s — Nyla",
  },
  description:
    "Nyla is an evidence-first organizational knowledge workspace currently in engineering foundation development.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <a
          className="sr-only z-50 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          href="#main-content"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
