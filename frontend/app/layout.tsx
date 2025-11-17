import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { StoreProvider } from "@/services/store/StoreProvider"

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
    <html lang="en" className="dark">
      <body className="font-inter antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}
