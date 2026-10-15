import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import CartDrawer from "@/components/CartDrawer";

export const metadata: Metadata = {
  title: "Dough & Drizzle 🍪 – Home Bakery",
  description: "Fresh homemade cookies, muffins, brownies & cinnamon rolls. Order your sweet treats from Dough & Drizzle!",
  keywords: ["bakery", "cookies", "muffins", "brownies", "cinnamon rolls", "home baked", "order online"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f9a8c9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {children}
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
