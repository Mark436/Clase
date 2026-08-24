import type { Alumno, Aviso } from "@/lib/api/client";
import { getValue, putValue, STORE_APP_DATA } from "./db";

export interface CachedAppData {
  alumno: Alumno;
  avisos: Aviso[];
  loadedAt: string;
}

const APP_DATA_KEY = "current";

export async function loadAppData(): Promise<CachedAppData | null> {
  const data = await getValue<CachedAppData>(STORE_APP_DATA, APP_DATA_KEY);
  return data ?? null;
}

export async function saveAppData(data: CachedAppData): Promise<void> {
  await putValue(STORE_APP_DATA, { key: APP_DATA_KEY, value: data });
}
