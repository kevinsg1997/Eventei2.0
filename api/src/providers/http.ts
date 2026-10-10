export class ProviderHttpError extends Error {
  status: number;
  bodyPreview: string;

  constructor(status: number, bodyPreview: string, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.status = status;
    this.bodyPreview = bodyPreview;
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? 20_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Eventei/1.0 (+https://github.com/kevinsg1997/Eventei2.0)",
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    if (!response.ok) {
      throw new ProviderHttpError(
        response.status,
        text.slice(0, 240),
        `Request failed (${response.status})`,
      );
    }

    if (text.trimStart().startsWith("<")) {
      throw new ProviderHttpError(
        response.status,
        text.slice(0, 240),
        "Resposta HTML inesperada (possível bloqueio Cloudflare)",
      );
    }

    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}
