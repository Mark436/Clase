// Proxy hacia la API SITH para evitar CORS y mixed-content desde el navegador.
// Solo reenvía peticiones POST a /login y /logout; nunca registra los cuerpos
// (contienen credenciales del alumno) ni almacena nada.

const UPSTREAM_BASE_URL = (
  process.env.SITH_UPSTREAM_URL ?? "http://sith.ith.mx/XTodo/wr"
).replace(/\/+$/, "");

const ALLOWED_ACTIONS = new Set(["login", "logout"]);

export const config = { path: "/api/sith/:action" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const action = new URL(request.url).pathname.split("/").pop() ?? "";

  if (request.method !== "POST" || !ALLOWED_ACTIONS.has(action)) {
    return jsonResponse(
      { error: "Ruta o método no permitido." },
      405,
      request,
    );
  }

  try {
    const upstream = await fetch(`${UPSTREAM_BASE_URL}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
      },
      body: await request.text(),
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
        ...corsHeaders(request),
      },
    });
  } catch {
    return jsonResponse(
      { error: "No se pudo contactar el servicio académico." },
      502,
      request,
    );
  }
}

function corsHeaders(request: Request): Record<string, string> {
  const configured = process.env.CORS_ALLOW_ORIGIN?.trim();
  const origin = configured || request.headers.get("origin") || "*";

  return {
    "Access-Control-Allow-Origin": origin === "null" ? "*" : origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  request: Request,
): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders(request),
  });
}
