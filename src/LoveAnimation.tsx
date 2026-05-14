import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { Motion, Presence } from "solid-motionone";
import type { LoveAnimation } from "./loveLogic";
import ResultCard from "./ResultCard";
import { buildShareUrl } from "./share";

type Phase = "strike" | "count" | "flames" | "winner" | "done";

interface Props {
  data: LoveAnimation;
  name1Raw: string;
  name2Raw: string;
  onReplay: () => void;
  skipAnimation?: boolean;
  shared?: boolean;
  incomingMessage?: string | null;
}

const STRIKE_MS = 380;
const COUNT_MS = 1600;
const TICK_MS = 260;
const STEP_PAUSE_MS = 540;
const WINNER_MS = 1200;

export default function LoveAnimation(props: Props) {
  const [phase, setPhase] = createSignal<Phase>("strike");
  const [pairsShown, setPairsShown] = createSignal(0);
  const [stepIdx, setStepIdx] = createSignal(0);
  const [tickIdx, setTickIdx] = createSignal(-1);
  const [removing, setRemoving] = createSignal(false);

  let timers: number[] = [];
  const clearTimers = () => {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
  };
  onCleanup(clearTimers);

  createEffect(
    on(
      () => props.data,
      () => {
        clearTimers();
        setStepIdx(0);
        setTickIdx(-1);
        setRemoving(false);

        if (props.skipAnimation) {
          setPairsShown(props.data.pairs.length);
          setPhase("done");
          return;
        }

        setPairsShown(0);
        setPhase("strike");

        const total = props.data.pairs.length;
        for (let k = 1; k <= total; k++) {
          timers.push(
            window.setTimeout(() => setPairsShown(k), k * STRIKE_MS)
          );
        }
        const afterStrike = total * STRIKE_MS + 400;

        if (props.data.count === 0) {
          timers.push(window.setTimeout(() => setPhase("done"), afterStrike));
          return;
        }

        timers.push(window.setTimeout(() => setPhase("count"), afterStrike));
        timers.push(
          window.setTimeout(() => setPhase("flames"), afterStrike + COUNT_MS)
        );

        let cursor = afterStrike + COUNT_MS + 200;
        props.data.flamesSteps.forEach((step, sIdx) => {
          timers.push(
            window.setTimeout(() => {
              setStepIdx(sIdx);
              setTickIdx(-1);
              setRemoving(false);
            }, cursor)
          );
          step.visited.forEach((_, vIdx) => {
            cursor += TICK_MS;
            timers.push(window.setTimeout(() => setTickIdx(vIdx), cursor));
          });
          cursor += TICK_MS;
          timers.push(window.setTimeout(() => setRemoving(true), cursor));
          cursor += STEP_PAUSE_MS;
        });

        timers.push(window.setTimeout(() => setPhase("winner"), cursor));
        timers.push(
          window.setTimeout(() => setPhase("done"), cursor + WINNER_MS)
        );
      }
    )
  );

  const struck1Now = createMemo(() => {
    const n = props.data.name1.length;
    const arr = new Array<boolean>(n).fill(false);
    for (let k = 0; k < pairsShown(); k++) arr[props.data.pairs[k].i] = true;
    return arr;
  });
  const struck2Now = createMemo(() => {
    const n = props.data.name2.length;
    const arr = new Array<boolean>(n).fill(false);
    for (let k = 0; k < pairsShown(); k++) arr[props.data.pairs[k].j] = true;
    return arr;
  });

  const winningLetter = createMemo(() => {
    const last = props.data.flamesSteps[props.data.flamesSteps.length - 1];
    return last ? last.after[0] : null;
  });

  type Tile = { letter: string; key: string };
  const currentList = createMemo<Tile[]>(() => {
    const ph = phase();
    const sIdx = stepIdx();
    if (ph === "winner" || ph === "done") {
      const w = winningLetter();
      return w ? [{ letter: w, key: "winner" }] : [];
    }
    if (ph !== "flames") {
      return ["F", "L", "A", "M", "E", "S"].map((l, i) => ({
        letter: l,
        key: `init-${i}`,
      }));
    }
    const step = props.data.flamesSteps[sIdx];
    const arr = step ? step.before : ["F", "L", "A", "M", "E", "S"];
    return arr.map((l, i) => ({ letter: l, key: `s${sIdx}-${i}` }));
  });

  const cursorPos = createMemo(() => {
    if (phase() !== "flames") return -1;
    const step = props.data.flamesSteps[stepIdx()];
    const ti = tickIdx();
    if (!step || ti < 0) return -1;
    return step.visited[ti];
  });

  const removingIdx = createMemo(() => {
    if (phase() !== "flames" || !removing()) return -1;
    const step = props.data.flamesSteps[stepIdx()];
    return step ? step.removeIdx : -1;
  });

  const tickNumber = createMemo(() => {
    if (phase() !== "flames") return 0;
    const ti = tickIdx();
    return ti < 0 ? 0 : ti + 1;
  });

  const commonChars = createMemo(() =>
    props.data.pairs.slice(0, pairsShown()).map((p) => p.char)
  );

  return (
    <div class="mt-8 w-full">
      <Show when={!props.skipAnimation}>
        <div class="glass rounded-3xl p-6 shadow-2xl sm:p-8">
          <NameStrike
        label={props.name1Raw || props.data.name1}
        chars={props.data.name1}
        struck={struck1Now()}
        accent="from-violet-glow to-indigo-500"
      />
      <div class="my-3 flex justify-center">
        <Motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          class="text-2xl text-cyan-glow drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]"
        >
          ✦
        </Motion.div>
      </div>
      <NameStrike
        label={props.name2Raw || props.data.name2}
        chars={props.data.name2}
        struck={struck2Now()}
        accent="from-cyan-glow to-violet-glow"
      />

      <Show when={commonChars().length > 0}>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-violet-200/70">
          <span>Common</span>
          <For each={commonChars()}>
            {(c) => (
              <Motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                class="inline-flex h-6 w-6 items-center justify-center rounded-md bg-cyan-glow/20 font-display text-sm font-bold text-cyan-glow ring-1 ring-cyan-glow/40"
              >
                {c}
              </Motion.span>
            )}
          </For>
        </div>
      </Show>

      <Presence>
        <Show when={phase() !== "strike"}>
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            class="mt-6 text-center"
          >
            <div class="text-[10px] uppercase tracking-[0.3em] text-violet-200/70">
              Remaining letters
            </div>
            <div class="mt-2 flex flex-wrap items-center justify-center gap-2 font-display text-xl text-white sm:text-2xl">
              <span class="rounded-md border border-violet-400/30 bg-midnight-800/60 px-3 py-1">
                {props.data.remaining1 || "·"}
              </span>
              <span class="text-violet-200/60">+</span>
              <span class="rounded-md border border-violet-400/30 bg-midnight-800/60 px-3 py-1">
                {props.data.remaining2 || "·"}
              </span>
              <span class="text-violet-200/60">=</span>
              <span class="font-black text-shimmer text-2xl sm:text-3xl">
                {props.data.count}
              </span>
            </div>
          </Motion.div>
        </Show>
      </Presence>

      <Presence>
        <Show
          when={
            phase() === "flames" || phase() === "winner" || phase() === "done"
          }
        >
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            class="mt-6"
          >
            <div class="mb-3 text-center text-[10px] uppercase tracking-[0.35em] text-violet-200/70">
              F · L · A · M · E · S
            </div>
            <div class="flex min-h-[100px] flex-wrap items-center justify-center gap-2 sm:gap-3">
              <For each={currentList()}>
                {(item, i) => {
                  const isCursor = () => cursorPos() === i();
                  const isRemoving = () => removingIdx() === i();
                  const isWinner = () =>
                    phase() === "winner" || phase() === "done";
                  return (
                    <div
                      class="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/40 bg-midnight-800/70 font-display text-2xl font-bold text-white shadow-[0_4px_20px_rgba(124,92,255,0.25)] transition-all duration-[350ms] ease-out sm:h-16 sm:w-16 sm:text-3xl"
                      classList={{
                        "scale-0 opacity-0 rotate-90": isRemoving(),
                        "scale-[1.7] !bg-gradient-to-br !from-violet-glow !to-cyan-glow !text-midnight-900 shadow-[0_0_60px_rgba(124,92,255,0.9)] animate-heartbeat":
                          isWinner(),
                        "scale-110 ring-2 ring-cyan-glow animate-cosmicPulse":
                          isCursor() && !isRemoving() && !isWinner(),
                        "scale-100 opacity-100":
                          !isRemoving() && !isWinner() && !isCursor(),
                      }}
                    >
                      {item.letter}
                      <Show when={isCursor() && !isRemoving()}>
                        <span class="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-glow text-xs font-black text-midnight-900 shadow ring-2 ring-violet-glow">
                          {tickNumber()}
                        </span>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
            <div class="mt-4 text-center text-xs uppercase tracking-widest text-violet-200/70">
              <Show
                when={phase() === "flames"}
                fallback={
                  <span class="text-shimmer font-bold">
                    {winningLetter()} wins · destiny revealed
                  </span>
                }
              >
                Counting to {props.data.count} · cycle {stepIdx() + 1} of{" "}
                {props.data.flamesSteps.length}
              </Show>
            </div>
          </Motion.div>
        </Show>
      </Presence>
        </div>
      </Show>

      <Show when={phase() === "done"}>
        <Show when={props.incomingMessage}>
          <IncomingMessage
            message={props.incomingMessage!}
            from={props.name1Raw || props.data.name1}
          />
        </Show>
        <ResultCard
          result={props.data.result}
          name1={props.name1Raw || props.data.name1}
          name2={props.name2Raw || props.data.name2}
        />
        <ShareBar
          name1={props.name1Raw || props.data.name1}
          name2={props.name2Raw || props.data.name2}
          onReplay={props.onReplay}
          replayLabel={props.shared ? "Calculate your own" : "Try another"}
          shared={!!props.shared}
        />
      </Show>
    </div>
  );
}

function NameStrike(props: {
  label: string;
  chars: string;
  struck: boolean[];
  accent: string;
}) {
  return (
    <div>
      <div class="mb-2 text-center text-[10px] uppercase tracking-[0.35em] text-violet-200/60">
        {props.label}
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <For each={props.chars.split("")}>
          {(ch, i) => (
            <Motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i() * 0.04, duration: 0.35 }}
              class={`relative flex h-11 w-10 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${props.accent} font-display text-2xl font-bold text-white shadow`}
            >
              <span
                class="relative z-10"
                classList={{ "opacity-40": props.struck[i()] }}
              >
                {ch}
              </span>
              <Show when={props.struck[i()]}>
                <Motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.3, easing: "ease-out" }}
                  class="pointer-events-none absolute left-1.5 right-1.5 top-1/2 z-20 h-[3px] origin-left -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)]"
                />
              </Show>
            </Motion.div>
          )}
        </For>
      </div>
    </div>
  );
}

