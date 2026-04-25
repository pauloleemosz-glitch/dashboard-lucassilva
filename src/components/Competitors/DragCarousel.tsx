import { useRef, useState, useCallback, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Drag-to-scroll horizontal carousel.
 * Works on desktop (mouse) and mobile (touch). Blocks pointer-events on
 * children while dragging so iframes/buttons don't swallow the gesture.
 */
export function DragCarousel({ children, className }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, moved: false });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Mobile/touch: let the browser's native scroll handle the gesture.
    // Our JS drag is desktop-only (mouse/pen).
    if (e.pointerType === "touch") return;
    const el = scrollerRef.current;
    if (!el) return;
    dragState.current = {
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const el = scrollerRef.current;
      if (!el) return;
      const dx = e.clientX - dragState.current.startX;
      if (Math.abs(dx) > 4) dragState.current.moved = true;
      el.scrollLeft = dragState.current.scrollLeft - dx;
    },
    [isDragging],
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    const el = scrollerRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className={cn("relative group", className)}>
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className={cn(
          "flex gap-3 overflow-x-auto overflow-y-hidden pb-3 -mx-1 px-1 snap-x snap-mandatory",
          "scrollbar-neon select-none touch-pan-y",
          isDragging ? "cursor-grabbing scroll-auto" : "cursor-grab scroll-smooth",
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* On mobile, disable pointer events on iframes/links so the swipe
            scrolls the carousel instead of being captured by Drive's iframe.
            On desktop (md+), keep them interactive. */}
        <div
          className={cn(
            "contents",
            "[&_iframe]:pointer-events-none md:[&_iframe]:pointer-events-auto",
            isDragging && "md:[&_iframe]:pointer-events-none md:[&_a]:pointer-events-none",
          )}
        >
          {children}
        </div>
      </div>

      {/* Desktop arrow controls */}
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollBy(-1)}
        className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-background/70 border border-primary/30 text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 backdrop-blur"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Próximo"
        onClick={() => scrollBy(1)}
        className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-background/70 border border-primary/30 text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 backdrop-blur"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
