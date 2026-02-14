import { DebugModeClient } from "./DebugModeClient";

export default function DebugPage() {
  return (
    <div className="min-h-screen font-sans" style={{ background: "var(--background)" }}>
      <DebugModeClient />
    </div>
  );
}
