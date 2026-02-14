"use client";

import Image from "next/image";
import type { Submission } from "@/lib/types";

type Player = {
  id: number;
  name: string;
  hiding_photo: number | null;
};

type Props = {
  players: Player[];
  submissions: Submission[];
  photoUrlById: Record<number, string>;
  winnerId: number | null;
};

/**
 * 2D recap grid.
 * Columns = each player (hider) with their hiding photo as header.
 * Rows = each player (seeker).
 * Cells = the seeker's submitted photo for that hider.
 * Diagonal = the player's own hiding photo (same as column header for that player).
 */
export function SummaryGrid({ players, submissions, photoUrlById, winnerId }: Props) {
  // Build a lookup: submissions[seekerId][hiderId] = submission (prefer success; else latest fail so we can show "tried but failed")
  const submissionMap: Record<number, Record<number, Submission>> = {};
  for (const s of submissions) {
    if (s.status !== "success" && s.status !== "fail") continue;
    if (!submissionMap[s.seeker_id]) submissionMap[s.seeker_id] = {};
    const existing = submissionMap[s.seeker_id][s.hider_id];
    if (!existing) {
      submissionMap[s.seeker_id][s.hider_id] = s;
    } else if (s.status === "success") {
      submissionMap[s.seeker_id][s.hider_id] = s;
    } else if (existing.status === "fail" && s.status === "fail") {
      submissionMap[s.seeker_id][s.hider_id] = s;
    }
  }

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-zinc-800/80 shadow-lg border border-emerald-200/50 dark:border-zinc-700 p-4 sm:p-6 overflow-x-auto">
      <table className="w-full border-collapse min-w-[400px]">
        <thead>
          <tr>
            {/* Top-left corner cell */}
            <th className="p-2 text-left text-sm font-medium text-emerald-700 dark:text-emerald-300 sticky left-0 bg-white/80 dark:bg-zinc-800/80 z-10 min-w-[100px]">
              Seeker \ Hider
            </th>
            {/* Column headers: each hider */}
            {players.map((hider) => (
              <th key={hider.id} className="p-2 text-center min-w-[120px]">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 truncate max-w-[100px]">
                    {hider.name}
                  </span>
                  {/* Hider's hiding photo thumbnail */}
                  {hider.hiding_photo != null && photoUrlById[hider.hiding_photo] ? (
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-emerald-100 dark:bg-zinc-700">
                      <Image
                        src={photoUrlById[hider.hiding_photo]}
                        alt={`${hider.name}'s hiding spot`}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-12 rounded-lg bg-emerald-100 dark:bg-zinc-700 flex items-center justify-center">
                      <span className="text-xs text-emerald-500 dark:text-zinc-400">—</span>
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((seeker) => {
            const isWinner = seeker.id === winnerId;
            return (
              <tr
                key={seeker.id}
                className={
                  isWinner
                    ? "bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-400 dark:ring-amber-500 ring-inset"
                    : ""
                }
              >
                {/* Row header: seeker name */}
                <td
                  className={`p-2 sticky left-0 z-10 min-w-[100px] ${
                    isWinner
                      ? "bg-amber-50/95 dark:bg-amber-950/50 ring-1 ring-amber-400/50 dark:ring-amber-500/50"
                      : "bg-white/80 dark:bg-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isWinner && <span className="text-sm" aria-label="Winner">🏆</span>}
                    <span
                      className={`text-sm font-medium truncate max-w-[80px] ${
                        isWinner
                          ? "text-amber-800 dark:text-amber-200 font-semibold"
                          : "text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {seeker.name}
                    </span>
                  </div>
                </td>
                {/* Cells: seeker's submission for each hider — winner row shows full set of found images */}
                {players.map((hider) => {
                  const isDiagonal = seeker.id === hider.id;
                  const submission = submissionMap[seeker.id]?.[hider.id];
                  const submissionPhotoUrl =
                    submission?.photo_id != null ? photoUrlById[submission.photo_id] : undefined;

                  if (isDiagonal) {
                    const selfPhotoUrl =
                      seeker.hiding_photo != null ? photoUrlById[seeker.hiding_photo] : undefined;
                    return (
                      <td
                        key={hider.id}
                        className={`p-2 text-center ${isWinner ? "bg-amber-50/60 dark:bg-amber-950/30" : ""}`}
                      >
                        {selfPhotoUrl ? (
                          <div
                            className={`relative w-16 h-12 mx-auto rounded-lg overflow-hidden border-2 border-dashed ${
                              isWinner
                                ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-500 shadow-md"
                                : "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600"
                            }`}
                          >
                            <Image
                              src={selfPhotoUrl}
                              alt={`${seeker.name}'s hiding spot (self)`}
                              fill
                              className="object-cover"
                              sizes="64px"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-12 mx-auto rounded-lg bg-zinc-200/50 dark:bg-zinc-600/30 flex items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-600">
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">self</span>
                          </div>
                        )}
                      </td>
                    );
                  }

                  const isFail = submission?.status === "fail";
                  return (
                    <td
                      key={hider.id}
                      className={`p-2 text-center ${isWinner ? "bg-amber-50/60 dark:bg-amber-950/30" : ""}`}
                    >
                      {submissionPhotoUrl ? (
                        <div
                          className={`relative w-16 h-12 mx-auto rounded-lg overflow-hidden ${
                            isFail
                              ? "bg-red-50 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-500 shadow-md"
                              : isWinner
                                ? "bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 dark:border-amber-500 shadow-md"
                                : "bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-700"
                          }`}
                          title={isFail ? "Tried but not close enough" : undefined}
                        >
                          <Image
                            src={submissionPhotoUrl}
                            alt={
                              isFail
                                ? `${seeker.name} tried but wasn't close enough to ${hider.name}'s spot`
                                : `${seeker.name}'s photo of ${hider.name}'s spot`
                            }
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-12 mx-auto rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
