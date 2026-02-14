import Link from "next/link";
import { BackArrowIcon } from "@/components/BackArrowIcon";

export default function NotFound() {
  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 font-sans"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-md w-full text-center space-y-6 sketch-card p-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Page not found
        </h1>
        <p style={{ color: "var(--pastel-ink-muted)" }}>
          This page doesn’t exist or you don’t have access to it.
        </p>
        <ul className="text-sm text-left list-disc list-inside space-y-1" style={{ color: "var(--pastel-ink-muted)" }}>
          <li>Check the URL — game pages look like <code className="sketch-input px-1.5 py-0.5 rounded">/games/...</code></li>
          <li>If you started hiding and got here, the game zone may not be set — go back to the game and set the play area first.</li>
          <li>The game may have been deleted or the link might be wrong.</li>
        </ul>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/games" className="btn-primary inline-flex items-center justify-center gap-1.5">
            <BackArrowIcon className="h-4 w-4" />
            All games
          </Link>
          <Link href="/" className="btn-ghost inline-flex items-center justify-center">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
