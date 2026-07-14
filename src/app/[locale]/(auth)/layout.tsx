import Image from "next/image";
import { AuthProvider } from "@/components/providers/session-provider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Image
              src="/logo-mark.svg"
              alt="SocialPost"
              width={36}
              height={36}
              className="size-9 rounded-lg"
            />
            <span className="text-xl font-bold">SocialPost</span>
          </div>
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
