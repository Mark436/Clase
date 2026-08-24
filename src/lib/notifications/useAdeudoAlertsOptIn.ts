import { useCallback, useEffect, useState } from "react";
import {
  getSetting,
  setSetting,
  SETTING_ADEUDO_ALERTS_OPT_IN,
} from "@/lib/storage/settingsStore";
import { requestNotificationPermission } from "./adeudos";

export type AdeudoAlertsOptInState =
  | "loading"
  | "unset"
  | "enabled"
  | "declined";

interface AdeudoAlertsOptIn {
  state: AdeudoAlertsOptInState;
  enable: () => void;
  decline: () => void;
}

export function useAdeudoAlertsOptIn(): AdeudoAlertsOptIn {
  const [state, setState] = useState<AdeudoAlertsOptInState>("loading");

  useEffect(() => {
    let cancelled = false;

    void getSetting(SETTING_ADEUDO_ALERTS_OPT_IN)
      .then((value) => {
        if (cancelled) return;
        setState(
          value === null ? "unset" : value === "true" ? "enabled" : "declined",
        );
      })
      .catch(() => {
        if (!cancelled) setState("unset");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(() => {
    setState("enabled");
    void requestNotificationPermission().catch(() => undefined);
    void setSetting(SETTING_ADEUDO_ALERTS_OPT_IN, "true").catch(
      () => undefined,
    );
  }, []);

  const decline = useCallback(() => {
    setState("declined");
    void setSetting(SETTING_ADEUDO_ALERTS_OPT_IN, "false").catch(
      () => undefined,
    );
  }, []);

  return { state, enable, decline };
}
