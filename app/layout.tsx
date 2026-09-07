// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "국가R&D 통합공고 시스템",
  description: "NTIS 정부 부처 과제 사업공고 모니터링",
  icons: {
    // NTIS 공식 파비콘
    icon: "https://www.ntis.go.kr/favicon.ico",
    shortcut: "https://www.ntis.go.kr/favicon.ico",
    apple: "https://www.ntis.go.kr/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}