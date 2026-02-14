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
      className={`w-full rounded-xl border-[3px] transition-all text-left p-3 flex items-center gap-3 touch-manipulation ${
        uploaded ? "" : "border-dashed"
      }`}
      style={{
        borderColor: "var(--pastel-border)",
        background: uploaded ? "var(--pastel-mint)" : "var(--pastel-paper)",
        boxShadow: "3px 3px 0 var(--pastel-border-subtle)",
      }}
    >
      <div
        className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border-2"
        style={{
          background: "var(--pastel-butter)",
          borderColor: "var(--pastel-border)",
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`${label} photo`}
            className="w-full h-full object-cover"
          />
        ) : uploading ? (
          <svg
            className="w-6 h-6 animate-spin"
            style={{ color: "var(--pastel-ink-muted)" }}
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
            className="w-6 h-6"
            style={{ color: "var(--pastel-ink-muted)" }}
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

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--pastel-ink)" }}>
          {label}
        </p>
        {uploading && (
          <p className="text-xs mt-0.5" style={{ color: "var(--pastel-ink-muted)" }}>
            Uploading...
          </p>
        )}
        {uploaded && !uploading && (
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 border-2"
            style={{
              background: "var(--pastel-mint)",
              borderColor: "var(--pastel-border)",
              color: "var(--pastel-ink)",
            }}
          >
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
          <p className="text-xs mt-0.5" style={{ color: "var(--pastel-ink-muted)" }}>
            Tap to take photo
          </p>
        )}
      </div>

      <svg
        className="w-5 h-5 flex-shrink-0"
        style={{ color: "var(--pastel-ink-muted)" }}
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
