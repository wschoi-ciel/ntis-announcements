import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "국가R&D 통합공고 시스템",
  description: "NTIS 정부 부처별 사업공고 실시간 모니터링",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-[#f8fafc] text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}