import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type LightboxImage = {
  src: string;
  alt: string;
  downloadName?: string;
  subtitle?: string;
};

type Props = {
  open: boolean;
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
  onDownload?: (image: LightboxImage) => void;
};

function clampIndex(index: number, len: number) {
  if (len <= 0) return 0;
  return Math.max(0, Math.min(index, len - 1));
}

export function Lightbox({
  open,
  images,
  startIndex,
  onClose,
  onDownload,
}: Props) {
  const [index, setIndex] = useState(0);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const safeStartIndex = useMemo(
    () => clampIndex(startIndex, images.length),
    [startIndex, images.length]
  );

  // Sync index on open or when startIndex changes.
  useEffect(() => {
    if (!open) return;
    setIndex(safeStartIndex);
  }, [open, safeStartIndex]);

  // Clamp if images list changes while open.
  useEffect(() => {
    if (!open) return;
    setIndex((prev) => clampIndex(prev, images.length));
  }, [open, images.length]);

  // Lock scroll + focus.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the close button for a11y / keyboard.
    queueMicrotask(() => closeBtnRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const current = images[index];

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    },
    [open, onClose, goPrev, goNext]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  const handleDownload = useCallback(() => {
    if (!current) return;
    if (onDownload) {
      onDownload(current);
      return;
    }
    // Fallback: use <a download> behavior.
    const link = document.createElement("a");
    link.href = current.src;
    if (current.downloadName) link.download = current.downloadName;
    link.click();
  }, [current, onDownload]);

  if (!open) return null;

  // If there are no images, close immediately (keeps state consistent).
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onMouseDown={(e) => {
        // Click outside closes.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10" />

      {/* Panel */}
      <div className="relative h-full w-full px-4 py-6 sm:px-8 sm:py-10 flex items-center justify-center">
        <div
          className="w-full max-w-6xl rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl overflow-hidden animate-scale-in"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-white font-semibold truncate">
                  {current.alt || "Preview"}
                </p>
                <span className="text-xs text-white/60 whitespace-nowrap">
                  {images.length > 0 ? `${index + 1} / ${images.length}` : ""}
                </span>
              </div>
              {current.subtitle && (
                <p className="text-xs text-white/60 truncate mt-0.5">
                  {current.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold transition-all active:scale-[0.99]"
                title="Download"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>

              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all"
                title="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative bg-gradient-to-br from-white/5 via-transparent to-white/5">
            {/* Prev / Next */}
            <button
              type="button"
              onClick={goPrev}
              disabled={images.length <= 1}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous"
            >
              <svg
                className="w-5 h-5 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={images.length <= 1}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next"
            >
              <svg
                className="w-5 h-5 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <div className="p-4 sm:p-6">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950/20">
                <img
                  src={current.src}
                  alt={current.alt}
                  className="w-full h-[70vh] sm:h-[74vh] object-contain select-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

