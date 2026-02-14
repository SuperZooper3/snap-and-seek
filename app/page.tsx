import Link from "next/link";
import CreateGameForm from "./CreateGameForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
            Snap and Seek
          </h1>
          <p className="mt-3 text-lg text-amber-800/80 dark:text-amber-200/80">
            Hide. Seek. Snap. Find them all.
          </p>
        </header>

        <section className="mb-12">
          <CreateGameForm />
        </section>

        <footer className="text-center text-sm text-amber-800/60 dark:text-amber-200/60 space-x-4">
          <Link href="/games" className="hover:underline">
            View all games
          </Link>
          <Link href="/debug" className="hover:underline">
            Debug mode
          </Link>
        </footer>
      </main>
    </div>
  );
}
