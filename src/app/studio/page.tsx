import type { Metadata } from "next";
import StudioFlow from "@/components/studio/StudioFlow";

export const metadata: Metadata = {
  title: "Ensemble Studio - your look, one decision",
};

export default function StudioPage() {
  return <StudioFlow />;
}
