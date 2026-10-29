import { Suspense } from "react";
import { LoginBrand } from "@/components/auth/login-brand";
import { LoginForm } from "@/components/auth/login-form";

export const instant = false;

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-[#f4f5f8] lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
      <LoginBrand />
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign in…</p>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
