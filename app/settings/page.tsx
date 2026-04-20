import type { Metadata } from "next";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings | Rezoomind",
  description: "Manage your resume, preferences, email alerts, and appearance.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
