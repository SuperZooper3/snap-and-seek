"use client";

import { useEffect, useState } from "react";
import { getTutorialSkipCookie, setTutorialSkipCookie } from "@/lib/tutorial-cookie";
import { GameTutorial } from "@/components/GameTutorial";
import { JoinForm } from "./JoinForm";

type Props = { gameId: string };

export function JoinWithTutorial({ gameId }: Props) {
  const [skipTutorial, setSkipTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  /** 1 = tutorial only, 2 = name form only */
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    const skip = getTutorialSkipCookie();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync cookie to state on mount
    setSkipTutorial(skip);
    setDontShowAgain(skip);
    if (skip) setStep(2);
  }, []);

  function handleDontShowChange(checked: boolean) {
    setDontShowAgain(checked);
    setTutorialSkipCookie(checked);
    if (checked) setSkipTutorial(true);
  }

  // Step 2: name / join form only
  if (step === 2) {
    return (
      <section className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-amber-200/50 dark:border-zinc-700 p-6">
        <JoinForm gameId={gameId} />
      </section>
    );
  }

  // Step 1: tutorial only + "Continue" to go to name form
  return (
    <div className="flex flex-col gap-6">
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
      <button
        type="button"
        onClick={() => setStep(2)}
        className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold px-6 py-3 transition-colors"
      >
        Join the game!
      </button>
    </div>
  );
}
