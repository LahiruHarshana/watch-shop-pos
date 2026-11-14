type ApiPayload = {
  data?: unknown;
  error?: { code?: string; message?: string };
};

export async function readResponseJson(res: Response): Promise<ApiPayload> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as ApiPayload;
  } catch {
    return {};
  }
}
