import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Animated "Bengaluru" rendered in the major languages spoken across the city.
 * Invisible sizers in a shared grid cell reserve max width/height so the
 * cross-fade never shifts surrounding layout.
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

export default function MultilingualBengaluru() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % SCRIPTS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const active = SCRIPTS[idx];

  return (
    <span
      className="multilingual-bengaluru-slot"
      aria-label={`Bengaluru in ${active.label}`}
      data-testid="multilingual-bengaluru"
    >
      {SCRIPTS.map((script) => (
        <span
          key={script.label}
          aria-hidden="true"
          className="multilingual-bengaluru-sizer"
          style={{ fontFamily: script.fontFamily }}
        >
          {script.text}
        </span>
      ))}

      <span className="multilingual-bengaluru-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={active.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            dir={active.dir}
            className="multilingual-bengaluru-word"
            style={{ fontFamily: active.fontFamily }}
          >
            {active.text}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
