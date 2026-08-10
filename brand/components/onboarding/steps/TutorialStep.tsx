import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Sparkles, Bot, Languages, Users, FileText, Rocket, ChevronLeft, ChevronRight, Pause, Play, ArrowRight, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentName } from "@/utils/agentName";
import { useSettingsStore } from "@/stores/settingsStore";
import { getBaseLanguageCode } from "@/utils/languageSupport";
import { formatHotkeyListLabel, getDefaultHotkey } from "@/utils/hotkeys";
import languageRegistry from "@/config/languageRegistry.json";

const CARD_MS = 9000;

const LANG: Record<string, { code: string; label: string; flag: string }> = Object.fromEntries(
  (languageRegistry as { languages: Array<{ code: string; label: string; flag: string }> }).languages.map(
    (l) => [l.code, l]
  )
);

const HELLO: Record<string, string> = {
  fr: "Salut, comment ça va ?", es: "Hola, ¿cómo estás?", de: "Hallo, wie geht's?",
  pt: "Olá, como estás?", it: "Ciao, come stai?", ru: "Привет, как дела?",
  ja: "こんにちは、お元気ですか？", zh: "你好，最近怎么样？", ko: "안녕하세요, 잘 지내세요?",
  nl: "Hoi, hoe gaat het?", pl: "Cześć, jak się masz?", tr: "Selam, nasılsın?",
  ar: "مرحبًا، كيف حالك؟", hi: "नमस्ते, कैसे हैं आप?",
};

function useTypewriter(text: string, start: boolean, speed = 40) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) { setOut(""); return; }
    let i = 0;
    const id = setInterval(() => { i += 1; setOut(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [text, start, speed]);
  return out;
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[13rem] w-full items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-b from-card to-surface-2/40 p-6 shadow-sm">
      {children}
    </div>
  );
}

function TextZone({ children, muted, className = "" }: { children: React.ReactNode; muted?: boolean; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/70 bg-surface-1/80 px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${muted ? "text-muted-foreground" : "text-foreground"} ${className}`}>
      {children}
    </div>
  );
}

/** Emoji flags don't render on Windows — show the country/lang letters instead. */
function LangBadge({ flag, code }: { flag: string; code?: string }) {
  const cps = Array.from(flag).map((c) => c.codePointAt(0) || 0);
  const isCountry = cps.length === 2 && cps.every((cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff);
  const letters = isCountry
    ? cps.map((cp) => String.fromCharCode(cp - 0x1f1e6 + 65)).join("")
    : (code || "").toUpperCase().slice(0, 2);
  if (!letters) return <span className="text-base leading-none">{flag}</span>;
  return (
    <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary">
      {letters}
    </span>
  );
}

/** A small keyboard-shortcut chip. */
function HotkeyChip({ hotkey }: { hotkey: string }) {
  if (!hotkey) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-surface-1 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm">
      <Keyboard className="w-3 h-3 text-muted-foreground" />
      {formatHotkeyListLabel(hotkey)}
    </span>
  );
}

/** Shown when a feature wasn't enabled in the earlier onboarding step. */
function NotEnabled({ label, onEnable }: { label: string; onEnable: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">
        {t("brand.onboarding.tour.notEnabled", { defaultValue: "{{feature}} isn't enabled yet.", feature: label })}
      </p>
      <Button size="sm" onClick={onEnable}>
        {t("brand.onboarding.tour.enable", { defaultValue: "Enable" })}
      </Button>
    </div>
  );
}

/* ── Mic button (mirrors src/App.jsx states) ───────────────────────────────── */

function SoundWaveIcon({ size = 18 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <div className="bg-white rounded-full" style={{ width: size * 0.22, height: size * 0.55 }} />
      <div className="bg-white rounded-full" style={{ width: size * 0.22, height: size }} />
      <div className="bg-white rounded-full" style={{ width: size * 0.22, height: size * 0.55 }} />
    </div>
  );
}
function VoiceWave({ listening }: { listening: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`w-0.5 bg-white rounded-full transition-[height] duration-150 ${listening ? "animate-pulse h-4" : "h-2"}`} style={{ animationDelay: `${i * 0.1}s`, animationDuration: `${0.6 + i * 0.1}s` }} />
      ))}
    </div>
  );
}

type Phase = "idle" | "recording" | "transcribing" | "done";
const PHASE_SEQ: Phase[] = ["idle", "recording", "transcribing", "done"];
const PHASE_MS: Record<Phase, number> = { idle: 1300, recording: 2800, transcribing: 1700, done: 3200 };

function DictationDemo() {
  const { t } = useTranslation();
  const dictationKey = useSettingsStore((s) => s.dictationKey);
  const hotkey = dictationKey || getDefaultHotkey();
  const [phase, setPhase] = useState<Phase>("idle");
  useEffect(() => {
    const idx = PHASE_SEQ.indexOf(phase);
    const id = setTimeout(() => setPhase(PHASE_SEQ[(idx + 1) % PHASE_SEQ.length]), PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [phase]);
  const typed = useTypewriter("The quarterly report is ready for review.", phase === "done", 32);

  const active = phase === "recording" || phase === "transcribing";
  const btn = phase === "recording" ? "bg-primary" : phase === "transcribing" ? "bg-accent" : "bg-black/60";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Two ways to trigger: click the button OR press the hotkey */}
      <div className="flex items-center gap-3">
        <div className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/70 shadow-md transition-colors duration-300 ${btn} ${phase === "recording" ? "ring-4 ring-primary/25" : ""}`}>
          {phase === "recording" ? <VoiceWave listening /> : phase === "transcribing" ? <VoiceWave listening={false} /> : <SoundWaveIcon />}
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {t("brand.onboarding.tour.dictation.or", { defaultValue: "or" })}
        </span>
        <HotkeyChip hotkey={hotkey} />
      </div>

      <div className="text-[11px] font-medium text-muted-foreground">
        {phase === "recording"
          ? t("app.mic.recording", { defaultValue: "Recording…" })
          : phase === "transcribing"
            ? t("app.mic.processing", { defaultValue: "Transcribing…" })
            : phase === "done"
              ? t("brand.onboarding.tour.dictation.pasted", { defaultValue: "Pasted at your cursor" })
              : t("brand.onboarding.tour.dictation.trigger", { defaultValue: "Click the button or press the hotkey" })}
      </div>

      <TextZone muted={phase !== "done"} className="w-full min-h-[3rem]">
        {phase === "done" ? (
          <>{typed}<span className="vtour-caret">|</span></>
        ) : active ? (
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" />{t("app.mic.recording", { defaultValue: "Recording…" })}</span>
        ) : (
          <span className="opacity-50">{t("brand.onboarding.tour.dictation.placeholder", { defaultValue: "Your words appear here…" })}</span>
        )}
      </TextZone>
    </div>
  );
}

