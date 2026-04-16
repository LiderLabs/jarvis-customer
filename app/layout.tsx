import type { Metadata } from "next"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/providers/theme-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { OrderProvider } from "@/context/OrderContext"

export const metadata: Metadata = {
  title: "Jarvis - Campus Laundry Made Easy",
  description: "Wash. Dry. Fold. Done. Professional laundry service for campus life.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jarvis",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/service-worker.js'); }); }` }} />
        <AuthProvider>
          <OrderProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </OrderProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
