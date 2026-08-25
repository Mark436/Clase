import type { ReactNode } from "react";

export interface BottomNavigationItem<T extends string = string> {
  id: T;
  label: string;
  icon: ReactNode;
}

interface BottomNavigationProps<T extends string> {
  items: ReadonlyArray<BottomNavigationItem<T>>;
  activeId: T;
  onSelect: (id: T) => void;
}

// Floating glass pill: the navigation reads as one object hovering over the
// content instead of a full-width bar bolted to the viewport edge.
export function BottomNavigation<T extends string>({
  items,
  activeId,
  onSelect,
}: BottomNavigationProps<T>) {
  return (
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none flex justify-center pb-[max(env(safe-area-inset-bottom),10px)]"
    >
      <div className="glass-panel elevated pointer-events-auto mx-4 flex w-full max-w-sm items-center gap-1 rounded-full p-1.5">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="flex h-6 items-center justify-center">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
