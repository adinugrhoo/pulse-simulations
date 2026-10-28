import type { PhaseScreens } from "@/config/types";
import { MOBILE_REGISTRY } from "@/screens/mobile/registry";
import { TABLET_REGISTRY } from "@/screens/tablet/registry";
import { TablesScreenV2 } from "@/screens/tablet/tables/TablesScreenV2";
import { screens as darkMobile } from "./themes/dark/mobile/screens";
import { screens as darkTablet } from "./themes/dark/tablet/screens";
import { screens as foodpandaMobile } from "./themes/foodpanda/mobile/screens";
import { screens as foodpandaTablet } from "./themes/foodpanda/tablet/screens";
import { screens as lightMobile } from "./themes/light/mobile/screens";
import { screens as lightTablet } from "./themes/light/tablet/screens";

export const screens: PhaseScreens = {
  mobile: MOBILE_REGISTRY,
  // the sectioned table management floor (Figma 2861:12353)
  tablet: { ...TABLET_REGISTRY, tables: TablesScreenV2 },
  themes: {
    dark: { mobile: darkMobile, tablet: darkTablet },
    light: { mobile: lightMobile, tablet: lightTablet },
    foodpanda: { mobile: foodpandaMobile, tablet: foodpandaTablet },
  },
};
