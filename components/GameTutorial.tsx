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
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
          How to play <strong>Snap and Seek</strong>!
        </h2>
      )}

      {/* 1. Hide */}
      <section className="flex gap-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white" aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">1. Hide</h3>
          <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-200/90">
            First you hide, solo or in a team. Go find an item in the game zone and take a photo of it. That photo becomes your <strong>hidden item</strong> that others will try to find. Pick something distinctive but not too obvious!
          </p>
        </div>
      </section>

      {/* 2. Seek */}
      <section className="flex gap-4 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white" aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sky-900 dark:text-sky-100">2. Seek</h3>
          <p className="mt-1 text-sm text-sky-800/90 dark:text-sky-200/90">
            Once every hider has chosen their hidden item, the seeking phase begins. Head out on the map and find everyone else&apos;s items. Use the in-game map and clues to track them down.
          </p>
        </div>
      </section>

      {/* 3. Powerups */}
      <section className="flex gap-4 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/60 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white" aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-violet-900 dark:text-violet-100">3. Powerups</h3>
          <p className="mt-1 text-sm text-violet-800/90 dark:text-violet-200/90">
            Use <strong>Radar</strong>, <strong>Thermometer</strong>, and <strong>Photo</strong> to help figure out where each hidden item is within the game zone. They give you hints so you can narrow down the search and be the first to find them all.
          </p>
        </div>
      </section>

      {/* 4. Win */}
      <section className="flex gap-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-amber-950" aria-hidden>
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">4. Win</h3>
          <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
            The first player (or team) to find <strong>every other player&apos;s hidden item</strong> wins the game. Good luck!
          </p>
        </div>
      </section>
    </div>
  );
}
