import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excel Visualizer",
  description: "Upload an Excel file and see it in a beautiful interactive UI."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-slate-50 antialiased">
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}

