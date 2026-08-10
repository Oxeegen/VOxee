import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Mic,
  Sparkles,
  Bot,
  Languages,
  Users,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { useAgentName } from "@/utils/agentName";
import RegionFlag from "@brand/components/ui/RegionFlag";

const CARD_MS = 9000;

/** Reveals `text` character by character; restarts whenever `active` becomes true. */
function useTypewriter(text: string, active: boolean, speed = 45) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) return;
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return out;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

/* ── Per-feature mini demos (mount fresh when their card shows) ─────────────── */

function DictationDemo({ active }: { active: boolean }) {
  const typed = useTypewriter("The quarterly report is ready for review.", active, 40);
  return (
    <Frame>
      <div className="flex items-center gap-3">
        <span className="vtour-pulse inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
          Ctrl + Win
        </span>
        <Mic className="w-4 h-4 text-primary vtour-pulse" />
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        <div className="flex-1 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-foreground min-h-[2rem]">
          {typed}
          <span className="vtour-caret">|</span>
        </div>
      </div>
    </Frame>
  );
}

function CleanupDemo({ active }: { active: boolean }) {
  return (
    <Frame>
      <div className="space-y-2" key={active ? "on" : "off"}>
        <div className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
          <span className="line-through opacity-60">
            um so like the the report is uh ready for review i think
          </span>
        </div>
        <div className="flex justify-center">
          <Sparkles className="w-4 h-4 text-primary vtour-pulse" />
        </div>
        <div className="vtour-fade-in rounded-md bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-foreground">
          The report is ready for review.
        </div>
      </div>
    </Frame>
  );
}

function AgentDemo({ active, agentName }: { active: boolean; agentName: string }) {
  const typed = useTypewriter(`Hey ${agentName}, turn this into 3 bullet points`, active, 35);
  return (
    <Frame>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary vtour-pulse" />
          <div className="flex-1 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-foreground min-h-[2rem]">
            {typed}
            <span className="vtour-caret">|</span>
          </div>
        </div>
        <div className="vtour-fade-in-delayed space-y-1 pl-6 text-xs text-muted-foreground">
          <div>• Report reviewed</div>
          <div>• Ready to ship</div>
          <div>• Needs sign-off</div>
        </div>
      </div>
    </Frame>
  );
}

function TranslationDemo({ active }: { active: boolean }) {
  return (
    <Frame>
      <div className="flex items-center justify-center gap-4" key={active ? "on" : "off"}>
        <div className="text-center">
          <RegionFlag region="eu" className="w-6 h-4 mx-auto mb-1" />
          <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">Bonjour, ça va&nbsp;?</div>
        </div>
        <ChevronRight className="w-5 h-5 text-primary vtour-slide-x" />
        <div className="text-center">
          <RegionFlag region="us" className="w-6 h-4 mx-auto mb-1" />
          <div className="vtour-fade-in rounded-md bg-primary/5 px-2.5 py-1.5 text-xs font-medium">
            Hi, how are you?
          </div>
        </div>
      </div>
    </Frame>
  );
}

