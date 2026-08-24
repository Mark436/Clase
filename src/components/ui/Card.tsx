import type { HTMLAttributes } from "react";

export function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-outline-variant ${
        className ?? ""
      }`}
      {...rest}
    />
  );
}
