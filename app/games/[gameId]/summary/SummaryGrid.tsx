"use client";

import Image from "next/image";
import type { Submission } from "@/lib/types";

type Player = {
  id: number;
  name: string;
  hiding_photo: number | null;
  withdrawn_at?: string | null;
};

type Props = {
  players: Player[];
  submissions: Submission[];
  photoUrlById: Record<number, string>;
  winnerIds: number[];
};

export function SummaryGrid({ players, submissions, photoUrlById, winnerIds }: Props) {
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
    <div className="sketch-card p-4 sm:p-6 overflow-x-auto">
      <table className="w-full border-collapse min-w-[400px]">
        <thead>
          <tr>
            <th
              className="p-2 text-left text-sm font-bold sticky left-0 z-10 min-w-[100px] border-r-2 border-b-2"
              style={{
                background: "var(--pastel-paper)",
                borderColor: "var(--pastel-border)",
                color: "var(--pastel-ink)",
              }}
            >
              Seeker \ Hider
            </th>
            {players.map((hider) => {
              const isWithdrawn = !!hider.withdrawn_at;
              return (
                <th
                  key={hider.id}
                  className="p-2 text-center min-w-[120px] border-b-2"
                  style={{
                    borderColor: "var(--pastel-border)",
                    background: isWithdrawn ? "#fef3c7" : undefined,
                  }}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-sm font-bold truncate max-w-[100px]" style={{ color: "var(--pastel-ink)" }}>
                      {hider.name}
                      {isWithdrawn && (
                        <span className="ml-1 text-xs font-normal" style={{ color: "var(--pastel-ink-muted)" }}>
                          (withdrawn)
                        </span>
                      )}
                    </span>
                  {hider.hiding_photo != null && photoUrlById[hider.hiding_photo] ? (
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden border-2" style={{ background: "var(--pastel-mint)", borderColor: "var(--pastel-border)" }}>
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
                    <div className="w-16 h-12 rounded-lg flex items-center justify-center border-2" style={{ background: "var(--pastel-paper)", borderColor: "var(--pastel-border)" }}>
                      <span className="text-xs" style={{ color: "var(--pastel-ink-muted)" }}>—</span>
                    </div>
                  )}
                </div>
              </th>
            );
            })}
          </tr>
        </thead>
        <tbody>
          {players.map((seeker) => {
            const isWinner = winnerIds.includes(seeker.id);
            return (
              <tr
                key={seeker.id}
                style={{
                  background: isWinner ? "var(--pastel-butter)" : undefined,
                }}
              >
                <td
                  className="p-2 sticky left-0 z-10 min-w-[100px] border-r-2 border-b-2"
                  style={{
                    background: isWinner ? "var(--pastel-butter)" : "var(--pastel-paper)",
                    borderColor: "var(--pastel-border)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {isWinner && <span className="text-sm" aria-label="Winner">🏆</span>}
                    <span className="text-sm font-bold truncate max-w-[80px]" style={{ color: "var(--pastel-ink)" }}>
                      {seeker.name}
                    </span>
                  </div>
                </td>
                {players.map((hider) => {
                  const isDiagonal = seeker.id === hider.id;
                  const isWithdrawn = !!hider.withdrawn_at;
                  const submission = submissionMap[seeker.id]?.[hider.id];
                  const submissionPhotoUrl = submission?.photo_id != null ? photoUrlById[submission.photo_id] : undefined;

                  if (isDiagonal) {
                    const selfPhotoUrl = seeker.hiding_photo != null ? photoUrlById[seeker.hiding_photo] : undefined;
                    return (
                      <td key={hider.id} className="p-2 text-center border-b-2" style={{ borderColor: "var(--pastel-border)" }}>
                        {selfPhotoUrl ? (
                          <div
                            className="relative w-16 h-12 mx-auto rounded-lg overflow-hidden border-[3px]"
                            style={{
                              background: "var(--pastel-butter)",
                              borderColor: "var(--pastel-border)",
                            }}
                          >
                            <Image src={selfPhotoUrl} alt={`${seeker.name}'s hiding spot (self)`} fill className="object-cover" sizes="64px" unoptimized />
                          </div>
                        ) : (
                          <div className="w-16 h-12 mx-auto rounded-lg flex items-center justify-center border-2 border-dashed" style={{ borderColor: "var(--pastel-border)" }}>
                            <span className="text-xs" style={{ color: "var(--pastel-ink-muted)" }}>self</span>
                          </div>
                        )}
                      </td>
                    );
                  }

                  const isFail = submission?.status === "fail";
                  return (
                    <td
                      key={hider.id}
                      className="p-2 text-center border-b-2"
                      style={{
                        borderColor: "var(--pastel-border)",
                        background: isWithdrawn ? "#fef3c7" : undefined,
                      }}
                    >
                      {submissionPhotoUrl ? (
                        <div
                          className={`relative w-16 h-12 mx-auto rounded-lg overflow-hidden border-[3px] ${
                            isFail ? "" : ""
                          }`}
                          style={{
                            background: isFail ? "var(--pastel-error)" : "var(--pastel-mint)",
                            borderColor: "var(--pastel-border)",
                          }}
                          title={isFail ? "Tried but not close enough" : undefined}
                        >
                          <Image
                            src={submissionPhotoUrl}
                            alt={isFail ? `${seeker.name} tried but wasn't close enough to ${hider.name}'s spot` : `${seeker.name}'s photo of ${hider.name}'s spot`}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-12 mx-auto rounded-lg flex items-center justify-center border-2" style={{ background: "var(--pastel-paper)", borderColor: "var(--pastel-border)" }}>
                          <span className="text-xs" style={{ color: "var(--pastel-ink-muted)" }}>—</span>
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
