import type { ThemeConfig } from "@/config/types";
import type { MenuPatch } from "@/menu/types";
import menu from "./menu.json";
import { tokens as mobile } from "./mobile/tokens";
import { tokens as tablet } from "./tablet/tokens";

export const theme: ThemeConfig = {
  id: "default",
  label: "Default",
  chip: "Pulse",
  description: "The original Pulse look.",
  menu: menu as MenuPatch,
  mobile: { tokens: mobile },
  tablet: { tokens: tablet },
};
