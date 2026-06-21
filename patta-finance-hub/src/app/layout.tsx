import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Patta Finance Hub | ระบบรวมข้อมูลการเงินและ AI อัจฉริยะ",
  description: "ระบบแดชบอร์ดบริหารจัดการข้อมูลการเงินรวมของธุรกิจ Patta Shop และ Truck Dispatch วิเคราะห์การเงินด้วย AI น้องนินา",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col antialiased selection:bg-[#c5a880]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
