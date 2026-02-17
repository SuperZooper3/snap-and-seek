import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Compute which players have "won" in this game: they have successfully found
 * every other non-withdrawn player. Used after a submission or after a withdraw.
 * Returns array of winner player IDs (may be empty, one, or multiple for a tie).
 */
export async function computeWinnerIds(
  supabase: SupabaseClient,
  gameId: string
): Promise<number[]> {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id")
    .eq("game_id", gameId)
    .is("withdrawn_at", null);

  if (playersError || !players || players.length === 0) return [];
  const activeIds = new Set((players as { id: number }[]).map((p) => p.id));
  const neededCount = Math.max(0, activeIds.size - 1); // everyone except self
  if (neededCount === 0) return [];

  const { data: successSubs, error: subsError } = await supabase
    .from("submissions")
    .select("seeker_id, hider_id")
    .eq("game_id", gameId)
    .eq("status", "success");

  if (subsError || !successSubs) return [];

  const bySeeker = new Map<number, Set<number>>();
  for (const row of successSubs as { seeker_id: number; hider_id: number }[]) {
    const { seeker_id, hider_id } = row;
    if (!activeIds.has(hider_id)) continue; // don't count finds of withdrawn hiders
    if (!bySeeker.has(seeker_id)) bySeeker.set(seeker_id, new Set());
    bySeeker.get(seeker_id)!.add(hider_id);
  }

  const winners: number[] = [];
  for (const seekerId of activeIds) {
    const foundHiders = bySeeker.get(seekerId);
    if (!foundHiders) continue;
    const needed = neededCount; // other players to find (excluding self)
    const foundCount = foundHiders.size;
    if (foundCount >= needed) winners.push(seekerId);
  }
  return winners;
}

/**
 * If there are winners, set game to completed and store winner_id (first) and winner_ids (all).
 * Tolerates missing winner_ids column (only sets winner_id, status, finished_at).
 */
export async function setGameWinners(
  supabase: SupabaseClient,
  gameId: string,
  winnerIds: number[]
): Promise<boolean> {
  if (winnerIds.length === 0) return false;
  const finishedAt = new Date().toISOString();
  const firstWinner = winnerIds[0];

  const updatePayload: Record<string, unknown> = {
    winner_id: firstWinner,
    status: "completed",
    finished_at: finishedAt,
  };
  (updatePayload as Record<string, unknown>).winner_ids = winnerIds;

  const result = await supabase
    .from("games")
    .update(updatePayload)
    .eq("id", gameId)
    .is("winner_id", null)
    .select("id")
    .single();

  if (result.error) {
    if (result.error.message?.includes("winner_ids") || result.error.message?.includes("does not exist")) {
      await supabase
        .from("games")
        .update({ winner_id: firstWinner, status: "completed", finished_at: finishedAt })
        .eq("id", gameId)
        .is("winner_id", null);
    }
    return true;
  }
  return (result.data != null);
}
