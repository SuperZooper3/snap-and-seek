import Link from "next/link";
import { BackArrowIcon } from "@/components/BackArrowIcon";

export default function GameNotFound() {
  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 font-sans"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-md w-full text-center space-y-6 sketch-card p-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Game not found
        </h1>
        <p style={{ color: "var(--pastel-ink-muted)" }}>
          This game doesn’t exist or the link is wrong. It may have been deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/your-games"
            className="btn-primary inline-flex items-center justify-center gap-1.5"
          >
            <BackArrowIcon className="h-4 w-4" />
            Your games
          </Link>
          <Link href="/" className="btn-ghost inline-flex items-center justify-center">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
