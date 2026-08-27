import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { BackToTop } from "@/components/shared/back-to-top";
import { CommandPalette } from "@/components/shared/command-palette";
import { SectionNavDots } from "@/components/shared/section-nav-dots";
import { SectionEnterObserver } from "@/components/shared/section-enter-observer";
import { RippleController } from "@/components/shared/ripple-controller";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = "https://volatility-vince-ai-cloudflare-project.pages.dev";
const TWITTER = "@kruppcapital";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Volatility Vince — Institutional Quant Intelligence Telegram Chatbot",
    template: "%s | Volatility Vince by Krupp Capital",
  },
  description:
    "Volatility Vince is the institutional-grade Quant Intelligence Telegram Chatbot by Krupp Capital. Calculate GEX/DEX/VEX levels, generate charts, price options with Black-Scholes & 12 Greeks, run Monte Carlo VaR, detect market regimes with HMM/GMM, and execute 100+ research commands — all from Telegram. Available as a standalone module.",
  keywords: [
    "Volatility Vince",
    "quant chatbot",
    "Telegram trading bot",
    "GEX calculator",
    "gamma exposure",
    "DEX dealer exposure",
    "options analytics",
    "Black-Scholes",
    "Greeks calculator",
    "Vanna Charm Vomma",
    "volatility surface",
    "SABR SVI",
    "Monte Carlo VaR",
    "Kelly sizing",
    "market regime detection",
    "HMM GMM",
    "Krupp Capital",
    "Trading Suite",
    "institutional trading tools",
    "retail quant",
  ],
  authors: [{ name: "Krupp Capital", url: "https://kruppcapital.com" }],
  creator: "Krupp Capital",
  publisher: "Krupp Capital",
  icons: {
    icon: [
      { url: "/kc-mint.svg", type: "image/svg+xml" },
      { url: "/kc-mint-32.png", sizes: "32x32", type: "image/png" },
      { url: "/kc-mint-16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/kc-mint.ico",
    apple: [{ url: "/kc-mint-apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/kc-mint.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Volatility Vince — Institutional Quant Intelligence Telegram Chatbot",
    description:
      "A hedgefund-grade quant research desk in your Telegram. GEX/DEX/VEX levels, 12 Greeks, SABR/SVI vol surfaces, Monte Carlo VaR, regime detection and 100+ research commands. Standalone module of the Krupp Capital Trading Suite.",
    url: SITE_URL,
    siteName: "Volatility Vince",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "VolatilityVinceAI — A hedgefund quant engine & research desk. Wired into a chatbot.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Volatility Vince — Institutional Quant Intelligence Telegram Chatbot",
    description:
      "Hedgefund-grade quant research in your Telegram. GEX levels, 12 Greeks, SABR/SVI vol surfaces, Monte Carlo VaR, regime detection, 100+ commands. Standalone module.",
    creator: TWITTER,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "finance",
};

export const viewport: Viewport = {
  themeColor: "#00d99a",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Volatility Vince",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Telegram, Web",
  description:
    "Institutional-grade Quant Intelligence Telegram Chatbot by Krupp Capital. GEX/DEX/VEX levels, 12 Greeks, SABR/SVI volatility surfaces, Monte Carlo VaR, regime detection, 100+ research commands.",
  url: SITE_URL,
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "49",
    highPrice: "499",
    offerCount: "4",
  },
  publisher: {
    "@type": "Organization",
    name: "Krupp Capital",
    url: "https://kruppcapital.com",
    sameAs: [
      "https://t.me/kruppcapital",
    ],
  },
  featureList: [
    "GEX / DEX / VEX exposure analysis",
    "Black-Scholes pricing with 12 Greeks",
    "SABR, SVI, Heston, Dupire volatility surfaces",
    "Monte Carlo VaR (1M paths)",
    "HMM / GMM market regime detection",
    "100+ Telegram research commands",
    "15+ options strategies with PnL profiles",
    "PDF / Excel / JSON report export",
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "127",
  },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Krupp Capital",
  url: "https://kruppcapital.com",
  logo: `${SITE_URL}/kc-mint-512.png`,
  sameAs: [
    "https://t.me/kruppcapital",
  ],
  founder: { "@type": "Person", name: "Max Krupp" },
  knowsAbout: [
    "Quantitative Finance",
    "Options Market Making",
    "Volatility Modeling",
    "Dealer Positioning",
    "Risk Management",
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I buy Volatility Vince separately without the full Krupp Capital Trading Suite?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every module of the Krupp Capital Trading Suite — including Volatility Vince — is sold individually so traders who already have their own software stack can deploy just the quant chatbot for asking questions, generating charts, and calculating GEX levels.",
      },
    },
    {
      "@type": "Question",
      name: "Where does Volatility Vince run?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Volatility Vince is delivered as a Telegram chatbot and is also available as an in-app chat inside Module 01 (Project Aura). You interact with it through natural-language messages and slash commands.",
      },
    },
    {
      "@type": "Question",
      name: "What data sources does Volatility Vince use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It integrates yfinance, Alpha Vantage, CBOE scraping, the VKKM Aegis live market feeds and TradingView webhooks. A shared data layer also supports IBKR, Yahoo Finance, CBOE and Alpha Vantage API clients.",
      },
    },
    {
      "@type": "Question",
      name: "How fast are the calculations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "End-to-end analysis for a single symbol including 50+ indicators completes in under 2 seconds. GEX is calculated in real time across 100K+ strikes per market, and the risk dashboard refreshes in under 1 second for 1000+ positions.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <SectionEnterObserver>
          {children}
        </SectionEnterObserver>
        <Toaster />
        <ScrollProgress />
        <BackToTop />
        <CommandPalette />
        <SectionNavDots />
        <RippleController />
      </body>
    </html>
  );
}
