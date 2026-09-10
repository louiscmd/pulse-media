import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Socialy',
  description: 'Client portal for Socialy agency',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
