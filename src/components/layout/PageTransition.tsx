import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";
import {
  PAGE_ENTER_DURATION,
  PAGE_ENTER_EASE,
  PAGE_EXIT_DURATION,
  PAGE_EXIT_EASE,
} from "@/lib/motion/eases";

interface PageTransitionProps {
  /**
   * Change this key (the active tab) to run exit → swap → entrance.
   * Children must keep stable state across the transition: the old page
   * renders while the exit runs and the new one only after the swap.
   */
  transitionKey: string;
  children: (activeKey: string) => ReactNode;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Liquid tab switch: the current page fades out quickly and the next one
// rises in with a subtle bounce. One persistent wrapper lets GSAP tween the
// same element across the content swap.
export function PageTransition({
  transitionKey,
  children,
}: PageTransitionProps) {
  const [displayKey, setDisplayKey] = useState(transitionKey);
  const elementRef = useRef<HTMLDivElement>(null);
  const shouldEnterRef = useRef(false);

  // Exit the current page, then swap and let the entrance effect run.
  useEffect(() => {
    if (transitionKey === displayKey) return;

    const element = elementRef.current;
    if (element === null || prefersReducedMotion()) {
      window.scrollTo(0, 0);
      setDisplayKey(transitionKey);
      return;
    }

    shouldEnterRef.current = false;
    gsap.killTweensOf(element);
    gsap.fromTo(
      element,
      { opacity: 1, y: 0, scale: 1 },
      {
        opacity: 0,
        y: -8,
        scale: 0.985,
        duration: PAGE_EXIT_DURATION,
        ease: PAGE_EXIT_EASE,
        onComplete: () => {
          window.scrollTo(0, 0);
          shouldEnterRef.current = true;
          setDisplayKey(transitionKey);
        },
      },
    );
  }, [transitionKey, displayKey]);

  // Bounce the freshly swapped page in, right after React commits it.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!shouldEnterRef.current || element === null) return;
    shouldEnterRef.current = false;
    if (prefersReducedMotion()) return;

    gsap.fromTo(
      element,
      { opacity: 0, y: 16, scale: 0.985 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: PAGE_ENTER_DURATION,
        ease: PAGE_ENTER_EASE,
      },
    );
  }, [displayKey]);

  useEffect(() => {
    const element = elementRef.current;
    return () => {
      if (element !== null) gsap.killTweensOf(element);
    };
  }, []);

  return <div ref={elementRef}>{children(displayKey)}</div>;
}