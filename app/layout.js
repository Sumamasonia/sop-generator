import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SOPly — AI-Powered SOP Management Platform",
  description: "Turn any business process into a documented SOP in 5 minutes. Assign to employees, track who read them, test understanding with quizzes, and chat with AI over your docs.",
  metadataBase: new URL("https://sop-generator-ecru.vercel.app"),
  openGraph: {
    title: "SOPly — AI-Powered SOP Management Platform",
    description: "Turn any business process into a documented SOP in 5 minutes. AI generation, employee assignments, read receipts, quizzes, and more.",
    url: "https://sop-generator-ecru.vercel.app",
    siteName: "SOPly",
    images: [
      {
        url: "/soply_og_image.svg",
        width: 1200,
        height: 630,
        alt: "SOPly — AI-Powered SOP Management Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOPly — AI-Powered SOP Management Platform",
    description: "Turn any business process into a documented SOP in 5 minutes.",
    images: ["/soply_og_image.svg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}