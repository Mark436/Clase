import { useCallback, useEffect, useState } from "react";
import {
  getSetting,
  setSetting,
  SETTING_REMEMBER_USERNAME,
} from "@/lib/storage/settingsStore";

type RememberUsernameState = "loading" | "on" | "off";

/** Controls whether the app remembers the control number for future logins. */
export function useRememberUsername() {
  const [state, setState] = useState<RememberUsernameState>("loading");

  useEffect(() => {
    let cancelled = false;

    void getSetting(SETTING_REMEMBER_USERNAME)
      .then((value) => {
        if (cancelled) return;
        // Default is "off": the control number is not remembered unless the
        // user explicitly opts in.
        setState(value === "true" ? "on" : "off");
      })
      .catch(() => {
        if (!cancelled) setState("off");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback((checked: boolean) => {
    setState(checked ? "on" : "off");
    void setSetting(SETTING_REMEMBER_USERNAME, String(checked)).catch(
      () => undefined,
    );
  }, []);

  return {
    checked: state === "on",
    loading: state === "loading",
    set,
  };
}
