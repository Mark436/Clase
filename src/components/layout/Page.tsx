import type { ReactNode } from "react";

interface PageProps {
  children: ReactNode;
  className?: string;
}

export function Page({ children, className }: PageProps) {
  return (
    <div className={`flex flex-1 flex-col gap-4 px-4 pb-6 pt-2 ${className ?? ""}`}>
      {children}
    </div>
  );
}
