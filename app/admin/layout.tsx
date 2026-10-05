import type { Metadata } from "next";
import type { ReactNode } from "react";
import UnsavedChangesGuard from "./components/UnsavedChangesGuard";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <UnsavedChangesGuard>{children}</UnsavedChangesGuard>;
}
