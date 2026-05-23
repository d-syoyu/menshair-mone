import { SessionProvider } from "@/components/providers/session-provider";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
