import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Salesforce EA Discovery Assistant',
  description: 'AI-powered Enterprise Architecture artifacts for Salesforce',
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