import type { HTMLAttributes } from "react";

export function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[20px] bg-surface p-4 elevated ring-1 ring-outline-variant ${
        className ?? ""
      }`}
      {...rest}
    />
  );
}
