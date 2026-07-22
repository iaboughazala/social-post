"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  /** Number of lines shown when collapsed. Uses Tailwind line-clamp. */
  clampLines?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const CLAMP_CLASS = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
} as const;

/**
 * Text with a "See more" toggle. Only shows the toggle when the text
 * is actually long enough to warrant clamping (~130 chars per clamp
 * line as a rough heuristic — good enough for LinkedIn-length posts).
 */
export function ExpandableText({
  text,
  clampLines = 2,
  className = "",
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const showToggle = text.length > clampLines * 130;

  return (
    <div className={className}>
      <p
        className={`text-sm whitespace-pre-wrap ${
          expanded || !showToggle ? "" : CLAMP_CLASS[clampLines]
        }`}
        dir="auto"
      >
        {text}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="text-xs text-primary hover:underline mt-1"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
