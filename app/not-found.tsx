import Link from "next/link";
import { BackArrowIcon } from "@/components/BackArrowIcon";

export default function NotFound() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-gradient-to-b from-amber-50 to-orange-100 dark:from-zinc-950 dark:to-zinc-900 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
          Page not found
        </h1>
        <p className="text-amber-800 dark:text-amber-200">
          This page doesn’t exist or you don’t have access to it.
        </p>
        <ul className="text-sm text-amber-700 dark:text-amber-300 text-left list-disc list-inside space-y-1">
          <li>Check the URL — game pages look like <code className="bg-amber-100 dark:bg-zinc-800 px-1 rounded">/games/...</code></li>
          <li>If you started hiding and got here, the game zone may not be set — go back to the game and set the play area first.</li>
          <li>The game may have been deleted or the link might be wrong.</li>
        </ul>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/games"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 transition-colors"
          >
            <BackArrowIcon className="h-4 w-4" />
            All games
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200/80 dark:hover:bg-amber-800/40 text-amber-900 dark:text-amber-100 font-semibold px-6 py-3 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
