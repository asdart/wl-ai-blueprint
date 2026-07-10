import { useEffect, useLayoutEffect, useRef, useState } from "react";
import OrbSphere from "./OrbSphere";
import Breakdown from "./Breakdown";
import ShareModal from "./ShareModal";
import { clamp01, easeInOut, lerp, prefersReducedMotion, useCountUp } from "./anim";

const asset = (name: string) => `/assets/${name}`;

/* current vertical scroll offset (px), updated via rAF. drives the two-stage
   scroll: stage 1 (first viewport) centers the globe, stage 2 reveals the
   breakdown. */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

/* ---------- load-in animation helpers ---------- */

/* the cards fade/rise in via the `.cards-in` CSS stagger; these constants let
   the in-card number/chart animations start in sync with each card. */
const CARD_BASE_DELAY = 5450;
const CARD_STAGGER = 120;
const cardDelay = (index: number) => CARD_BASE_DELAY + index * CARD_STAGGER;

/* the hero intro fully settles when the last element (Publish button, delayed
   6.85s + 0.55s reveal) finishes. scrolling stays locked until then. */
const INTRO_MS = 7400;

/* ring gauge that sweeps from empty → `value`% (value is 0..100). */
function AnimatedRing({ value }: { value: number }) {
  const r = 17.2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);
  return (
    <svg viewBox="0 0 40 40" className="block size-full" fill="none">
      <g transform="rotate(-90 20 20)">
        <circle
          cx="20"
          cy="20"
          r={r}
          stroke="#106844"
          strokeOpacity={0.06}
          strokeWidth={5.6}
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          stroke="#18C280"
          strokeWidth={5.6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </g>
    </svg>
  );
}

/* ---------- intro helpers ---------- */

