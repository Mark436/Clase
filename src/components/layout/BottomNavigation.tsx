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

export function BottomNavigation<T extends string>({
  items,
  activeId,
  onSelect,
}: BottomNavigationProps<T>) {
  return (
    <nav
      aria-label="Navegación principal"
      className="border-t border-outline-variant bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex w-full max-w-md">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                isActive ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <span
                className={`flex h-7 w-16 items-center justify-center rounded-full ${
                  isActive ? "bg-primary-container" : ""
                }`}
              >
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
