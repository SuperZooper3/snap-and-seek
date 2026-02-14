import { DebugModeClient } from "./DebugModeClient";

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <DebugModeClient />
    </div>
  );
}
