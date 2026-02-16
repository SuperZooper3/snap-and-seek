"use client";

/**
 * Shared tutorial content: how to play Snap and Seek.
 * Used on the join page (with optional "Don't show again") and in the lobby modal.
 */

type Props = { showTitle?: boolean };

export function GameTutorial({ showTitle = true }: Props) {
  return (
    <div className="space-y-6 text-left">
      {showTitle && (
        <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          How to play <strong>Snap and Seek</strong>?
        </h2>
      )}

      {/* 1. Hide */}
      <section
        className="flex flex-col sm:flex-row gap-4 rounded-xl border-[3px] p-4"
        style={{
          background: "var(--pastel-mint)",
          borderColor: "var(--pastel-border)",
        }}
      >
        <div className="flex shrink-0 items-center gap-3 sm:block">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-white"
            style={{ background: "var(--pastel-ink)", borderColor: "var(--pastel-border)" }}
            aria-hidden
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h3 className="font-bold sm:hidden" style={{ color: "var(--pastel-ink)" }}>1. Hide</h3>
        </div>
        <div className="min-w-0">
          <h3 className="hidden sm:block font-bold" style={{ color: "var(--pastel-ink)" }}>1. Hide</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
            First you hide, solo or in a team. Go find an item in the game zone and take a photo of it. That photo becomes your <strong>hidden item</strong> that others will try to find. Pick something distinctive but not too obvious!
          </p>
        </div>
      </section>

      {/* 2. Seek */}
      <section
        className="flex flex-col sm:flex-row gap-4 rounded-xl border-[3px] p-4"
        style={{
          background: "var(--pastel-sky)",
          borderColor: "var(--pastel-border)",
        }}
      >
        <div className="flex shrink-0 items-center gap-3 sm:block">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-white"
            style={{ background: "var(--pastel-ink)", borderColor: "var(--pastel-border)" }}
            aria-hidden
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-bold sm:hidden" style={{ color: "var(--pastel-ink)" }}>2. Seek</h3>
        </div>
        <div className="min-w-0">
          <h3 className="hidden sm:block font-bold" style={{ color: "var(--pastel-ink)" }}>2. Seek</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
            Once every hider has chosen their hidden item, the seeking phase begins. Head out on the map and find everyone else&apos;s items. Use the in-game map and clues to track them down.
          </p>
        </div>
      </section>

      {/* 3. Powerups */}
      <section
        className="flex flex-col sm:flex-row gap-4 rounded-xl border-[3px] p-4"
        style={{
          background: "var(--pastel-lavender)",
          borderColor: "var(--pastel-border)",
        }}
      >
        <div className="flex shrink-0 items-center gap-3 sm:block">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-white"
            style={{ background: "var(--pastel-ink)", borderColor: "var(--pastel-border)" }}
            aria-hidden
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-bold sm:hidden" style={{ color: "var(--pastel-ink)" }}>3. Powerups</h3>
        </div>
        <div className="min-w-0">
          <h3 className="hidden sm:block font-bold" style={{ color: "var(--pastel-ink)" }}>3. Powerups</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
            Use <strong>Radar</strong>, <strong>Thermometer</strong>, and <strong>Photo</strong> to help figure out where each hidden item is within the game zone. They give you hints so you can narrow down the search and be the first to find them all.
          </p>
        </div>
      </section>

      {/* 4. Win */}
      <section
        className="flex flex-col sm:flex-row gap-4 rounded-xl border-[3px] p-4"
        style={{
          background: "var(--pastel-butter)",
          borderColor: "var(--pastel-border)",
        }}
      >
        <div className="flex shrink-0 items-center gap-3 sm:block">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2"
            style={{ background: "var(--pastel-ink)", borderColor: "var(--pastel-border)", color: "var(--pastel-butter)" }}
            aria-hidden
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h3 className="font-bold sm:hidden" style={{ color: "var(--pastel-ink)" }}>4. Win</h3>
        </div>
        <div className="min-w-0">
          <h3 className="hidden sm:block font-bold" style={{ color: "var(--pastel-ink)" }}>4. Win</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
            The first player (or team) to find <strong>every other player&apos;s hidden item</strong> wins the game. Good luck!
          </p>
        </div>
      </section>

      <p className="text-sm" style={{ color: "var(--pastel-ink-muted)" }}>
        <a
          href="https://youtu.be/F_hVs6-mK4M"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium hover:opacity-80"
          style={{ color: "var(--pastel-ink)" }}
        >
          Full game walkthrough video
        </a> to learn more.
      </p>

      <p className="text-sm pt-2 border-t-2" style={{ color: "var(--pastel-ink-muted)", borderColor: "var(--pastel-border-subtle)" }}>
        We encourage everyone to play in good faith with your friends: try to follow the rules, and don’t take aggressively strict images—hidden items should be generally visible in a reasonable way. Game time scales with the number of players. For bigger zones (over 200 m radius) we recommend ≤4 players; for a smaller area (e.g. 100 m) up to 10 players can work well.
      </p>
    </div>
  );
}
