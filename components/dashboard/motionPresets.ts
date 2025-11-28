import type { Variants } from "framer-motion";

export const fadeDelayed = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, delay } },
});

export const hoverScale = {
  whileHover: { scale: 1.015, transition: { duration: 0.12 } },
};
