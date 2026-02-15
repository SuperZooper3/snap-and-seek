"use client";

import { useEffect, useState } from "react";
import { getTutorialSkipCookie, setTutorialSkipCookie } from "@/lib/tutorial-cookie";
import { GameTutorial } from "@/components/GameTutorial";
import { JoinForm } from "./JoinForm";

type Props = { gameId: string; isRejoin?: boolean };

export function JoinWithTutorial({ gameId, isRejoin = false }: Props) {
  const [skipTutorial, setSkipTutorial] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  /** 1 = tutorial only, 2 = name form only */
  const [step, setStep] = useState<1 | 2>(isRejoin ? 2 : 1);

  useEffect(() => {
    if (isRejoin) {
      setStep(2);
      return;
    }
    const skip = getTutorialSkipCookie();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync cookie to state on mount
    setSkipTutorial(skip);
    setDontShowAgain(skip);
    if (skip) setStep(2);
  }, [isRejoin]);

  function handleDontShowChange(checked: boolean) {
    setDontShowAgain(checked);
    setTutorialSkipCookie(checked);
    if (checked) setSkipTutorial(true);
  }

  if (step === 2) {
    return (
      <section className="sketch-card p-6">
        <JoinForm gameId={gameId} isRejoin={isRejoin} />
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sketch-card p-6">
        <GameTutorial />
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(e) => handleDontShowChange(e.target.checked)}
          className="h-5 w-5 rounded border-2 accent-[var(--pastel-border)]"
          style={{ borderColor: "var(--pastel-border)" }}
        />
        <span>Don&apos;t show this again</span>
      </label>
      <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">
        Join the game!
      </button>
    </div>
  );
}