function CleanupDemo() {
  const { t } = useTranslation();
  return (
    <div className="w-full space-y-2.5">
      <TextZone muted><span className="line-through opacity-60">um so like the the report is uh ready for review i think</span></TextZone>
      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary">
        <Sparkles className="w-3.5 h-3.5 vtour-pulse" />
        {t("brand.onboarding.tour.cleanup.badge", { defaultValue: "AI cleanup" })}
      </div>
      <div className="vtour-fade-in">
        <TextZone className="border-primary/30 bg-primary/5 font-medium">The report is ready for review.</TextZone>
      </div>
    </div>
  );
}

function AgentDemo({ agentName }: { agentName: string }) {
  const { t } = useTranslation();
  const voiceAgentKey = useSettingsStore((s) => s.voiceAgentKey);
  const typed = useTypewriter(`Hey ${agentName}, turn this into 3 bullet points`, true, 30);
  return (
    <div className="w-full space-y-2.5">
      {voiceAgentKey && (
        <div className="flex justify-center">
          <span className="text-[11px] text-muted-foreground mr-2 self-center">
            {t("brand.onboarding.tour.agent.hotkeyHint", { defaultValue: "Voice agent hotkey" })}
          </span>
          <HotkeyChip hotkey={voiceAgentKey} />
        </div>
      )}
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10"><Bot className="w-4 h-4 text-primary" /></div>
        <TextZone className="flex-1 min-h-[2.5rem]">{typed}<span className="vtour-caret">|</span></TextZone>
      </div>
      <div className="vtour-fade-in-delayed ml-9">
        <TextZone className="border-primary/30 bg-primary/5 space-y-1"><div>• Report reviewed</div><div>• Ready to ship</div><div>• Needs sign-off</div></TextZone>
      </div>
    </div>
  );
}

