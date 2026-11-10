import type { Metadata } from "next";
import { DesignSystem } from "@/design-system/DesignSystem";

export const metadata: Metadata = {
  title: "Design System · Pulse Simulations",
};

export default function DesignSystemPage() {
  return <DesignSystem />;
}
