import { Suspense } from "react";
import { Watch } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const instant = false;

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pos-canvas p-4">
      <div className="mb-8 flex items-center gap-2 text-foreground">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Watch className="size-5" />
        </span>
        <span className="text-xl font-semibold tracking-tight">Watch POS</span>
      </div>
      <div className="w-full max-w-md">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
