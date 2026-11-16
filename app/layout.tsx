import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "TRG Member Verification",
  description: "Secure, consent-based Discord member verification."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
