import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const body = await _request.json();
  const status = body?.status;

  if (status !== "hiding") {
    return NextResponse.json(
      { error: "Only status 'hiding' is supported" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("games")
    .update({ status: "hiding" })
    .eq("id", gameId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
