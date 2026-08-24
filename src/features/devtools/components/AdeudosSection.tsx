import type { DevToolsController } from "../useDevConfig";

type AdeudoOption = { label: string; value: boolean | null };

const OPTIONS: ReadonlyArray<AdeudoOption> = [
  { label: "Real", value: null },
  { label: "Con adeudo", value: true },
  { label: "Sin adeudo", value: false },
];

export function AdeudosSection({ dev }: { dev: DevToolsController }) {
  const current = dev.config.adeudoOverride;

  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-on-surface">Adeudos</h4>
      <div
        role="group"
        aria-label="Simular adeudos"
        className="flex gap-2"
      >
        {OPTIONS.map((option) => {
          const selected = current === option.value;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                dev.updateConfig((previous) => ({
                  ...previous,
                  adeudoOverride: option.value,
                }))
              }
              className={`h-9 flex-1 rounded-xl text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                selected
                  ? "bg-primary text-on-primary"
                  : "bg-primary-container/60 text-on-primary-container hover:bg-primary-container"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-on-surface-variant">
        Solo cambia lo que se muestra en la app; los datos guardados no se tocan.
      </p>
    </section>
  );
}
