import type { PhaseScreens } from "@/config/types";
import { MOBILE_REGISTRY } from "@/screens/mobile/registry";
import { TABLET_REGISTRY } from "@/screens/tablet/registry";
import { screens as defaultMobile } from "./themes/default/mobile/screens";
import { screens as defaultTablet } from "./themes/default/tablet/screens";

export const screens: PhaseScreens = {
  mobile: MOBILE_REGISTRY,
  tablet: TABLET_REGISTRY,
  themes: {
    default: { mobile: defaultMobile, tablet: defaultTablet },
  },
};
