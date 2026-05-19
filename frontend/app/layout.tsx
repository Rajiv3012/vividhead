// This import provides React node typing for layout props.
import type { ReactNode } from "react";
// This import provides global stylesheet registration.
import "./globals.css";

// This type defines expected props for the root layout component.
type RootLayoutProps = {
  // This field provides nested page content for App Router.
  children: ReactNode;
};

// This export provides static metadata for browser tabs.
export const metadata = {
  // This title brands the app in the document head.
  title: "VividHead",
  // This description summarizes the system purpose.
  description: "Translate ISL head Non-Manual Features into grammatical modifiers.",
};

// This component defines the root HTML shell for all routes.
export default function RootLayout({ children }: RootLayoutProps) {
  // This return renders semantic html and body wrappers.
  return (
    // This line sets document language for accessibility tools.
    <html lang="en">
      {/* This body applies anti-gravity background and text color. */}
      <body className="bg-cosmic">{children}</body>
    </html>
  );
}