function MeetingDemo({ active }: { active: boolean }) {
  const lines = [
    { who: "You", text: "Let's ship on Friday.", tone: "bg-primary/10 text-primary" },
    { who: "Speaker 1", text: "Sounds good to me.", tone: "bg-muted/60 text-foreground" },
    { who: "Speaker 2", text: "I'll prep the release notes.", tone: "bg-muted/60 text-foreground" },
  ];
  return (
    <Frame>
      <div className="space-y-1.5" key={active ? "on" : "off"}>
        {lines.map((l, i) => (
          <div
            key={i}
            className="vtour-fade-in-up flex items-center gap-2"
            style={{ animationDelay: `${i * 500}ms` }}
          >
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${l.tone}`}>
              {l.who}
            </span>
            <span className="text-xs text-foreground">{l.text}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function ReadyDemo() {
  return (
    <Frame>
      <div className="flex flex-col items-center justify-center gap-2 py-2">
        <div className="vtour-pop rounded-full bg-primary/10 p-3">
          <Rocket className="w-6 h-6 text-primary" />
        </div>
      </div>
    </Frame>
  );
}

/** Final onboarding step — a short auto-playing tour of the key features. */
export default function TutorialStep() {
  const { t } = useTranslation();
  const { agentName } = useAgentName();

  const cards = useMemo(
    () => [
      {
        id: "dictation",
        icon: Mic,
        title: t("brand.onboarding.tour.dictation.title", { defaultValue: "Dictate anywhere" }),
        desc: t("brand.onboarding.tour.dictation.desc", {
          defaultValue: "Press your hotkey, speak, and the text lands at your cursor in any app.",
        }),
        demo: (active: boolean) => <DictationDemo active={active} />,
      },
      {
        id: "cleanup",
        icon: Sparkles,
        title: t("brand.onboarding.tour.cleanup.title", { defaultValue: "Automatic cleanup" }),
        desc: t("brand.onboarding.tour.cleanup.desc", {
          defaultValue: "Filler words and messy formatting are cleaned up on the fly.",
        }),
        demo: (active: boolean) => <CleanupDemo active={active} />,
      },
      {
        id: "agent",
        icon: Bot,
        title: t("brand.onboarding.tour.agent.title", { defaultValue: "Talk to your agent" }),
        desc: t("brand.onboarding.tour.agent.desc", {
          defaultValue: "Address your agent by name and ask it to rewrite, summarize or reformat.",
        }),
        demo: (active: boolean) => <AgentDemo active={active} agentName={agentName} />,
      },
      {
        id: "translation",
        icon: Languages,
        title: t("brand.onboarding.tour.translation.title", { defaultValue: "Speak, paste translated" }),
        desc: t("brand.onboarding.tour.translation.desc", {
          defaultValue: "Dictate in one language and paste the translation in another.",
        }),
        demo: (active: boolean) => <TranslationDemo active={active} />,
      },
      {
        id: "meeting",
        icon: Users,
        title: t("brand.onboarding.tour.meeting.title", { defaultValue: "Meeting notes, live" }),
        desc: t("brand.onboarding.tour.meeting.desc", {
          defaultValue: "Detected calls are transcribed with speaker labels — straight into a note.",
        }),
        demo: (active: boolean) => <MeetingDemo active={active} />,
      },
      {
        id: "ready",
        icon: Rocket,
        title: t("brand.onboarding.tour.ready.title", { defaultValue: "You're all set" }),
        desc: t("brand.onboarding.tour.ready.desc", {
          defaultValue: "Everything is configurable later in Settings. Press Finish to start using VOxee.",
        }),
        demo: () => <ReadyDemo />,
      },
    ],
    [t, agentName]
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % cards.length), CARD_MS);
    return () => clearTimeout(id);
  }, [index, paused, cards.length]);

  const card = cards[index];
  const Icon = card.icon;

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => {
        hoverRef.current = true;
        setPaused(true);
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
        setPaused(false);
      }}
    >
      <style>{`
        @keyframes vtourFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes vtourFadeInUp { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes vtourSlideX { 0%,100% { transform: translateX(0) } 50% { transform: translateX(4px) } }
        @keyframes vtourPop { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.1) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes vtourCaret { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes vtourFill { from { width: 0% } to { width: 100% } }
        .vtour-fade-in { animation: vtourFadeIn .5s ease .6s both }
        .vtour-fade-in-delayed { animation: vtourFadeIn .5s ease 1.4s both }
        .vtour-fade-in-up { animation: vtourFadeInUp .45s ease both }
        .vtour-slide-x { animation: vtourSlideX 1.2s ease-in-out infinite }
        .vtour-pulse { animation: vtourFadeIn 1.4s ease-in-out infinite alternate }
        .vtour-pop { animation: vtourPop .5s ease both }
        .vtour-caret { animation: vtourCaret 1s step-end infinite }
        .vtour-fill { animation: vtourFill ${CARD_MS}ms linear both }
      `}</style>

      {/* Segmented progress */}
      <div className="flex items-center gap-1.5">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setIndex(i)}
            className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
            aria-label={c.title}
          >
            <span
              className={`block h-full rounded-full bg-primary ${
                i < index ? "w-full" : i === index && !paused ? "vtour-fill" : i === index ? "w-full" : "w-0"
              }`}
              // A fresh key restarts the fill animation on each card change.
              key={`${i}-${index}-${paused}`}
            />
          </button>
        ))}
      </div>

      {/* Demo area — remounts per card so animations replay. */}
      <div key={card.id}>{card.demo(true)}</div>

      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{card.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">{card.desc}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIndex((i) => (i - 1 + cards.length) % cards.length)}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPaused((p) => !p)}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          aria-label={paused ? "Play" : "Pause"}
        >
          {paused && !hoverRef.current ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % cards.length)}
          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
