import Link from 'next/link';

export const metadata = {
  title: 'SupportCopilot - AI-Powered Support Tickets',
  description: 'Manage support tickets faster with AI drafts from your knowledge base.',
  openGraph: {
    title: 'SupportCopilot',
    description: 'AI-Powered Support Tickets',
    url: 'https://supportcopilot.com',
    siteName: 'SupportCopilot',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SupportCopilot",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background text-foreground">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-primary">SupportCopilot</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          Supercharge your support team with context-aware AI drafts powered by your internal Knowledge Base.
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:bg-primary/90 transition-colors">
            Agent Login
          </Link>
          <Link href="/tickets" className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-semibold hover:bg-secondary/80 transition-colors">
            View Tickets
          </Link>
        </div>
      </main>
    </>
  );
}
