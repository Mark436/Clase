import { SithClient } from "sith-api-client";

type DatosResponse = Awaited<ReturnType<SithClient["fetchDatos"]>>;

export type Alumno = DatosResponse["alumno"];
export type Aviso = DatosResponse["avisos"][number];

export interface Credenciales {
  user: string;
  pass: string;
}

export interface AcademicData {
  alumno: Alumno;
  avisos: Aviso[];
}

export type ApiErrorKind = "invalid-credentials" | "connection" | "unknown";

const KIND_MESSAGES: Record<ApiErrorKind, string> = {
  "invalid-credentials": "Usuario o contraseña incorrectos.",
  connection: "No se pudo conectar con el servicio académico.",
  unknown: "Ocurrió un error inesperado.",
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, options?: ErrorOptions) {
    super(KIND_MESSAGES[kind], options);
    this.name = "ApiError";
    this.kind = kind;
  }
}

function classifyCause(cause: unknown): ApiErrorKind {
  if (typeof cause === "object" && cause !== null && "status" in cause) {
    const status = (cause as { status: unknown }).status;
    return status === 401 || status === 403
      ? "invalid-credentials"
      : "connection";
  }
  if (Array.isArray(cause)) {
    return "invalid-credentials";
  }
  if (cause instanceof Error) {
    return "connection";
  }
  return "unknown";
}

const sithClient = new SithClient();

export async function fetchAppData(
  credentials: Credenciales,
): Promise<AcademicData> {
  try {
    return await sithClient.fetchDatos(credentials);
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    throw new ApiError(classifyCause(cause), { cause: error });
  }
}
