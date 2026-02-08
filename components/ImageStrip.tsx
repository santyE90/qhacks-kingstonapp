"use client";

import type { IssueMedia } from "@/lib/types";

export default function ImageStrip({ items }: { items: IssueMedia[] }) {
  if (!items?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-8 text-center text-sm text-muted">
        No images yet.
      </div>
    );
  }

  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
      {items.map((img) => (
        <div
          key={img.id}
          className="snap-center rounded-2xl border border-[var(--border)] bg-white p-2 shadow-sm"
        >
          <img
            src={img.url}
            alt="Issue"
            className="h-48 w-72 rounded-xl object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
