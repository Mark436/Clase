import type { ReactNode } from "react";

interface AppShellProps {
  navigation?: ReactNode;
  children: ReactNode;
}

export function AppShell({ navigation, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <main className="flex-1">{children}</main>
        {navigation ? (
          <div className="sticky bottom-0 z-10">{navigation}</div>
        ) : null}
      </div>
    </div>
  );
}
