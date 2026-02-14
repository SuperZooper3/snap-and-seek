"use client";

import { useEffect, useState } from "react";
import { getTutorialSkipCookie, setTutorialSkipCookie } from "@/lib/tutorial-cookie";
import { GameTutorial } from "@/components/GameTutorial";
import { JoinForm } from "./JoinForm";

type Props = { gameId: string };

export function JoinWithTutorial({ gameId }: Props) {
  const [skipTutorial, setSkipTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    setSkipTutorial(getTutorialSkipCookie());
    setDontShowAgain(getTutorialSkipCookie());
  }, []);

  function handleDontShowChange(checked: boolean) {
    setDontShowAgain(checked);
    setTutorialSkipCookie(checked);
    if (checked) setSkipTutorial(true);
  }

  return (
    <div className="flex flex-col gap-8">
      {!skipTutorial ? (
        <>
          <div className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6">
            <GameTutorial />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-amber-900 dark:text-amber-100">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => handleDontShowChange(e.target.checked)}
              className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <span>Don&apos;t show this again</span>
          </label>
        </>
      ) : (
        <p className="text-center">
          <button
            type="button"
            onClick={() => setSkipTutorial(false)}
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            Review rules
          </button>
        </p>
      )}

      <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6">
        <JoinForm gameId={gameId} />
      </section>
    </div>
  );
}
