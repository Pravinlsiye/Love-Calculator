import { createEffect, createSignal, For, Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";
import type { Category, LoveResult } from "./loveLogic";

interface Props {
  result: LoveResult | null;
  name1: string;
  name2: string;
}

const CATEGORY_GRADIENT: Record<Category, [string, string]> = {
  Friends: ["#22d3ee", "#7c5cff"],
  Love: ["#ec4899", "#f472b6"],
  Affection: ["#a78bfa", "#22d3ee"],
  Marriage: ["#fbbf24", "#f472b6"],
  Enemy: ["#ef4444", "#f59e0b"],
  Sister: ["#34d399", "#22d3ee"],
};

const CATEGORY_ICON: Record<Category, string> = {
  Friends: "🤝",
  Love: "💖",
  Affection: "🌸",
  Marriage: "💍",
  Enemy: "⚔️",
  Sister: "👯",
};

export default function ResultCard(props: Props) {
  const [displayed, setDisplayed] = createSignal(0);

  createEffect(() => {
    const r = props.result;
    if (!r) {
      setDisplayed(0);
      return;
    }
    const target = r.percentage;
    const start = performance.now();
    const dur = 1600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });

  const ringStyle = () => {
    const r = props.result;
    if (!r) return {};
    const [c1, c2] = CATEGORY_GRADIENT[r.category];
    const pct = displayed();
    return {
      background: `conic-gradient(from -90deg, ${c1} 0deg, ${c2} ${pct * 3.6}deg, rgba(124,92,255,0.10) ${pct * 3.6}deg)`,
    };
  };

  const sparkles = Array.from({ length: 14 }, (_, i) => ({
    angle: (i / 14) * Math.PI * 2,
    delay: i * 0.08,
  }));

  return (
    <Presence exitBeforeEnter>
      <Show when={props.result} keyed>
        {(r) => (
          <Motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.55, easing: [0.22, 1, 0.36, 1] }}
            class="glass relative mt-8 w-full overflow-hidden rounded-3xl p-7 text-center sm:p-9"
            style={{
              "box-shadow":
                "0 0 0 1px rgba(124,92,255,0.25), 0 30px 80px -20px rgba(124,92,255,0.35), 0 0 60px -10px rgba(34,211,238,0.25)",
            }}
          >
            <div
              class="pointer-events-none absolute -top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(124,92,255,0.35), transparent 55%)",
              }}
            />

            <div class="relative">
              <div class="text-[10px] uppercase tracking-[0.4em] text-violet-200/70">
                Destiny Reading
              </div>
              <div class="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                <span class="text-shimmer">{props.name1}</span>
                <span class="mx-3 text-cyan-glow">×</span>
                <span class="text-shimmer">{props.name2}</span>
              </div>

              <div class="relative mx-auto mt-7 h-52 w-52 sm:h-60 sm:w-60">
                <For each={sparkles}>
                  {(s) => (
                    <Motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1.4, 0],
                      }}
                      transition={{
                        duration: 1.6,
                        delay: 0.6 + s.delay,
                        repeat: Infinity,
                        easing: "ease-in-out",
                      }}
                      class="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-cyan-glow shadow-[0_0_12px_rgba(34,211,238,0.95)]"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${s.angle}rad) translateY(-7.5rem)`,
                      }}
                    />
                  )}
                </For>

                <div
                  class="absolute inset-0 flex items-center justify-center rounded-full p-2 transition-all"
                  style={ringStyle()}
                >
                  <div class="flex h-full w-full flex-col items-center justify-center rounded-full bg-midnight-900/90 backdrop-blur">
                    <div class="font-display text-6xl font-black text-shimmer sm:text-7xl">
                      {displayed()}
                      <span class="text-3xl">%</span>
                    </div>
                    <div class="mt-1 text-[10px] uppercase tracking-[0.3em] text-violet-200/70">
                      love score
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-7 flex flex-col items-center gap-2">
                <div
                  class="rounded-full px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-midnight-900"
                  style={{
                    background: `linear-gradient(90deg, ${CATEGORY_GRADIENT[r.category][0]}, ${CATEGORY_GRADIENT[r.category][1]})`,
                  }}
                >
                  Result
                </div>
                <Motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  class="font-display text-5xl font-black text-white sm:text-6xl"
                >
                  <span class="mr-2">{CATEGORY_ICON[r.category]}</span>
                  <span class="text-shimmer">{r.category}</span>
                </Motion.div>
                <Motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                  class="mt-1 text-sm text-violet-100/85 sm:text-base"
                >
                  {r.tagline}
                </Motion.p>
              </div>

              <Show when={r.perfectMatch}>
                <Motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  class="mt-6 inline-block rounded-full bg-gradient-to-r from-violet-glow/40 to-cyan-glow/40 px-5 py-1.5 text-xs uppercase tracking-[0.3em] text-white ring-1 ring-cyan-glow/60 animate-heartbeat"
                >
                  ✦ Perfect Match ✦
                </Motion.div>
              </Show>
            </div>
          </Motion.div>
        )}
      </Show>
    </Presence>
  );
}

