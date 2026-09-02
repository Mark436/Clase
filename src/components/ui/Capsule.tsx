import { useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import {
  CAPSULE_MORPH_DURATION,
  CAPSULE_MORPH_EASE,
  CAPSULE_RADIUS_DURATION,
  CAPSULE_RADIUS_EASE,
} from "@/lib/motion/eases";

export type CapsuleVariant = "pill" | "morf";
export type CapsuleTone = "neutral" | "accent";

interface CapsuleProps {
  /** A: stadium at every size. B: iOS-style pill → rounded-card morph. */
  variant?: CapsuleVariant;
  /** Anchor shown while collapsed (and kept at the top-left when expanded).
      This is the content that does NOT move when the capsule grows. */
  minimized: ReactNode;
  /** Detail content revealed alongside the anchor once expanded. */
  expanded: ReactNode;
  /** Change this key to trigger one expand pulse (important events only). */
  pulseKey?: string | number;
  /** Delay before an expanded capsule collapses back (ms), manual or pulsed. */
  autoCollapseMs?: number;
  /** 0–100: when provided, draws a progress fill behind the content that
      grows across the capsule (used for the in-class countdown). */
  progressPercent?: number;
  tone?: CapsuleTone;
  ariaLabel?: string;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const EXPANDED_RADIUS_PX = 20;

// The context capsule: a floating island sitting at the top-left that morphs to
// a centered (for the "morf" variant) expanded card. The morph is a GSAP tween
// over geometry — left / xPercent / borderRadius — not a Flip playback, so the
// anchor (minimized) stays put while the details (expanded) grow beside it.
//
// Expansion is always transient: it ends after autoCollapseMs, on Escape,
// on focus leaving the island, or on a pointer press outside of it.
export function Capsule({
  variant = "morf",
  minimized,
  expanded,
  pulseKey,
  autoCollapseMs = 1500,
  progressPercent,
  tone = "neutral",
  ariaLabel = "Contexto actual",
  className,
}: CapsuleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const elementRef = useRef<HTMLButtonElement>(null);
  const collapseTimerRef = useRef<number | undefined>(undefined);
  const previousPulseRef = useRef(pulseKey);

  function clearCollapseTimer() {
    if (collapseTimerRef.current !== undefined) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = undefined;
    }
  }

  function scheduleCollapse() {
    clearCollapseTimer();
    collapseTimerRef.current = window.setTimeout(() => {
      setIsExpanded(false);
    }, autoCollapseMs);
  }

  function collapseNow() {
    clearCollapseTimer();
    setIsExpanded(false);
  }

  // Auto-expand pulses: fired only when the caller bumps pulseKey.
  useEffect(() => {
    if (pulseKey === undefined || pulseKey === "") return;
    if (previousPulseRef.current === pulseKey) return;

    previousPulseRef.current = pulseKey;
    setIsExpanded(true);
    scheduleCollapse();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timers are refs; re-run only per pulse key.
  }, [pulseKey]);

  // Re-arm the timer when the delay changes while expanded (dev slider).
  useEffect(() => {
    if (!isExpanded) return;
    scheduleCollapse();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- collapse scheduling only.
  }, [autoCollapseMs, isExpanded]);

  useEffect(() => clearCollapseTimer, []);

  // A press anywhere outside the island dismisses it immediately.
  useEffect(() => {
    if (!isExpanded) return;

    function handlePointerDown(event: globalThis.PointerEvent) {
      const element = elementRef.current;
      if (
        element !== null &&
        event.target instanceof Node &&
        !element.contains(event.target)
      ) {
        collapseNow();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isExpanded]);

  function handleToggle() {
    if (isExpanded) {
      collapseNow();
      return;
    }

    setIsExpanded(true);
    scheduleCollapse();
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      collapseNow();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape" && isExpanded) {
      event.stopPropagation();
      collapseNow();
    }
  }

  // After React commits the new layout, morph the island geometry: move it to
  // (or from) the centered position and tween the border radius toward its final
  // concrete value. The "morf" variant settles on a rounded-card radius while
  // expanded; "pill" keeps the full stadium at every size.
  useEffect(() => {
    const element = elementRef.current;
    if (element === null) return;
    if (prefersReducedMotion()) return;

    const targetRadius =
      variant === "morf" && isExpanded
        ? EXPANDED_RADIUS_PX
        : element.offsetHeight / 2;

    gsap.to(element, {
      left: isExpanded ? "50%" : "0%",
      xPercent: isExpanded ? -50 : 0,
      borderRadius: targetRadius,
      duration: CAPSULE_MORPH_DURATION,
      ease: CAPSULE_MORPH_EASE,
      overwrite: "auto",
    });
  }, [isExpanded, variant]);

  // Separate radius ease so the rounding can settle at its own pace without
  // lagging the silhouette.
  useEffect(() => {
    const element = elementRef.current;
    if (element === null || prefersReducedMotion()) return;

    const targetRadius =
      variant === "morf" && isExpanded
        ? EXPANDED_RADIUS_PX
        : element.offsetHeight / 2;

    gsap.to(element, {
      borderRadius: targetRadius,
      duration: CAPSULE_RADIUS_DURATION,
      ease: CAPSULE_RADIUS_EASE,
      overwrite: "auto",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- radius targets geometry only.
  }, [isExpanded, variant]);

  return (
    <button
      ref={elementRef}
      type="button"
      onClick={handleToggle}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
      aria-label={ariaLabel}
      style={{ left: 0 }}
      className={`pointer-events-auto absolute z-30 inline-flex select-none text-left transition-opacity duration-150 ease-out active:opacity-80 ${
        isExpanded
          ? `${variant === "morf" ? "rounded-[20px]" : "rounded-full"} max-w-[calc(100vw-1.5rem)] items-start p-4`
          : "min-h-12 items-center rounded-full px-4"
      } ${
        tone === "accent" ? "glass-panel-accent" : "glass-panel"
      } ${className ?? ""}`}
    >
      {progressPercent !== undefined ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-[var(--studia-cobalto)]"
          style={{
            mask: `linear-gradient(to right, black ${Math.min(Math.max(progressPercent, 0), 100)}%, transparent ${Math.min(Math.max(progressPercent, 0), 100)}%)`,
          }}
        />
      ) : null}
      <div
        className={
          isExpanded
            ? "flex items-start gap-3"
            : "flex min-w-0 items-center gap-1.5"
        }
      >
        <div className={isExpanded ? "shrink-0" : "min-w-0"}>{minimized}</div>

        {isExpanded ? (
          <div
            className="min-w-0 flex-1 motion-safe:animate-[studia-capsule-in_0.35s_var(--ease-out-soft)]"
            aria-hidden={false}
          >
            {expanded}
          </div>
        ) : null}
      </div>
    </button>
  );
}
