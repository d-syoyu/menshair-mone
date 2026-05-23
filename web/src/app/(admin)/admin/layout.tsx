// src/app/(admin)/admin/layout.tsx
// Admin Layout - White Theme Wrapper

import { SessionProvider } from "@/components/providers/session-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="admin-page">
        {children}
      </div>
    </SessionProvider>
  );
}
