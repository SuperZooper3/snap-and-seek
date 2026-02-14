"use client";

type ItemBarProps = {
  label: string;
  photoUrl?: string;
  uploading: boolean;
  uploaded: boolean;
  onClick: () => void;
};

export function ItemBar({
  label,
  photoUrl,
  uploading,
  uploaded,
  onClick,
}: ItemBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border-2 transition-colors text-left
        ${
          uploaded
            ? "border-amber-300 dark:border-amber-600 bg-amber-50/80 dark:bg-zinc-800/80"
            : "border-dashed border-amber-300/60 dark:border-zinc-600 bg-white/60 dark:bg-zinc-800/40 hover:border-amber-400 dark:hover:border-zinc-500"
        }
        p-3 flex items-center gap-3`}
    >
      {/* Photo thumbnail or camera icon */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-amber-100/80 dark:bg-zinc-700/80 border border-amber-200/50 dark:border-zinc-600">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${label} photo`}
            className="w-full h-full object-cover"
          />
        ) : uploading ? (
          <svg
            className="w-6 h-6 text-amber-500 dark:text-amber-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 text-amber-400 dark:text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
            />
          </svg>
        )}
      </div>

      {/* Label + status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 truncate">
          {label}
        </p>
        {uploading && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            Uploading...
          </p>
        )}
        {uploaded && !uploading && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full mt-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Photo Uploaded
          </span>
        )}
        {!uploaded && !uploading && (
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            Tap to take photo
          </p>
        )}
      </div>

      {/* Chevron */}
      <svg
        className="w-5 h-5 text-amber-400 dark:text-amber-500 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
}
