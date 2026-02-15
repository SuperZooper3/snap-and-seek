import CreateGameForm from "./CreateGameForm";

export default function Home() {
  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Snap and Seek
          </h1>
          <p className="mt-3 text-lg" style={{ color: "var(--pastel-ink-muted)" }}>
            Hide. Seek. Snap. Find them all.
          </p>
        </header>

        <section className="mb-12">
          <CreateGameForm />
        </section>

      </main>
    </div>
  );
}
