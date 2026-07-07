import OrbSphere from "./OrbSphere";

const asset = (name: string) => `/assets/${name}`;

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

function DarkButton({
  label,
  icon,
  iconPosition = "left",
  className = "",
  disabled = false,
}: {
  label: string;
  icon?: string;
  iconPosition?: "left" | "right";
  className?: string;
  disabled?: boolean;
}) {
  const iconEl = icon && (
    <span className="size-5 shrink-0">
      <img src={icon} alt="" className="block size-full" />
    </span>
  );
  return (
    <button
      type="button"
      disabled={disabled}
      className={`relative flex items-center justify-center overflow-hidden rounded-[10px] px-2 py-1.5 ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      style={{ background: "linear-gradient(to bottom, #737373, #404040)" }}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-[10px]"
        style={{ boxShadow: "inset 0px 1px 0.5px 0px rgba(255,255,255,0.28)" }}
      />
      <span className="flex items-center">
        {iconPosition === "left" && iconEl}
        <span className="flex items-center justify-center px-1">
          <span className="whitespace-nowrap text-center text-sm font-medium tracking-[-0.15px] text-[rgba(255,255,255,0.8)]">
            {label}
          </span>
        </span>
        {iconPosition === "right" && iconEl}
      </span>
    </button>
  );
}

function LightButton({ label, icon }: { label: string; icon?: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center overflow-hidden rounded-[10px] border border-[rgba(26,26,26,0.09)] px-2 py-1.5"
      style={{ background: "linear-gradient(to bottom, #fafafa, #f5f5f5)" }}
    >
      <span className="flex items-center">
        {icon && (
          <span className="size-5 shrink-0">
            <img src={icon} alt="" className="block size-full" />
          </span>
        )}
        <span className="flex items-center justify-center px-1">
          <span className="whitespace-nowrap text-center text-sm font-medium tracking-[-0.15px] text-[rgba(26,26,26,0.6)]">
            {label}
          </span>
        </span>
      </span>
    </button>
  );
}

/* ---------- card primitives ---------- */

const cardClass =
  "flex h-full flex-1 min-w-0 flex-col justify-between rounded-[24px] border border-[rgba(26,26,26,0.09)] bg-white/60 p-5 backdrop-blur-[10px]";

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

function AiScoreCard() {
  return (
    <div className={cardClass}>
      <div className="flex w-full items-start justify-between">
        <CardLabel>AI score</CardLabel>
        <div className="size-10 shrink-0">
          <img src={asset("chart.svg")} alt="" className="block size-full" />
        </div>
      </div>
      <div className="flex w-full items-baseline justify-between">
        <p className="text-[32px] font-medium leading-10 tracking-[0.5px] text-[rgba(26,26,26,0.8)]">
          71%
        </p>
        <div className="flex items-center gap-1">
          <img
            src={asset("warning-triangle.svg")}
            alt=""
            className="size-5 shrink-0"
          />
          <span className="whitespace-nowrap text-sm font-medium tracking-[-0.15px] text-[#b45309]">
            Needs input
          </span>
        </div>
      </div>
    </div>
  );
}

function ProgressTrack({
  fill,
  color,
  border = false,
}: {
  fill: string;
  color: string;
  border?: boolean;
}) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[rgba(16,104,68,0.06)]">
      <div
        className="absolute bottom-0 left-0 top-0 rounded-full"
        style={{
          width: fill,
          background: color,
          border: border ? "1px solid rgba(26,26,26,0.09)" : undefined,
          boxShadow: "inset 0px -1px 3px 0px rgba(0,0,0,0.25)",
        }}
      />
    </div>
  );
}

function CompareCard() {
  const logos = [
    asset("logo-1.svg"),
    asset("chatgpt.svg"),
    asset("google.svg"),
    asset("logo-2.svg"),
    asset("image80.png"),
    asset("logo-3.svg"),
  ];
  return (
    <div className={cardClass}>
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
          <ProgressTrack fill="94%" color="#18c280" border />
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
          <ProgressTrack fill="49%" color="rgba(26,26,26,0.6)" border />
        </div>
      </div>
    </div>
  );
}

function CoverageCard() {
  const segments = ["#18c280", "#18c280", "#fbbf24", "#f87171", "#f87171"];
  return (
    <div className={cardClass}>
      <div className="flex w-full items-start justify-between">
        <CardLabel>Coverage</CardLabel>
        <IconBadge src={asset("warning-triangle-2.svg")} bg="#fef3c7" />
      </div>
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-baseline gap-0.5">
          <span className="text-[32px] font-medium leading-10 tracking-[0.5px] text-[rgba(26,26,26,0.8)]">
            3 of 5
          </span>
          <span className="text-sm font-medium leading-5 tracking-[-0.15px] text-[rgba(26,26,26,0.6)]">
            /areas strong
          </span>
        </div>
        <div className="flex h-2 w-full items-center gap-1">
          {segments.map((color, i) => (
            <div
              key={i}
              className="h-full min-w-0 flex-1 rounded-full border border-[rgba(26,26,26,0.06)]"
              style={{
                background: color,
                boxShadow: "inset 0px -1px 3px 0px rgba(0,0,0,0.25)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TestResultsCard() {
  return (
    <div className={cardClass}>
      <div className="flex w-full items-start justify-between">
        <CardLabel>Test results</CardLabel>
        <IconBadge src={asset("checkmark.svg")} bg="rgba(16,104,68,0.06)" />
      </div>
      <div className="flex flex-col items-start">
        <div className="flex items-baseline gap-0.5 whitespace-nowrap text-[rgba(26,26,26,0.8)]">
          <span className="text-[32px] font-medium leading-10 tracking-[0.5px]">
            4
          </span>
          <span className="text-sm font-medium leading-5 tracking-[-0.15px]">
            /testers
          </span>
        </div>
        <p className="text-sm font-medium leading-5 tracking-[-0.15px] text-[rgba(26,26,26,0.6)]">
          11 avg messages
        </p>
      </div>
    </div>
  );
}

function NextStepCard() {
  return (
    <div className={cardClass}>
      <div className="flex w-full items-start justify-between">
        <CardLabel>Next step</CardLabel>
        <IconBadge src={asset("checkmark.svg")} bg="rgba(16,104,68,0.06)" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <p className="whitespace-nowrap text-base font-medium leading-6 tracking-[-0.5px] text-[rgba(26,26,26,0.8)]">
          Train 2 areas before launch
        </p>
        <DarkButton
          label="Train now"
          icon={asset("search-icon-dark.svg")}
          className="w-full"
        />
      </div>
    </div>
  );
}

/* ---------- screen ---------- */

export default function AiBlueprint() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white font-sans">
      {/* animated network orb — full-screen container, settles as a bottom dome */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%)",
        }}
      >
        <div className="orb-anim absolute inset-0 size-full">
          <OrbSphere className="absolute inset-0 size-full" />
        </div>
      </div>

      {/* loading caption shown beneath the small sphere */}
      <div
        className="loading-copy pointer-events-none absolute left-1/2 top-1/2 z-10"
        style={{ transform: "translate(-50%, 110px)" }}
      >
        <span className="shimmer-text text-[16px] font-medium leading-6">
          Loading your Ai...
        </span>
      </div>

      {/* bottom white fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[312px]">
        <img
          src={asset("bg-fade.svg")}
          alt=""
          className="size-full object-cover"
        />
      </div>

      {/* top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-[rgba(255,255,255,0.75)] px-5 pt-7 backdrop-blur-[4px]">
        <div className="flex flex-1 items-center justify-between pb-4">
          <div className="h-6 w-[98px] shrink-0">
            <img
              src={asset("brand.svg")}
              alt="Kodara"
              className="block size-full object-contain"
            />
          </div>
          <DarkButton
            label="Share AI"
            icon={asset("dropdown-icon.svg")}
            iconPosition="right"
            disabled
          />
        </div>
      </header>

      {/* centered text */}
      <div className="absolute left-1/2 top-[75px] z-10 flex w-[411px] max-w-[calc(100%-40px)] -translate-x-1/2 flex-col items-center gap-6">
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
              className="flex items-center rounded-[24px] bg-[#fffbeb] px-1.5 py-0.5"
              style={intro(6.2)}
            >
              <span className="whitespace-nowrap text-xs font-medium tracking-[-0.15px] text-[#b45309]">
                Not ready
              </span>
            </div>
            <h1 className="w-full text-center text-[32px] font-medium leading-10 text-[rgba(26,26,26,0.8)]">
              <WordReveal text="Lucas, you are almost there." baseDelay={6.3} />
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
            <LightButton
              label="Improve your AI"
              icon={asset("search-icon.svg")}
            />
          </div>
        </div>
      </div>

      {/* bottom container */}
      <div className="absolute bottom-[31px] left-1/2 z-10 flex w-[min(1200px,calc(100%-40px))] -translate-x-1/2 flex-col items-center gap-6">
        <div
          data-intro
          className="flex h-9 items-center rounded-[24px] border border-[rgba(26,26,26,0.09)] bg-[rgba(255,255,255,0.6)] p-4 backdrop-blur-[10px]"
          style={intro(5.35)}
        >
          <p className="whitespace-nowrap text-center text-sm font-normal leading-5 text-[rgba(26,26,26,0.8)]">
            Click on each card to see the full breakdown.
          </p>
        </div>
        <div className="cards-in flex h-[168px] w-full items-center gap-[19px]">
          <AiScoreCard />
          <CompareCard />
          <CoverageCard />
          <TestResultsCard />
          <NextStepCard />
        </div>
      </div>
    </div>
  );
}