function TranslationDemo() {
  const { t } = useTranslation();
  const preferredLanguage = useSettingsStore((s) => s.preferredLanguage);
  const translationKey = useSettingsStore((s) => s.translationKey);
  const base = getBaseLanguageCode(preferredLanguage) || "";
  const target = !base || base === "en" || base === "auto" ? "fr" : base;
  const targetInfo = LANG[target] || LANG.fr;
  const translated = HELLO[target] || HELLO.fr;
  const source = LANG.en || { flag: "🇬🇧", label: "English", code: "en" };

  return (
    <div className="w-full space-y-3">
      {translationKey && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-[11px] text-muted-foreground">{t("brand.onboarding.tour.translation.hotkeyHint", { defaultValue: "Translation hotkey" })}</span>
          <HotkeyChip hotkey={translationKey} />
        </div>
      )}
      <div className="flex items-stretch justify-center gap-3">
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><LangBadge flag={source.flag} code="en" /> {source.label}</div>
          <TextZone className="w-full text-center">Hi, how are you?</TextZone>
        </div>
        <div className="flex items-center pt-6"><ArrowRight className="w-5 h-5 text-primary vtour-slide-x" /></div>
        <div className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><LangBadge flag={targetInfo.flag} code={target} /> {targetInfo.label}</div>
          <div className="vtour-fade-in w-full"><TextZone className="w-full border-primary/30 bg-primary/5 text-center font-medium">{translated}</TextZone></div>
        </div>
      </div>
    </div>
  );
}

const MEETING_LINES = [
  { who: "You", text: "Let's ship on Friday.", tone: "bg-primary/10 text-primary" },
  { who: "Speaker 1", text: "Sounds good to me.", tone: "bg-muted text-foreground" },
  { who: "Speaker 2", text: "I'll prep the release notes.", tone: "bg-muted text-foreground" },
];

function MeetingDemo() {
  return (
    <div className="w-full space-y-2">
      {MEETING_LINES.map((l, i) => (
        <div key={i} className="vtour-fade-in-up flex items-center gap-2" style={{ animationDelay: `${i * 550}ms` }}>
          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${l.tone}`}>{l.who}</span>
          <TextZone className="flex-1 py-1.5">{l.text}</TextZone>
        </div>
      ))}
    </div>
  );
}

function NotesDemo() {
  const { t } = useTranslation();
  const actions = [
    { label: t("brand.onboarding.tour.notes.summarize", { defaultValue: "Summarize" }), active: true },
    { label: t("brand.onboarding.tour.notes.actionItems", { defaultValue: "Action items" }) },
    { label: t("brand.onboarding.tour.notes.translate", { defaultValue: "Translate" }) },
  ];
  return (
    <div className="w-full space-y-3">
      {/* The meeting note (reused transcript) */}
      <div className="rounded-xl border border-border/70 bg-surface-1/80 p-2.5 shadow-sm space-y-1">
        {MEETING_LINES.map((l, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${l.tone}`}>{l.who}</span>
            <span className="text-muted-foreground">{l.text}</span>
          </div>
        ))}
      </div>
      {/* Note actions */}
      <div className="flex items-center justify-center gap-1.5">
        {actions.map((a) => (
          <span key={a.label} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${a.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{a.label}</span>
        ))}
      </div>
      {/* Summarized result */}
      <div className="vtour-fade-in-delayed">
        <TextZone className="border-primary/30 bg-primary/5">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-primary"><FileText className="w-3.5 h-3.5" />{t("brand.onboarding.tour.notes.summary", { defaultValue: "Summary" })}</div>
          <ul className="space-y-0.5 text-xs">
            <li>• {t("brand.onboarding.tour.notes.s1", { defaultValue: "Ship on Friday — agreed by the team." })}</li>
            <li>• {t("brand.onboarding.tour.notes.s2", { defaultValue: "Speaker 2 owns the release notes." })}</li>
          </ul>
        </TextZone>
      </div>
    </div>
  );
}

function ReadyDemo() {
  return (
    <div className="vtour-pop flex flex-col items-center justify-center gap-3">
      <div className="rounded-full bg-primary/10 p-5"><Rocket className="w-9 h-9 text-primary" /></div>
    </div>
  );
}

/* ── Feature cards with enablement gating ──────────────────────────────────── */

