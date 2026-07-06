// Общее для обоих клиентов (публичного и авторизованного): тип ошибки и unwrap.
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Разворачивает результат openapi-fetch ({ data, error, response }):
 * бросает типизированный ApiError при не-2xx, иначе возвращает data.
 * Формат ошибки соответствует error-схеме Fastify: { statusCode, error, message, code, details }.
 */
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await call;
  if (error || !response.ok) {
    const body = (error ?? {}) as {
      message?: string;
      code?: string;
      details?: unknown;
    };
    throw new ApiError(
      response.status,
      body.message ?? response.statusText,
      body.code,
      body.details,
    );
  }
  return data as T;
}
