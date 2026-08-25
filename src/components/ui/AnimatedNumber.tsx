import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedNumberProps {
  value: number;
  /** Decimal places to keep while tweening (averages use 1). */
  decimals?: number;
  className?: string;
}

// GSAP-driven count-up for hero numbers (promedio, progreso). Respects
// prefers-reduced-motion by jumping straight to the final value.
export function AnimatedNumber({
  value,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (element === null) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      element.textContent = value.toFixed(decimals);
      return;
    }

    const state = { current: Number(element.dataset.value ?? 0) };
    const tween = gsap.to(state, {
      current: value,
      duration: 0.9,
      ease: "power3.out",
      onUpdate: () => {
        element.textContent = state.current.toFixed(decimals);
      },
    });
    element.dataset.value = String(value);

    return () => {
      tween.kill();
    };
  }, [value, decimals]);

  return (
    <span ref={elementRef} className={className}>
      {value.toFixed(decimals)}
    </span>
  );
}