function CleanupCard() {
  const { t } = useTranslation();
  const enabled = useSettingsStore((s) => s.useCleanupModel);
  const setEnabled = useSettingsStore((s) => s.setUseCleanupModel);
  return enabled ? <CleanupDemo /> : <NotEnabled label={t("brand.onboarding.tour.cleanup.title", { defaultValue: "Cleanup" })} onEnable={() => setEnabled(true)} />;
}
function AgentCard({ agentName }: { agentName: string }) {
  const { t } = useTranslation();
  const enabled = useSettingsStore((s) => s.useDictationAgent);
  const setEnabled = useSettingsStore((s) => s.setUseDictationAgent);
  return enabled ? <AgentDemo agentName={agentName} /> : <NotEnabled label={t("brand.onboarding.tour.agent.title", { defaultValue: "Voice agent" })} onEnable={() => setEnabled(true)} />;
}
function TranslationCard() {
  const { t } = useTranslation();
  const enabled = useSettingsStore((s) => s.useDictationTranslation);
  const setEnabled = useSettingsStore((s) => s.setUseDictationTranslation);
  return enabled ? <TranslationDemo /> : <NotEnabled label={t("brand.onboarding.tour.translation.title", { defaultValue: "Translation" })} onEnable={() => setEnabled(true)} />;
}

/** Final onboarding step — a short auto-playing tour of the key features. */
export default function TutorialStep() {
  const { t } = useTranslation();
  const { agentName } = useAgentName();

  const cards = useMemo(
    () => [
      { id: "dictation", icon: Mic, title: t("brand.onboarding.tour.dictation.title", { defaultValue: "Dictate anywhere" }), desc: t("brand.onboarding.tour.dictation.desc", { defaultValue: "Click the floating button or press your hotkey, speak, and the text lands at your cursor." }), demo: () => <DictationDemo /> },
      { id: "cleanup", icon: Sparkles, title: t("brand.onboarding.tour.cleanup.title", { defaultValue: "Automatic cleanup" }), desc: t("brand.onboarding.tour.cleanup.desc", { defaultValue: "Filler words and messy formatting are cleaned up on the fly." }), demo: () => <CleanupCard /> },
      { id: "agent", icon: Bot, title: t("brand.onboarding.tour.agent.title", { defaultValue: "Talk to your agent" }), desc: t("brand.onboarding.tour.agent.desc", { defaultValue: "Address your agent by name and ask it to rewrite, summarize or reformat." }), demo: () => <AgentCard agentName={agentName} /> },
      { id: "translation", icon: Languages, title: t("brand.onboarding.tour.translation.title", { defaultValue: "Speak, paste translated" }), desc: t("brand.onboarding.tour.translation.desc", { defaultValue: "Dictate in one language and paste the translation in another." }), demo: () => <TranslationCard /> },
      { id: "meeting", icon: Users, title: t("brand.onboarding.tour.meeting.title", { defaultValue: "Meeting notes, live" }), desc: t("brand.onboarding.tour.meeting.desc", { defaultValue: "Detected calls are transcribed with speaker labels — straight into a note." }), demo: () => <MeetingDemo /> },
      { id: "notes", icon: FileText, title: t("brand.onboarding.tour.notes.title", { defaultValue: "Turn notes into action" }), desc: t("brand.onboarding.tour.notes.desc", { defaultValue: "Summarize, extract action items or translate any note in one click." }), demo: () => <NotesDemo /> },
      { id: "ready", icon: Rocket, title: t("brand.onboarding.tour.ready.title", { defaultValue: "You're all set" }), desc: t("brand.onboarding.tour.ready.desc", { defaultValue: "Everything is configurable later in Settings. Press Finish to start using VOxee." }), demo: () => <ReadyDemo /> },
    ],
    [t, agentName]
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % cards.length), CARD_MS);
    return () => clearTimeout(id);
  }, [index, paused, cards.length]);

  const card = cards[index];
  const Icon = card.icon;

  return (
    <div className="space-y-5" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
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

      <div className="flex items-center gap-1.5">
        {cards.map((c, i) => (
          <button key={c.id} onClick={() => setIndex(i)} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-label={c.title}>
            <span key={`${i}-${index}-${paused}`} className={`block h-full rounded-full bg-primary ${i < index ? "w-full" : i === index && !paused ? "vtour-fill" : i === index ? "w-full" : "w-0"}`} />
          </button>
        ))}
      </div>

      <div key={card.id}><Stage>{card.demo()}</Stage></div>

      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2"><Icon className="w-4 h-4 text-primary" /><h3 className="text-base font-semibold">{card.title}</h3></div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{card.desc}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setIndex((i) => (i - 1 + cards.length) % cards.length)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
        <button onClick={() => setPaused((p) => !p)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60" aria-label={paused ? "Play" : "Pause"}>{paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}</button>
        <button onClick={() => setIndex((i) => (i + 1) % cards.length)} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
