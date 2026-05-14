import { createSignal, onMount, Show } from "solid-js";
import { Motion, Presence } from "solid-motionone";
import ThreeBackground from "./ThreeBackground";
import LoveAnimation from "./LoveAnimation";
import { calculateAnimation, type LoveAnimation as LA } from "./loveLogic";
import { clearHash, decodePayload, readShareFromHash } from "./share";

export default function App() {
  const [name1, setName1] = createSignal("");
  const [name2, setName2] = createSignal("");
  const [data, setData] = createSignal<LA | null>(null);
  const [computing, setComputing] = createSignal(false);
  const [shared, setShared] = createSignal(false);
  const [skip, setSkip] = createSignal(false);
  const [incomingMessage, setIncomingMessage] = createSignal<string | null>(
    null
  );

  const run = (a: string, b: string, opts?: { fast?: boolean }) => {
    if (!a.trim() || !b.trim()) return;
    setName1(a);
    setName2(b);
    setSkip(!!opts?.fast);
    setComputing(true);
    setData(null);
    setTimeout(
      () => {
        setData(calculateAnimation(a, b));
        setComputing(false);
      },
      opts?.fast ? 0 : 350
    );
  };

  onMount(() => {
    const load = readShareFromHash();
    if (!load) return;
    const decoded = decodePayload(load.token);
    if (!decoded) return;
    setShared(true);
    setIncomingMessage(decoded.message);
    run(decoded.name1, decoded.name2, { fast: load.fast });
  });

  const onSubmit = (e: Event) => {
    e.preventDefault();
    run(name1(), name2());
  };

  const onReplay = () => {
    setData(null);
    setName1("");
    setName2("");
    setShared(false);
    setSkip(false);
    setIncomingMessage(null);
    clearHash();
  };

  return (
    <div class="relative min-h-screen w-full overflow-hidden bg-midnight-900 text-white">
      <ThreeBackground />

      <main class="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-5 py-12">
        <Motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          class="font-display text-5xl font-black tracking-tight text-shimmer sm:text-6xl"
        >
          Love Calculator
        </Motion.h1>

        <Motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          class="mt-3 text-center text-sm tracking-[0.3em] text-violet-200/80 sm:text-base"
        >
          <Show when={shared()} fallback={<>Two names · One destiny</>}>
            Someone shared this with you ✨
          </Show>
        </Motion.p>

        <Presence exitBeforeEnter>
          <Show when={!data() && !shared()} keyed>
            <Motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              class="glass mt-10 w-full rounded-3xl p-6 sm:p-8"
            >
              <div class="space-y-4">
                <Field
                  label="Your name"
                  value={name1()}
                  onInput={setName1}
                  placeholder="e.g. Surya"
                />
                <Field
                  label="Their name"
                  value={name2()}
                  onInput={setName2}
                  placeholder="e.g. Jyothika"
                />
              </div>

              <div class="mt-6 flex gap-3">
                <Motion.button
                  type="submit"
                  press={{ scale: 0.96 }}
                  hover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  disabled={computing()}
                  class="flex-1 rounded-full bg-gradient-to-r from-violet-glow to-cyan-glow px-6 py-3 font-semibold uppercase tracking-[0.2em] text-midnight-900 shadow-[0_10px_40px_-10px_rgba(124,92,255,0.7)] transition disabled:opacity-60"
                >
                  {computing() ? "Calculating…" : "Reveal Destiny"}
                </Motion.button>
              </div>
            </Motion.form>
          </Show>
        </Presence>

        <Show when={shared() && computing()}>
          <div class="glass mt-10 w-full rounded-3xl p-8 text-center">
            <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-glow/30 border-t-cyan-glow" />
            <p class="mt-4 text-xs uppercase tracking-[0.3em] text-violet-200/70">
              Loading destiny…
            </p>
          </div>
        </Show>

        <Show when={data()} keyed>
          {(d) => (
            <LoveAnimation
              data={d}
              name1Raw={name1()}
              name2Raw={name2()}
              onReplay={onReplay}
              skipAnimation={skip()}
              shared={shared()}
              incomingMessage={incomingMessage()}
            />
          )}
        </Show>

        <Show when={!data() && !shared()}>
          <p class="mt-10 text-xs tracking-[0.35em] text-violet-200/50">
            Built with SolidJS · Three.js
          </p>
        </Show>
      </main>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onInput: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label class="block">
      <span class="mb-1 block text-[10px] uppercase tracking-[0.3em] text-violet-200/70">
        {props.label}
      </span>
      <input
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        class="w-full rounded-2xl border border-violet-400/30 bg-midnight-800 px-4 py-3 text-lg font-semibold tracking-wider text-cyan-glow outline-none transition focus:border-cyan-glow focus:ring-2 focus:ring-cyan-glow/30"
      />
    </label>
  );
}
