import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { StoreProvider } from "@/services/store/StoreProvider"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Brandstream - AI Creative Platform",
  description: "Transform your brief into creative assets with AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-inter antialiased">
        <ThemeProvider>
          <StoreProvider>{children}</StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
