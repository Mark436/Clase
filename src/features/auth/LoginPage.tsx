import { Card } from "@/components/ui/Card";
import { useAuth } from "./auth-context";
import { CredentialsForm } from "./components/CredentialsForm";

export function LoginPage() {
  const { rememberedUsername } = useAuth();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <header className="mb-6 text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary text-xl font-bold text-on-primary elevated"
          >
            S
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-on-background">
            Studia
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Tu información académica en un solo lugar.
          </p>
        </header>

        <Card className="p-6">
          <CredentialsForm
            submitLabel="Iniciar sesión"
            initialUser={rememberedUsername ?? ""}
          />
        </Card>
      </div>
    </div>
  );
}
