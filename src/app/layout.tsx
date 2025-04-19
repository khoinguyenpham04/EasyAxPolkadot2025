import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PolkadotProvider } from "@/contexts/PolkadotContext" // Import PolkadotProvider
import { WalletProvider } from "@/contexts/WalletContext" // Import WalletProvider

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CryptoWallet - Manage Your Digital Assets",
  description: "A modern crypto wallet dashboard with portfolio tracking",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PolkadotProvider>
            <WalletProvider>
              {children}
            </WalletProvider>
          </PolkadotProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
