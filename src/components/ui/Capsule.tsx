import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import {
  CAPSULE_MORPH_DURATION,
  CAPSULE_MORPH_EASE,
  CAPSULE_RADIUS_DURATION,
  CAPSULE_RADIUS_EASE,
} from "@/lib/motion/eases";

gsap.registerPlugin(Flip);

export type CapsuleVariant = "pill" | "morf";
export type CapsuleTone = "neutral" | "accent";

interface CapsuleProps {
  /** A: stadium at every size. B: iOS-style pill → rounded-card morph. */
  variant?: CapsuleVariant;
  /** Compact row shown while collapsed (~44px tall). */
  minimized: ReactNode;
  /** Full card shown while expanded. */
  expanded: ReactNode;
  /** Change this key to trigger one expand pulse (important events only). */
  pulseKey?: string | number;
  /** Delay before an expanded capsule collapses back (ms), manual or pulsed. */
  autoCollapseMs?: number;
  tone?: CapsuleTone;
  ariaLabel?: string;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const EXPANDED_RADIUS_PX = 20;

// The context capsule: a floating island that morphs between a compact
// round state and an expanded card. Morphs run through GSAP Flip so the two
// states can have completely different content and sizes. Radius is derived
// from the measured height (never 9999px) so the interpolation is real:
// every frame lands between concrete pixel values.
//
// Expansion is always transient: it ends after autoCollapseMs, on Escape,
// on focus leaving the island, or on a pointer press outside of it.
export function Capsule({
  variant = "pill",
  minimized,
  expanded,
  pulseKey,
  autoCollapseMs = 1500,
  tone = "neutral",
  ariaLabel = "Contexto actual",
  className,
}: CapsuleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const elementRef = useRef<HTMLButtonElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);
  const collapseTimerRef = useRef<number | undefined>(undefined);
  const previousPulseRef = useRef(pulseKey);

  function clearCollapseTimer() {
    if (collapseTimerRef.current !== undefined) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = undefined;
    }
  }

  function beginMorph() {
    if (elementRef.current !== null && !prefersReducedMotion()) {
      flipStateRef.current = Flip.getState(elementRef.current);
    }
  }

  function scheduleCollapse() {
    clearCollapseTimer();
    collapseTimerRef.current = window.setTimeout(() => {
      beginMorph();
      setIsExpanded(false);
    }, autoCollapseMs);
  }

  function collapseNow() {
    beginMorph();
    clearCollapseTimer();
    setIsExpanded(false);
  }

  // Auto-expand pulses: fired only when the caller bumps pulseKey.
  useEffect(() => {
    if (pulseKey === undefined || pulseKey === "") return;
    if (previousPulseRef.current === pulseKey) return;

    previousPulseRef.current = pulseKey;
    beginMorph();
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

    beginMorph();
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

  // After React commits the new state, morph from the captured snapshot and
  // tween border-radius toward its final concrete value.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element === null) return;

    const targetRadius =
      variant === "morf" && isExpanded
        ? `${EXPANDED_RADIUS_PX}px`
        : `${element.offsetHeight / 2}px`;

    const snapshot = flipStateRef.current;
    flipStateRef.current = null;

    if (snapshot === null || prefersReducedMotion()) {
      element.style.borderRadius = targetRadius;
      return;
    }

    gsap.to(element, {
      borderRadius: targetRadius,
      duration: CAPSULE_RADIUS_DURATION,
      ease: CAPSULE_RADIUS_EASE,
      // overwrite: "auto",
    });
    Flip.from(snapshot, {
      duration: CAPSULE_MORPH_DURATION,
      ease: CAPSULE_MORPH_EASE,
      // Transform-anchored morph: the island scales as one unit. Children are
      // never transformed individually, so the text never re-flows or appears
      // to reshuffle its letters mid-animation.
      absolute: false,
    });
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
      style={{ borderRadius: 22 }}
      className={`fixed pointer-events-auto z-30 inline-flex select-none text-left transition-transform duration-150 ease-out active:scale-[0.97] ${
        isExpanded
          ? "mx-auto max-w-full items-stretch p-4"
          : "h-11 items-center px-3.5"
      } ${tone === "accent" ? "glass-panel-accent" : "glass-panel"} ${
        className ?? ""
      }`}
    >
      <div
        key={isExpanded ? "expanded" : "minimized"}
        className={`flex min-w-0 ${
          isExpanded ? "w-max flex-col gap-1" : "items-center gap-1.5"
        } motion-safe:animate-[studia-scale-in_0.3s_var(--ease-out-soft)]`}
      >
        {isExpanded ? expanded : minimized}
      </div>
    </button>
  );
}
