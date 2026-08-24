import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import type { ApiErrorKind } from "@/lib/api/client";
import { useAuth } from "../auth-context";

const ERROR_MESSAGES: Record<ApiErrorKind, string> = {
  "invalid-credentials": "Usuario o contraseña incorrectos.",
  connection:
    "No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.",
  unknown: "Ocurrió un error inesperado. Inténtalo de nuevo.",
};

interface FieldErrors {
  user?: string;
  pass?: string;
}

interface CredentialsFormProps {
  submitLabel: string;
  initialUser?: string;
  autoFocusPassword?: boolean;
}

export function CredentialsForm({
  submitLabel,
  initialUser = "",
  autoFocusPassword = false,
}: CredentialsFormProps) {
  const { status, errorKind, login } = useAuth();
  const [user, setUser] = useState(initialUser);
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isLoading = status === "authenticating";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    const errors: FieldErrors = {};
    if (user.trim() === "") {
      errors.user = "Ingresa tu usuario.";
    }
    if (pass === "") {
      errors.pass = "Ingresa tu contraseña.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    void login(user.trim(), pass);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Usuario"
        type="text"
        autoComplete="username"
        enterKeyHint="next"
        value={user}
        onChange={(event) => setUser(event.target.value)}
        disabled={isLoading}
        error={fieldErrors.user}
      />
      <Input
        label="Contraseña"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        enterKeyHint="go"
        value={pass}
        onChange={(event) => setPass(event.target.value)}
        disabled={isLoading}
        autoFocus={autoFocusPassword}
        error={fieldErrors.pass}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-primary-container/50 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40"
          >
            {showPassword ? (
              <EyeOffIcon size={20} />
            ) : (
              <EyeIcon size={20} />
            )}
          </button>
        }
      />

      {errorKind ? (
        <p
          role="alert"
          className="rounded-xl bg-error-container px-3 py-2 text-sm text-on-error-container"
        >
          {ERROR_MESSAGES[errorKind]}
        </p>
      ) : null}

      <Button type="submit" loading={isLoading} className="mt-2 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
