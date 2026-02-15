import Link from "next/link";
import Image from "next/image";
import CreateGameForm from "./CreateGameForm";
import { GameTutorial } from "@/components/GameTutorial";

export default function Home() {
  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
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