const MESSAGE_LIMIT = 240;

function ShareBar(props: {
  name1: string;
  name2: string;
  onReplay: () => void;
  replayLabel?: string;
  shared?: boolean;
}) {
  const [mode, setMode] = createSignal<"full" | "fast">("full");
  const [copied, setCopied] = createSignal(false);
  const [message, setMessage] = createSignal("");
  const trimmedMsg = createMemo(() => message().slice(0, MESSAGE_LIMIT));
  const url = createMemo(() =>
    buildShareUrl(props.name1, props.name2, {
      fast: mode() === "fast",
      message: trimmedMsg(),
    })
  );

  const onCopy = async () => {
    const link = url();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const onNativeShare = async () => {
    const link = url();
    if (typeof navigator !== "undefined" && (navigator as Navigator).share) {
      try {
        await (navigator as Navigator).share({
          title: "Love Calculator",
          text: `${props.name1} × ${props.name2} — see our destiny`,
          url: link,
        });
        return;
      } catch {
        /* fallthrough to copy */
      }
    }
    await onCopy();
  };

  return (
    <div class="mt-6 space-y-3">
      <Show when={!props.shared}>
        <div class="glass rounded-2xl p-4">
          <div class="mb-2 flex items-center justify-between">
            <label
              for="love-message"
              class="text-[10px] uppercase tracking-[0.3em] text-violet-200/80"
            >
              💌 Share with your loved one
            </label>
            <span
              class="text-[10px] tabular-nums"
              classList={{
                "text-violet-200/50":
                  trimmedMsg().length < MESSAGE_LIMIT * 0.85,
                "text-cyan-glow": trimmedMsg().length >= MESSAGE_LIMIT * 0.85,
              }}
            >
              {trimmedMsg().length}/{MESSAGE_LIMIT}
            </span>
          </div>
          <textarea
            id="love-message"
            rows={3}
            maxLength={MESSAGE_LIMIT}
            placeholder="Write a note for them… something only you two would smile at."
            value={message()}
            onInput={(e) => setMessage(e.currentTarget.value)}
            class="w-full resize-none rounded-xl border border-violet-400/30 bg-midnight-900 px-3 py-2 font-display text-base italic leading-relaxed text-white outline-none transition placeholder:not-italic placeholder:font-body placeholder:text-sm placeholder:text-violet-200/40 focus:border-cyan-glow focus:ring-2 focus:ring-cyan-glow/30"
          />
        </div>
      </Show>

      <div class="flex justify-center">
        <div class="inline-flex rounded-full border border-violet-400/30 bg-midnight-800/60 p-1 text-[10px] uppercase tracking-[0.2em]">
          <button
            type="button"
            onClick={() => setMode("full")}
            class="rounded-full px-4 py-1.5 transition"
            classList={{
              "bg-gradient-to-r from-violet-glow to-cyan-glow text-midnight-900 font-bold":
                mode() === "full",
              "text-violet-200/80 hover:text-white": mode() !== "full",
            }}
          >
            Full animation
          </button>
          <button
            type="button"
            onClick={() => setMode("fast")}
            class="rounded-full px-4 py-1.5 transition"
            classList={{
              "bg-gradient-to-r from-violet-glow to-cyan-glow text-midnight-900 font-bold":
                mode() === "fast",
              "text-violet-200/80 hover:text-white": mode() !== "fast",
            }}
          >
            Result only
          </button>
        </div>
      </div>
      <div class="glass flex items-center gap-2 rounded-2xl p-2 pl-4">
        <span class="truncate font-mono text-xs text-cyan-glow/90">
          {url()}
        </span>
        <button
          type="button"
          onClick={onCopy}
          class="ml-auto shrink-0 rounded-xl bg-gradient-to-r from-violet-glow to-cyan-glow px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-midnight-900 transition active:scale-95"
        >
          {copied() ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <Motion.button
          press={{ scale: 0.95 }}
          hover={{ scale: 1.05 }}
          onClick={onNativeShare}
          class="rounded-full border border-cyan-glow/50 bg-midnight-800/60 px-5 py-2 text-xs uppercase tracking-[0.25em] text-cyan-glow hover:border-cyan-glow"
        >
          ↗ Share link
        </Motion.button>
        <Motion.button
          press={{ scale: 0.95 }}
          hover={{ scale: 1.05 }}
          onClick={props.onReplay}
          class="rounded-full border border-violet-glow/50 bg-midnight-800/60 px-5 py-2 text-xs uppercase tracking-[0.25em] text-violet-100 hover:border-violet-glow"
        >
          ↺ {props.replayLabel ?? "Try another"}
        </Motion.button>
      </div>
    </div>
  );
}

function IncomingMessage(props: { message: string; from: string }) {
  const words = createMemo(() =>
    props.message.split(/(\s+)/).filter((w) => w.length > 0)
  );
  const [hearts] = createSignal(
    Array.from({ length: 8 }, (_, i) => ({
      left: 8 + Math.random() * 84,
      delay: Math.random() * 2,
      duration: 4 + Math.random() * 3,
      size: 10 + Math.random() * 10,
      key: i,
    }))
  );

  return (
    <Motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92, rotate: -1 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{ delay: 0.4, duration: 0.8, easing: [0.22, 1, 0.36, 1] }}
      class="relative mt-6 w-full"
    >
      <div
        class="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 30%, rgba(34,211,238,0.35), transparent 60%), radial-gradient(50% 50% at 75% 70%, rgba(124,92,255,0.4), transparent 60%)",
        }}
      />

      <div
        class="glass relative overflow-hidden rounded-3xl p-7 sm:p-9"
        style={{
          "box-shadow":
            "0 0 0 1px rgba(34,211,238,0.3), 0 30px 80px -20px rgba(34,211,238,0.4), 0 0 80px -20px rgba(124,92,255,0.5)",
        }}
      >
        <div
          class="pointer-events-none absolute -inset-1/2 animate-auroraDrift opacity-40"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(34,211,238,0.18), rgba(124,92,255,0.22), rgba(34,211,238,0.18), rgba(124,92,255,0.22), rgba(34,211,238,0.18))",
            filter: "blur(40px)",
          }}
        />

        <div class="pointer-events-none absolute inset-0 overflow-hidden">
          <For each={hearts()}>
            {(h) => (
              <span
                class="absolute bottom-[-20px] block animate-floatUp text-cyan-glow/40"
                style={{
                  left: `${h.left}%`,
                  "font-size": `${h.size}px`,
                  "animation-delay": `${h.delay}s`,
                  "animation-duration": `${h.duration}s`,
                  filter: "drop-shadow(0 0 8px rgba(34,211,238,0.6))",
                }}
              >
                ✦
              </span>
            )}
          </For>
        </div>

        <div class="relative">
          <Motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            class="mb-6 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] text-cyan-glow/85"
          >
            <span class="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-glow/50" />
            <span class="animate-gentleBob whitespace-nowrap">
              💌 A message for you
            </span>
            <span class="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-glow/50" />
          </Motion.div>

          <div class="relative px-6 sm:px-10">
            <Motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              class="absolute -top-2 left-0 font-display text-5xl leading-none text-cyan-glow/70 sm:text-6xl"
              aria-hidden="true"
              style={{ "text-shadow": "0 0 24px rgba(34,211,238,0.6)" }}
            >
              “
            </Motion.span>
            <Motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.95, duration: 0.5 }}
              class="absolute -bottom-6 right-0 font-display text-5xl leading-none text-violet-glow/70 sm:text-6xl"
              aria-hidden="true"
              style={{ "text-shadow": "0 0 24px rgba(124,92,255,0.6)" }}
            >
              ”
            </Motion.span>

            <p class="text-center font-display text-xl italic leading-relaxed text-white sm:text-2xl">
              <For each={words()}>
                {(word, i) => (
                  <Motion.span
                    initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      delay: 1 + i() * 0.07,
                      duration: 0.55,
                      easing: [0.22, 1, 0.36, 1],
                    }}
                    class="inline-block whitespace-pre"
                  >
                    {word}
                  </Motion.span>
                )}
              </For>
            </p>
          </div>

          <Motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              delay: 1 + words().length * 0.07 + 0.3,
              duration: 0.7,
            }}
            class="mx-auto mt-6 flex w-2/3 origin-center items-center gap-3"
          >
            <span class="h-px flex-1 bg-gradient-to-r from-transparent via-violet-glow/60 to-transparent" />
            <span class="text-cyan-glow text-sm">✦</span>
            <span class="h-px flex-1 bg-gradient-to-r from-transparent via-violet-glow/60 to-transparent" />
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 1 + words().length * 0.07 + 0.7,
              duration: 0.6,
            }}
            class="mt-3 flex items-baseline justify-end gap-2"
          >
            <span class="text-xs uppercase tracking-[0.3em] text-violet-200/60">
              with love,
            </span>
            <span
              class="font-script text-3xl font-bold text-shimmer sm:text-4xl"
              style={{
                "text-shadow": "0 0 20px rgba(34,211,238,0.4)",
              }}
            >
              {props.from}
            </span>
          </Motion.div>
        </div>
      </div>
    </Motion.div>
  );
}
