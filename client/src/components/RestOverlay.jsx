// client/src/components/RestOverlay.jsx
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REST_LS_KEY = 'rest.session.v1';
const REST_SETTINGS_KEY = 'rest.settings.v1';

const readSession = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(REST_LS_KEY) || 'null'); } catch { return null; }
};

const writeSession = (session) => {
  try {
    if (session) localStorage.setItem(REST_LS_KEY, JSON.stringify(session));
    else localStorage.removeItem(REST_LS_KEY);
  } catch {}
  try { window.dispatchEvent(new CustomEvent('rest-session-changed')); } catch {}
};

const readSettings = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(REST_SETTINGS_KEY) || 'null') || {};
    return {
      muted: Boolean(raw.muted),
      vibrate: Boolean(raw.vibrate),
      autoRepeat: Boolean(raw.autoRepeat),
      dim: typeof raw.dim === 'number' ? Math.max(0, Math.min(0.9, raw.dim)) : 0.7,
      defaultDuration: Math.max(1, Math.floor(Number(raw.defaultDuration || 5))),
    };
  } catch { return { muted: false, vibrate: false, autoRepeat: false, dim: 0.7, defaultDuration: 5 }; }
};

const readUiVolume = () => {
  try { return Math.max(0, Math.min(1, JSON.parse(localStorage.getItem('ui.sound.v1') || '{}')?.volume ?? 1)); } catch { return 1; }
};

const beepOnce = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    const vol = 0.12 * readUiVolume();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {}
};

const formatTime = (totalSec) => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function RestOverlay() {
  const [session, setSession] = useState(() => readSession());
  const [remaining, setRemaining] = useState(0);
  const [settings, setSettings] = useState(readSettings);

  // Keep session in sync across tabs/components
  useEffect(() => {
    const onChange = () => setSession(readSession());
    window.addEventListener('rest-session-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('rest-session-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  // React to rest settings changes
  useEffect(() => {
    const apply = () => setSettings(readSettings());
    window.addEventListener('rest-settings-changed', apply);
    window.addEventListener('storage', apply);
    return () => {
      window.removeEventListener('rest-settings-changed', apply);
      window.removeEventListener('storage', apply);
    };
  }, []);

  // Tick countdown
  useEffect(() => {
    if (!session?.endAt) { setRemaining(0); return; }
    let timer;
    const tick = () => {
      const now = Date.now();
      const diffMs = Math.max(0, session.endAt - now);
      const sec = Math.ceil(diffMs / 1000);
      setRemaining(sec);
      if (diffMs <= 0) {
        // End
        if (!settings.muted) beepOnce();
        try { if (settings.vibrate && navigator.vibrate) navigator.vibrate([120, 80, 120]); } catch {}

        // Auto repeat if enabled
        const repeatSec = Number(session?.durationSec) || (settings.defaultDuration * 60);
        writeSession(null);
        setSession(null);
        if (settings.autoRepeat && repeatSec > 0) {
          const now2 = Date.now();
          const next = { startedAt: now2, endAt: now2 + repeatSec * 1000, durationSec: repeatSec };
          writeSession(next);
          setSession(next);
        }
        return;
      }
      timer = setTimeout(tick, 250);
    };
    tick();
    return () => { if (timer) clearTimeout(timer); };
  }, [session?.endAt]);

  const active = useMemo(() => remaining > 0, [remaining]);

  const endRest = () => {
    writeSession(null);
    setSession(null);
  };
  const addMinutes = (mins) => {
    const now = Date.now();
    const base = Math.max(now, session?.endAt || now);
    const nextTotalSec = Math.ceil(((session?.durationSec ?? Math.ceil(((session?.endAt||now) - (session?.startedAt||now))/1000)) + mins * 60));
    const next = { startedAt: session?.startedAt || now, endAt: base + mins * 60 * 1000, durationSec: nextTotalSec };
    writeSession(next);
    setSession(next);
  };

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="rest-overlay"
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-label="Rest in progress"
        >
          <div className="absolute inset-0 backdrop-blur-2xl" style={{ backgroundColor: `rgba(2,6,23,${settings.dim ?? 0.7})` }} />
          <div className="relative z-[71] flex h-full w-full items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 text-center text-white shadow-2xl backdrop-blur-2xl"
            >
              <div className="text-sm font-semibold uppercase tracking-wider text-white/70">Time to Rest</div>
              <div className="mt-2 text-6xl font-extrabold tabular-nums">{formatTime(remaining)}</div>
              <div className="mt-2 text-sm text-white/70">Pause and relax. This timer stays visible here until your break ends.</div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => addMinutes(5)}
                  className="rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white"
                >
                  +5 min
                </button>
                <button
                  type="button"
                  onClick={() => addMinutes(10)}
                  className="rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-white"
                >
                  +10 min
                </button>
                <button
                  type="button"
                  onClick={endRest}
                  className="rounded-2xl border border-white/60 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                  End Rest
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// Utility to start or cancel rest from anywhere
export const startRest = (minutes) => {
  const now = Date.now();
  const session = { startedAt: now, endAt: now + minutes * 60 * 1000, durationSec: Math.max(60, Math.floor(minutes * 60)) };
  try { localStorage.setItem(REST_LS_KEY, JSON.stringify(session)); } catch {}
  try { window.dispatchEvent(new CustomEvent('rest-session-changed')); } catch {}
};
export const cancelRest = () => {
  try { localStorage.removeItem(REST_LS_KEY); } catch {}
  try { window.dispatchEvent(new CustomEvent('rest-session-changed')); } catch {}
};
