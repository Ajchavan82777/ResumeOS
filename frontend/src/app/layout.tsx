import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResumeOS — Build ATS-Friendly Resumes",
  description: "Professional resume builder with AI assistant, ATS scoring, job description matching, and PDF/DOCX export.",
  keywords: "resume builder, ATS resume, CV maker, free resume, job application",
  openGraph: {
    title: "ResumeOS — Build Resumes That Get You Hired",
    description: "Create professional, ATS-optimized resumes in minutes.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: "#fff", color: "#1A1D23", border: "1.5px solid #E5E7EB", borderRadius: "10px", fontSize: "13px" },
            success: { iconTheme: { primary: "#57CDA4", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
