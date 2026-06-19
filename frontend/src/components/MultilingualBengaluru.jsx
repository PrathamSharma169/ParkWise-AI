import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Animated "Bengaluru" rendered in the major languages spoken across the city.
 * Each language cross-fades into the next on a ~2.2s loop.
 */
const SCRIPTS = [
  { label: "Kannada",     text: "ಬೆಂಗಳೂರು",  fontFamily: "var(--font-kannada)",    dir: "ltr" },
  { label: "English",     text: "Bengaluru",  fontFamily: "var(--font-display)",     dir: "ltr" },
  { label: "Hindi",       text: "बेंगलुरु",   fontFamily: "var(--font-devanagari)",  dir: "ltr" },
  { label: "Tamil",       text: "பெங்களூரு",  fontFamily: "var(--font-tamil)",       dir: "ltr" },
  { label: "Telugu",      text: "బెంగళూరు",  fontFamily: "var(--font-telugu)",      dir: "ltr" },
  { label: "Urdu",        text: "بنگلور",     fontFamily: "var(--font-arabic)",      dir: "rtl" },
  { label: "Malayalam",   text: "ബെംഗളൂരു",  fontFamily: "var(--font-malayalam)",   dir: "ltr" },
];

export default function MultilingualBengaluru({ onIndexChange }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => {
        const next = (i + 1) % SCRIPTS.length;
        onIndexChange && onIndexChange(SCRIPTS[next]);
        return next;
      });
    }, 2200);
    onIndexChange && onIndexChange(SCRIPTS[0]);
    return () => clearInterval(id);
  }, [onIndexChange]);

  const active = SCRIPTS[idx];

  return (
    <div
      style={{
        position: "relative",
        height: "1.05em",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        minWidth: "0.5em",
      }}
      aria-label={`Bengaluru in ${active.label}`}
      data-testid="multilingual-bengaluru"
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={active.label}
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
          exit={{    opacity: 0, y: -30, filter: "blur(8px)" }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.1, 1] }}
          dir={active.dir}
          style={{
            fontFamily: active.fontFamily,
            fontWeight: 800,
            display: "inline-block",
            whiteSpace: "nowrap",
          }}
        >
          {active.text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export { SCRIPTS };
