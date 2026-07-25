"use client";

import { motion } from "motion/react";
import { Bloom } from "@/components/brand/Bloom";

export function BloomLoader({ size = 120 }: { size?: number }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.06, 1], rotate: [0, 8, 0] }}
      transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
    >
      <Bloom size={size} />
    </motion.div>
  );
}
