// src/app/(admin)/admin/layout.tsx
// Admin Layout - White Theme Wrapper

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-page">
      {children}
    </div>
  );
}
