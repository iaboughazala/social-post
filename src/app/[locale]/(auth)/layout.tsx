import { AuthProvider } from "@/components/providers/session-provider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </AuthProvider>
  );
}
