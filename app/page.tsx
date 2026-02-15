import Link from "next/link";
import Image from "next/image";
import CreateGameForm from "./CreateGameForm";
import { GameTutorial } from "@/components/GameTutorial";

const baseUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://snapandseek.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Snap and Seek",
  description:
    "A whimsical outdoor game with friends: a cross between hide and seek, scavenger hunt, and Jet Lag. Create a game, hide or seek, snap photos, and find everyone.",
  url: baseUrl,
  applicationCategory: "Game",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Create games and invite friends",
    "Hide and seek with photo proof",
    "Location-based play outdoors",
    "Scavenger hunt style challenges",
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/ss_f_logo.png"
              alt="Snap and Seek"
              width={200}
              height={80}
              className="h-24 w-auto sm:h-[7.5rem]"
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <p className="text-lg sm:text-xl max-w-xl mx-auto leading-relaxed" style={{ color: "var(--pastel-ink-muted)" }}>
            A cross between hide and seek, a scavenger hunt, and Jet Lag The Game, &ldquo;Snap & Seek&rdquo; is a whimsical outdoor game with friends!
          </p>
        </header>

        <section className="mb-8">
          <CreateGameForm />
        </section>

        <div className="mb-8 text-center">
          <Link href="/your-games" className="btn-ghost inline-flex">
            Your games
          </Link>
        </div>

        <section className="mb-8">
          <GameTutorial showTitle={true} />
        </section>
      </main>
    </div>
  );
}
