import { headers } from "next/headers"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

const title = "Clad Hole Cleaner"
const description =
  "Remove unused prefab holes from composed Circuit JSON without board-specific identifiers."

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers()
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const protocol = requestHeaders.get("x-forwarded-proto")
    ?? (host?.startsWith("localhost") ? "http" : "https")
  const image = host ? `${protocol}://${host}/og.png` : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, width: 1536, height: 1024, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

