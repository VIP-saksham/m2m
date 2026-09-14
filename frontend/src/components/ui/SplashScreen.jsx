import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Leaf } from 'lucide-react';

/**
 * Full-screen splash shown on every page load/reload.
 * Entrance flourishes use framer-motion; the curtain-lift EXIT is a plain
 * CSS transition (inline style + transitionend) so it can never be frozen
 * by re-renders/HMR remounts mid-exit.
 */

const letter = {
  hidden: { opacity: 0, y: 40 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.16, type: 'spring', stiffness: 260, damping: 18 },
  }),
};

const RINGS = [0, 1, 2, 3];
const LEAVES = [
  { left: '12%', delay: 1.0, size: 16, drift: -30 },
  { left: '24%', delay: 1.25, size: 12, drift: 24 },
  { left: '45%', delay: 1.1, size: 14, drift: -18 },
  { left: '63%', delay: 1.35, size: 11, drift: 30 },
  { left: '78%', delay: 1.05, size: 15, drift: -26 },
  { left: '90%', delay: 1.3, size: 12, drift: 20 },
];

const SplashScreen = ({ onComplete }) => {
  const reduceMotion = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const [fadeContent, setFadeContent] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (!doneRef.current) {
      doneRef.current = true;
      onComplete();
    }
  };

  useEffect(() => {
    const total = reduceMotion ? 500 : 2400;
    const t = setTimeout(() => setLeaving(true), total);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  // Fade the inner content quickly once the lift starts.
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setFadeContent(true), 60);
    return () => clearTimeout(t);
  }, [leaving]);

  return (
    <div
      data-testid="splash-screen"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-forest"
      style={{
        transform: leaving ? 'translateY(-100%)' : 'translateY(0)',
        transition: reduceMotion
          ? 'opacity 0.15s linear'
          : 'transform 0.6s cubic-bezier(0.76, 0, 0.24, 1)',
        opacity: reduceMotion && leaving ? 0 : 1,
      }}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'transform' || e.propertyName === 'opacity') finish();
      }}
    >
      {/* Safety net: if transitionend never fires (hidden tab, etc.), force-finish */}
      <TimeoutFire active={leaving} afterMs={900} onFire={finish} />

      <div
        className="flex w-full flex-col items-center"
        style={{
          opacity: fadeContent ? 0 : 1,
          transition: 'opacity 0.25s ease',
        }}
      >
        {/* Ambient glows */}
        <motion.div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-leaf-light/20 blur-3xl"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gold/20 blur-3xl"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
        />

        {/* Expanding rings */}
        {!reduceMotion &&
          RINGS.map((i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute rounded-full border border-white/15"
              style={{ width: 140, height: 140 }}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 0.7, 0], scale: [0.4, 2.6] }}
              transition={{
                duration: 2,
                delay: 0.25 + i * 0.4,
                ease: 'easeOut',
                repeat: i === RINGS.length - 1 ? Infinity : 0,
                repeatDelay: 0.2,
              }}
            />
          ))}

        {/* Floating leaves */}
        {!reduceMotion &&
          LEAVES.map((l, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute text-leaf-lighter/70"
              style={{ left: l.left, bottom: '-10%' }}
              initial={{ opacity: 0, y: 0, rotate: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: ['-5vh', '-105vh'], x: l.drift, rotate: 220 }}
              transition={{ duration: 2.1, delay: l.delay, ease: 'easeOut' }}
            />
          ))}

        {/* Wordmark */}
        <div className="relative flex items-center gap-1 sm:gap-2">
          <motion.span
            variants={letter}
            initial="hidden"
            animate="show"
            custom={0}
            className="text-7xl font-black text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.45)] sm:text-8xl"
          >
            M
          </motion.span>
          <motion.span
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 14 }}
            className="relative mx-1 flex h-16 w-16 items-center justify-center rounded-3xl bg-gold text-4xl font-black text-forest shadow-[0_10px_40px_rgba(201,168,76,0.55)] sm:mx-2 sm:h-20 sm:w-20 sm:text-5xl"
          >
            2
          </motion.span>
          <motion.span
            variants={letter}
            initial="hidden"
            animate="show"
            custom={1}
            className="text-7xl font-black text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.45)] sm:text-8xl"
          >
            M
          </motion.span>
        </div>

        {/* Gold underline sweep */}
        <motion.div
          className="mt-4 h-1 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'min(60vw, 320px)', opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.55, ease: 'easeOut' }}
        />

        {/* Taglines */}
        <motion.p
          initial={{ opacity: 0, y: 14, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0.28em' }}
          transition={{ delay: 0.95, duration: 0.6, ease: 'easeOut' }}
          className="mt-5 text-xs font-semibold uppercase text-white/85 sm:text-sm"
        >
          Mitti to Market
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.5 }}
          className="mt-2 text-sm text-leaf-lighter/90 sm:text-base"
        >
          मिट्टी से बाज़ार तक
        </motion.p>

        {/* Progress bar */}
        <div className="absolute bottom-16 h-1 w-40 overflow-hidden rounded-full bg-white/10 sm:w-52">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-leaf-lighter to-gold"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ delay: 0.4, duration: reduceMotion ? 0.3 : 1.8, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
};

/** Calls onFire once, afterMs after becoming active. */
const TimeoutFire = ({ active, afterMs, onFire }) => {
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(onFire, afterMs);
    return () => clearTimeout(t);
  }, [active, afterMs, onFire]);
  return null;
};

export default SplashScreen;
