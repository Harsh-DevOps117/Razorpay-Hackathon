import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" })
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "AI Revenue Recovery",
  description: "Revenue Recovery Agent",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans min-h-screen antialiased bg-[#0f0f0f] text-[#a8a8a8]`}>
        <header className="h-16 flex items-center bg-[#0f0f0f] border-b border-[#222222]">
          <div className="max-w-[1200px] w-full mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-medium text-white text-[16px] tracking-tight hover:text-[#00d4ff] transition-colors">
                RecoveryAgent
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-[#a8a8a8]">
                <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
                <Link href="/evaluation" className="hover:text-white transition-colors">Batch Evaluation</Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-[1200px] mx-auto px-6 py-24 min-h-[calc(100vh-64px)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] max-w-[800px] pointer-events-none bg-spotlight"></div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