function WordReveal({
  text,
  baseDelay = 0,
  step = 0.05,
}: {
  text: string;
  baseDelay?: number;
  step?: number;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          data-intro
          className="inline-block"
          style={{
            animation: `wordReveal 0.55s cubic-bezier(0.22,1,0.36,1) ${
              baseDelay + i * step
            }s both`,
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </>
  );
}

const intro = (delay: number, name = "riseFade", duration = 0.55) => ({
  animation: `${name} ${duration}s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
});

/* ---------- shared buttons ---------- */

function ProductButton({
  label,
  icon,
  className = "",
  onClick,
  variant = "dark",
}: {
  label: string;
  icon?: string;
  className?: string;
  onClick?: () => void;
  variant?: "dark" | "light";
}) {
  const light = variant === "light";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${
        light
          ? "product-button-light border border-[rgba(26,26,26,0.09)]"
          : "product-button shadow-[inset_0px_1px_0.5px_0px_rgba(255,255,255,0.28)]"
      } relative flex items-center justify-center overflow-hidden rounded-[10px] px-2 py-1.5 ${className}`}
    >
      <span className="relative z-10 flex items-center">
        {icon && (
          <span className="size-5 shrink-0">
            <img src={icon} alt="" className="block size-full" />
          </span>
        )}
        <span className="flex items-center justify-center px-1">
          <span
            className={`whitespace-nowrap text-center text-sm font-medium tracking-[-0.15px] ${
              light ? "text-[rgba(26,26,26,0.6)]" : "text-[rgba(255,255,255,0.8)]"
            }`}
          >
            {label}
          </span>
        </span>
      </span>
    </button>
  );
}

/* ---------- card primitives ---------- */

const cardClass =
  "flex h-full flex-1 min-w-0 flex-col justify-between rounded-[24px] border border-[rgba(26,26,26,0.09)] bg-white/60 p-5 text-left backdrop-blur-[10px]";

const interactiveCardClass =
  `${cardClass} metric-card cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(26,26,26,0.16)] hover:bg-white/80 hover:shadow-[0_8px_24px_rgba(26,26,26,0.08)] active:translate-y-0 active:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(26,26,26,0.12)]`;

function ClickableCard({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${label} breakdown`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={interactiveCardClass}
    >
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium leading-5 text-[rgba(26,26,26,0.6)]">
      {children}
    </p>
  );
}

function IconBadge({ src, bg }: { src: string; bg: string }) {
  return (
    <div
      className="relative size-6 shrink-0 overflow-hidden rounded-full"
      style={{ background: bg }}
    >
      <img
        src={src}
        alt=""
        className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}

/* ---------- individual cards ---------- */

function AiScoreCard({
  onClick,
  delay = 0,
}: {
  onClick?: () => void;
  delay?: number;
}) {
  const score = useCountUp(97, { delay, duration: 1100 });
  return (
    <ClickableCard label="AI score" onClick={onClick}>
      <div className="flex w-full items-start justify-between">
        <CardLabel>AI score</CardLabel>
        <div className="size-10 shrink-0">
          <AnimatedRing value={score} />
        </div>
      </div>
      <div className="flex w-full items-baseline justify-between">
        <p className="text-[32px] font-medium leading-10 tracking-[0.5px] text-[rgba(26,26,26,0.8)]">
          {Math.round(score)}%
        </p>
        <div className="flex items-center gap-1">
          <img src={asset("rocket.svg")} alt="" className="size-5 shrink-0" />
          <span className="whitespace-nowrap text-sm font-medium tracking-[-0.15px] text-[#106844]">
            Ready
          </span>
        </div>
      </div>
    </ClickableCard>
  );
}

function ProgressTrack({
  fill,
  color,
  border = false,
  delay = 0,
}: {
  fill: string;
  color: string;
  border?: boolean;
  delay?: number;
}) {
  const [width, setWidth] = useState("0%");
  useEffect(() => {
    if (prefersReducedMotion()) {
      setWidth(fill);
      return;
    }
    const timer = window.setTimeout(() => setWidth(fill), delay);
    return () => window.clearTimeout(timer);
  }, [fill, delay]);
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[rgba(16,104,68,0.06)]">
      <div
        className="absolute bottom-0 left-0 top-0 rounded-full"
        style={{
          width,
          background: color,
          border: border ? "1px solid rgba(26,26,26,0.09)" : undefined,
          boxShadow: "inset 0px -1px 3px 0px rgba(0,0,0,0.25)",
          transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
        }}
      />
    </div>
  );
}

function CompareCard({
  onClick,
  delay = 0,
}: {
  onClick?: () => void;
  delay?: number;
}) {
  const logos = [
    asset("logo-1.svg"),
    asset("chatgpt.svg"),
    asset("google.svg"),
    asset("logo-2.svg"),
    asset("image80.png"),
    asset("logo-3.svg"),
  ];
  return (
    <ClickableCard label="You vs the others" onClick={onClick}>
      <CardLabel>You vs the others</CardLabel>
      <div className="flex w-full flex-col gap-4">
        {/* High */}
        <div className="flex w-full flex-col gap-1">
          <div className="flex w-full items-end justify-between">
            <div className="relative size-6 overflow-hidden rounded-full bg-white">
              <img
                src={asset("avatar.png")}
                alt=""
                className="absolute inset-0 size-full rounded-full object-cover"
              />
            </div>
            <span className="whitespace-nowrap text-xs font-semibold tracking-[-0.15px] text-[rgba(16,104,68,0.8)]">
              High
            </span>
          </div>
          <ProgressTrack fill="94%" color="#18c280" border delay={delay} />
        </div>
        {/* Low */}
        <div className="flex w-full flex-col gap-1">
          <div className="flex w-full items-end justify-between">
            <div className="flex items-center">
              {logos.map((src, i) => (
                <span
                  key={src}
                  className="flex size-6 items-center justify-center overflow-hidden rounded-full border border-[#e5e5e5] bg-[#f5f5f5]"
                  style={{ marginLeft: i === 0 ? 0 : -12, zIndex: logos.length - i }}
                >
                  <img
                    src={src}
                    alt=""
                    className="size-full object-cover"
                  />
                </span>
              ))}
            </div>
            <span className="whitespace-nowrap text-xs font-semibold tracking-[-0.15px] text-[rgba(26,26,26,0.6)]">
              Low
            </span>
          </div>
          <ProgressTrack
            fill="49%"
            color="rgba(26,26,26,0.6)"
            border
            delay={delay + 150}
          />
        </div>
      </div>
    </ClickableCard>
  );
}

function CoverageCard({
  onClick,
  delay = 0,
}: {
  onClick?: () => void;
  delay?: number;
}) {
  const total = 5;
  const filled = Math.round(useCountUp(total, { delay, duration: 1000 }));
  return (
    <ClickableCard label="Coverage" onClick={onClick}>
      <div className="flex w-full items-start justify-between">
        <CardLabel>Coverage</CardLabel>
        <IconBadge src={asset("checkmark.svg")} bg="rgba(16,104,68,0.06)" />
      </div>
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-medium leading-10 tracking-[0.5px] text-[rgba(26,26,26,0.8)]">
            {filled}/{total}
          </span>
          <span className="text-sm font-medium leading-5 tracking-[-0.15px] text-[rgba(26,26,26,0.6)]">
            areas strong
          </span>
        </div>
        <div className="flex h-2 w-full items-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="h-full min-w-0 flex-1 rounded-full border border-[rgba(26,26,26,0.06)]"
              style={{
                background: i < filled ? "#18c280" : "transparent",
                boxShadow:
                  i < filled ? "inset 0px -1px 3px 0px rgba(0,0,0,0.25)" : "none",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>
    </ClickableCard>
  );
}

function TestResultsCard({
  onClick,
  delay = 0,
}: {
  onClick?: () => void;
  delay?: number;
}) {
  const testers = Math.round(useCountUp(4, { delay, duration: 900 }));
  const messages = Math.round(useCountUp(11, { delay, duration: 900 }));
  return (
    <ClickableCard label="Test results" onClick={onClick}>
      <div className="flex w-full items-start justify-between">
        <CardLabel>Test results</CardLabel>
        <IconBadge src={asset("checkmark.svg")} bg="rgba(16,104,68,0.06)" />
      </div>
      <div className="flex flex-col items-start">
        <div className="flex items-baseline gap-0.5 whitespace-nowrap text-[rgba(26,26,26,0.8)]">
          <span className="text-[32px] font-medium leading-10 tracking-[0.5px]">
            {testers}
          </span>
          <span className="text-sm font-medium leading-5 tracking-[-0.15px]">
            /testers
          </span>
        </div>
        <p className="text-sm font-medium leading-5 tracking-[-0.15px] text-[rgba(26,26,26,0.6)]">
          {messages} avg messages
        </p>
      </div>
    </ClickableCard>
  );
}

function NextStepCard({
  onClick,
  onPublish,
}: {
  onClick?: () => void;
  onPublish?: () => void;
}) {
  return (
    <ClickableCard label="Next step" onClick={onClick}>
      <div className="flex w-full items-start justify-between">
        <CardLabel>Next step</CardLabel>
        <IconBadge src={asset("checkmark.svg")} bg="rgba(16,104,68,0.06)" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <p className="whitespace-nowrap text-base font-medium leading-6 tracking-[-0.5px] text-[rgba(26,26,26,0.8)]">
          Send to your clients
        </p>
        <div
          className="w-full"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <ProductButton
            label="Publish"
            icon={asset("search-icon.svg")}
            variant="light"
            className="w-full"
            onClick={onPublish}
          />
        </div>
      </div>
    </ClickableCard>
  );
}

/* ---------- screen ---------- */

export default function AiBlueprint() {
  const scrollY = useScrollY();

  const [shareOpen, setShareOpen] = useState(false);

  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const navTargetRef = useRef<HTMLSpanElement>(null);
  const [rects, setRects] = useState<{ start: number; end: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const measure = () => {
      const t = heroTitleRef.current?.getBoundingClientRect();
      const n = navTargetRef.current?.getBoundingClientRect();
      if (!t || !n) return;
      // the hero content is translated up by `heroLeave * 60` on scroll — undo
      // that so `start` is the at-rest position and measurement stays correct
      // even when the page loads already scrolled.
      const vh = Math.max(window.innerHeight, 1);
      const heroLeaveNow = clamp01(window.scrollY / (vh * 0.45));
      setRects({ start: t.top + heroLeaveNow * 60, end: n.top });
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, []);

  // lock scrolling until the hero intro has fully played, so the user can't
  // scroll past the reveal before every element is on screen.
  const [scrollLocked, setScrollLocked] = useState(true);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setScrollLocked(false);
      return;
    }
    window.scrollTo(0, 0);
    const t = window.setTimeout(() => setScrollLocked(false), INTRO_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!scrollLocked) return;
    const root = document.documentElement;
    const body = document.body;
    const prevRoot = root.style.overflow;
    const prevBody = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevRoot;
      body.style.overflow = prevBody;
    };
  }, [scrollLocked]);

  const innerH = typeof window !== "undefined" ? window.innerHeight : 800;

  // STAGE 1 (scroll 0 → 1 viewport): the hero leaves and the globe glides to
  // the center of the screen, then snaps to a rest point.
  // STAGE 2 (scroll past 1 viewport): the hero scrolls away and the breakdown
  // reveals, card by card.
  const e = easeInOut(clamp01(scrollY / innerH));
  const heroLeave = clamp01(scrollY / (innerH * 0.45));

  const heroFade = 1 - heroLeave;
  const cardsFade = 1 - clamp01(scrollY / (innerH * 0.4));
  const warnFade = 1 - clamp01(scrollY / (innerH * 0.12));
  const breakdownActive = scrollY > innerH * 0.95;

  const sphereShift = -e * (innerH / 2 - 24);

  const titleTop = rects ? lerp(rects.start, rects.end, e) : 0;
  const titleSize = lerp(32, 16, e);

  // the top-bar Publish button fades in as the hero leaves and the title flies
  // into the nav — i.e. only once the user starts scrolling.
  const navBtnFade = clamp01((e - 0.55) / 0.35);

  return (
    <div className="relative w-full bg-white font-sans">
      {/* top bar */}
      <header className="fixed inset-x-0 top-0 z-30 bg-[rgba(255,255,255,0.75)] px-5 pt-7 backdrop-blur-[4px]">
        <div className="flex flex-1 items-center justify-between pb-4">
          <div className="h-6 w-[98px] shrink-0">
            <img
              src={asset("brand.svg")}
              alt="Kodara"
              className="block size-full object-contain"
            />
          </div>
          <div
            style={{
              opacity: navBtnFade,
              transform: `translateY(${(1 - navBtnFade) * -6}px)`,
              pointerEvents: navBtnFade < 0.05 ? "none" : undefined,
            }}
          >
            <ProductButton
              label="Publish"
              icon={asset("search-icon-white.svg")}
              onClick={() => setShareOpen(true)}
            />
          </div>
        </div>
        {/* invisible target used to measure where the title should land */}
        <span
          ref={navTargetRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-7 -translate-x-1/2 whitespace-nowrap text-base font-medium leading-6 text-transparent"
        >
          Lucas, you are ready
        </span>
      </header>

      {/* title that flies from the hero into the nav bar on scroll */}
      {rects && (
        <div
          aria-hidden
          className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2 text-center font-medium leading-none text-[rgba(26,26,26,0.8)]"
          style={{ top: titleTop, fontSize: titleSize }}
        >
          <WordReveal text="Lucas, you are ready" baseDelay={6.3} />
        </div>
      )}

      {/* AI sphere — fixed, viewport-centered backdrop. glides to the center of
          the screen during stage 1, then stays put while the breakdown cards
          scroll on top of it. the mask fades its bottom edge into the page. */}
      <div
        className="pointer-events-none fixed inset-0 z-0 mix-blend-multiply"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%)",
        }}
      >
        <div
          className="absolute inset-0 size-full"
          style={{ transform: `translateY(${sphereShift}px)` }}
        >
          <div className="orb-anim absolute inset-0 size-full">
            <OrbSphere className="absolute inset-0 size-full" />
          </div>
        </div>
      </div>

      {/* soft green ambient glow — fixed to the bottom of the viewport so it
          stays put while the breakdown scrolls over it, instead of scrolling
          up with the hero. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[312px]">
        <img src={asset("bg-fade.svg")} alt="" className="size-full object-cover" />
      </div>

      {/* STAGE 1 track — 2 viewports tall. the hero content pins for the first
          viewport while the globe glides to center, then unpins and fades so
          scrolling again brings the breakdown in over the centered globe. snap
          points rest the scroll at the top and the globe-centered position. */}
      <section className="relative z-10 h-[200vh] snap-start">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* loading caption shown beneath the small sphere */}
        <div
          className="loading-copy pointer-events-none absolute left-1/2 top-1/2 z-10"
          style={{ transform: "translate(-50%, 110px)" }}
        >
          <span className="shimmer-text text-[16px] font-medium leading-6">
            Loading your Ai...
          </span>
        </div>

        {/* centered text — slides up and fades out on scroll */}
        <div
          className="absolute left-1/2 z-10 mt-20 flex w-[411px] max-w-[calc(100%-40px)] flex-col items-center gap-6 pt-16"
          style={{
            transform: `translate(-50%, ${-heroLeave * 60}px)`,
            opacity: heroFade,
            pointerEvents: heroFade < 0.05 ? "none" : undefined,
          }}
        >
          <p
            data-intro
            className="w-full text-center text-base font-medium leading-7 tracking-[-0.15px] text-black"
            style={intro(6.1)}
          >
            AI blueprint
          </p>
          <div className="flex w-full flex-col items-center gap-6">
            <div className="flex w-full max-w-[480px] flex-col items-center gap-2">
              <div
                data-intro
                className="flex items-center rounded-[24px] bg-[rgba(16,104,68,0.06)] px-1.5 py-0.5"
                style={intro(6.2)}
              >
                <span className="whitespace-nowrap text-xs font-medium tracking-[-0.15px] text-[#106844]">
                  Ready to publish
                </span>
              </div>
              {/* invisible placeholder — the flying title above renders the text */}
              <h1
                ref={heroTitleRef}
                aria-label="Lucas, you are ready"
                className="w-full text-center text-[32px] font-medium leading-10 text-[rgba(26,26,26,0.8)] opacity-0"
              >
                Lucas, you are ready
              </h1>
              <p
                data-intro
                className="w-full text-center text-sm font-normal leading-5 text-[rgba(26,26,26,0.6)]"
                style={intro(6.7)}
              >
                In 47 tests, your AI matched your voice and method,
                <br />
                deferring appropriately.
              </p>
            </div>
            <div data-intro style={intro(6.85)}>
              <ProductButton
                label="Publish"
                icon={asset("search-icon-white.svg")}
                onClick={() => setShareOpen(true)}
              />
            </div>
          </div>
        </div>

        {/* bottom container — cards + scroll hint, slide up and fade out */}
        <div
          className="absolute bottom-[31px] left-1/2 z-10 flex w-[min(1200px,calc(100%-40px))] flex-col items-center gap-6"
          style={{
            transform: `translate(-50%, ${-heroLeave * 90}px)`,
            opacity: cardsFade,
            pointerEvents: cardsFade < 0.05 ? "none" : undefined,
          }}
        >
          <div className="cards-in flex h-[168px] w-full items-center gap-[19px]">
            <AiScoreCard delay={cardDelay(0)} />
            <CompareCard delay={cardDelay(1)} />
            <CoverageCard delay={cardDelay(2)} />
            <TestResultsCard delay={cardDelay(3)} />
            <NextStepCard onPublish={() => setShareOpen(true)} />
          </div>
          <div style={{ opacity: warnFade }}>
            <div
              data-intro
              style={intro(6.5)}
              className="flex h-9 items-center gap-1.5 rounded-[24px] border border-[rgba(26,26,26,0.09)] bg-[rgba(255,255,255,0.6)] py-4 pl-4 pr-3 backdrop-blur-[10px]"
            >
              <p className="whitespace-nowrap text-center text-sm font-normal leading-5 text-[rgba(26,26,26,0.8)]">
                Scroll down to see the full breakdown
              </p>
              <img
                src={asset("arrow-down.svg")}
                alt=""
                className="size-5 shrink-0"
              />
            </div>
          </div>
        </div>
      </div>
        {/* snap rest point at the globe-centered position (end of stage 1) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[100vh] h-px snap-start"
        />
      </section>

      {/* STAGE 2 — breakdown. each card animates itself in as it scrolls into
          view; `breakdownActive` gates the first card until the globe has
          centered (i.e. until the user scrolls again). */}
      <div className="relative z-10 flex snap-start justify-center px-5 pb-32 pt-[120px]">
        <Breakdown gate={breakdownActive} onShare={() => setShareOpen(true)} />
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </div>
  );
}
