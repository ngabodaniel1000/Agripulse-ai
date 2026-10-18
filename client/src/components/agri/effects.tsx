"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { LiquidLogoMark } from "./LiquidLogoMark";

/** Respects the user's reduced-motion preference. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Subtle animated gradient backdrop. Pure CSS, no external shader dependency,
 * and disabled when reduced motion is requested.
 */
export function ShaderGradient({
  className = "",
  children,
  variant = "brand",
}: {
  className?: string;
  children?: ReactNode;
  variant?: "brand" | "field" | "market";
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className={`shader-gradient shader-${variant} ${reduced ? "shader-static" : ""} ${className}`}
      aria-hidden={children ? undefined : true}
    >
      <span className="shader-blob shader-blob-a" />
      <span className="shader-blob shader-blob-b" />
      {children ? <div className="shader-content">{children}</div> : null}
    </div>
  );
}

/** Progressive-enhancement glass surface. Falls back to a solid panel. */
export function GlassCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={`glass-card ${className}`}>{children}</Tag>;
}

/** Scroll-driven reveal. Content is visible by default and only animates in. */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Polished brand presentation with a gentle liquid sheen. */
export function LiquidLogo({
  size = 44,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="liquid-logo">
      <LiquidLogoMark size={size} animated={!reduced} />
      {showWordmark ? (
        <div>
          <div className="liquid-logo-name">AgriPulse</div>
          <div className="liquid-logo-sub">Agricultural Intelligence</div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Read-aloud support using the browser speech synthesis API. Optional and
 * degrades to a hidden control when unsupported.
 */
export function ReadAloud({
  text,
  label = "Read this section aloud",
}: {
  text: string;
  label?: string;
}) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggle = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-RW";
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking, text]);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`read-aloud ${speaking ? "active" : ""}`}
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={label}
      title={label}
    >
      <SpeakerIcon speaking={speaking} />
      <span>{speaking ? "Stop reading" : "Read aloud"}</span>
    </button>
  );
}

function SpeakerIcon({ speaking }: { speaking: boolean }) {
  return speaking ? (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  ) : (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

/** Adds a staggered entrance to a list of children. */
export function useStagger(count: number, reduced: boolean): CSSProperties[] {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        animationDelay: reduced ? "0ms" : `${i * 60}ms`,
      })),
    [count, reduced],
  );
}
