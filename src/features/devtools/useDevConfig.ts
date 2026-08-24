import { useCallback, useEffect, useState } from "react";
import { setClockOffsetMinutes } from "@/lib/devtools/clock";
import {
  getSetting,
  removeSetting,
  setSetting,
  SETTING_DEV_CONFIG,
  SETTING_DEV_UNLOCKED,
} from "@/lib/storage/settingsStore";
import type { DevConfig, DevMateria } from "./types";
import { EMPTY_DEV_CONFIG } from "./types";

export interface DevToolsController {
  config: DevConfig;
  unlocked: boolean;
  loaded: boolean;
  updateConfig: (updater: (previous: DevConfig) => DevConfig) => void;
  resetConfig: () => void;
  unlock: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMateria(value: unknown): DevMateria | null {
  if (!isRecord(value)) return null;
  if (typeof value.clave !== "string" || typeof value.nombre !== "string") {
    return null;
  }
  return {
    clave: value.clave,
    nombre: value.nombre,
    docente: typeof value.docente === "string" ? value.docente : "",
    salon: typeof value.salon === "string" ? value.salon : "",
    dias: Array.isArray(value.dias)
      ? value.dias.filter((day): day is number => typeof day === "number")
      : [],
    inicio: typeof value.inicio === "string" ? value.inicio : "",
    fin: typeof value.fin === "string" ? value.fin : "",
    calificacion:
      typeof value.calificacion === "string" ? value.calificacion : "",
  };
}

function parseDevConfig(raw: string | null): DevConfig {
  if (!raw) return EMPTY_DEV_CONFIG;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_DEV_CONFIG;

    const gradeOverrides: Record<string, string> = {};
    if (isRecord(parsed.gradeOverrides)) {
      for (const [clave, calificacion] of Object.entries(
        parsed.gradeOverrides,
      )) {
        if (typeof calificacion === "string") {
          gradeOverrides[clave] = calificacion;
        }
      }
    }

    return {
      clockOffsetMinutes:
        typeof parsed.clockOffsetMinutes === "number"
          ? parsed.clockOffsetMinutes
          : null,
      extraMaterias: Array.isArray(parsed.extraMaterias)
        ? parsed.extraMaterias
            .map(parseMateria)
            .filter((materia): materia is DevMateria => materia !== null)
        : [],
      removedClaves: Array.isArray(parsed.removedClaves)
        ? parsed.removedClaves.filter(
            (clave): clave is string => typeof clave === "string",
          )
        : [],
      gradeOverrides,
      adeudoOverride:
        typeof parsed.adeudoOverride === "boolean"
          ? parsed.adeudoOverride
          : null,
    };
  } catch {
    return EMPTY_DEV_CONFIG;
  }
}

async function saveDevConfig(config: DevConfig): Promise<void> {
  await setSetting(SETTING_DEV_CONFIG, JSON.stringify(config));
}

export function useDevConfig(): DevToolsController {
  const [config, setConfig] = useState<DevConfig>(EMPTY_DEV_CONFIG);
  const [unlocked, setUnlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let raw: string | null = null;
      let unlockedRaw: string | null = null;

      try {
        raw = await getSetting(SETTING_DEV_CONFIG);
      } catch {
        raw = null;
      }
      try {
        unlockedRaw = await getSetting(SETTING_DEV_UNLOCKED);
      } catch {
        unlockedRaw = null;
      }

      if (cancelled) return;

      const parsed = parseDevConfig(raw);
      setConfig(parsed);
      setClockOffsetMinutes(parsed.clockOffsetMinutes);
      setUnlocked(unlockedRaw === "true");
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist and apply the clock offset on every post-load config change.
  useEffect(() => {
    if (!loaded) return;
    void saveDevConfig(config).catch((error: unknown) => {
      console.warn("No se pudo guardar la configuración de desarrollo.", error);
    });
    setClockOffsetMinutes(config.clockOffsetMinutes);
  }, [config, loaded]);

  const updateConfig = useCallback(
    (updater: (previous: DevConfig) => DevConfig) => {
      setConfig(updater);
    },
    [],
  );

  const resetConfig = useCallback(() => {
    setConfig(EMPTY_DEV_CONFIG);
    void removeSetting(SETTING_DEV_CONFIG).catch((error: unknown) => {
      console.warn("No se pudo borrar la configuración de desarrollo.", error);
    });
  }, []);

  const unlock = useCallback(() => {
    setUnlocked(true);
    void setSetting(SETTING_DEV_UNLOCKED, "true").catch(() => undefined);
  }, []);

  return { config, unlocked, loaded, updateConfig, resetConfig, unlock };
}
