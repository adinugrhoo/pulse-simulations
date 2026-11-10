import type { Metadata } from "next";
import { MenuStudioPage } from "@/stage/studio/MenuStudio";

export const metadata: Metadata = {
  title: "Menu Studio · Pulse Simulations",
};

export default function MenuStudioRoute() {
  return <MenuStudioPage />;
}
