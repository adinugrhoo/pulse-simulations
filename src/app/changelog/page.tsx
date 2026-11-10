import type { Metadata } from "next";
import { Changelog } from "@/changelog/Changelog";

export const metadata: Metadata = {
  title: "Changelog · Pulse Simulations",
};

export default function ChangelogPage() {
  return <Changelog />;
}
