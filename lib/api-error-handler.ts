import { ApiError } from "@/types/api";

export async function parseApiError(response: Response): Promise<string> {
  let errorMessage = `Error ${response.status}: ${response.statusText || "Unknown error"}`;

  try {
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const errorData = (await response.json()) as ApiError;

      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      }

      if (
        errorData?.error?.details &&
        typeof errorData.error.details === "object"
      ) {
        const details = errorData.error.details;
        const firstError = Object.values(details)[0];
        if (typeof firstError === "string") {
          errorMessage = firstError;
        }
      }
    } else {
      const text = await response.text();

      if (text && text.trim().length > 0) {
        try {
          const errorData = JSON.parse(text) as ApiError;

          if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }

          if (
            errorData?.error?.details &&
            typeof errorData.error.details === "object"
          ) {
            const details = errorData.error.details;
            const firstError = Object.values(details)[0];
            if (typeof firstError === "string") {
              errorMessage = firstError;
            }
          }
        } catch {
          if (text.length < 200) {
            errorMessage = text;
          }
        }
      }
    }
  } catch {
    errorMessage = `Error ${response.status}: ${response.statusText || "Network error"}`;
  }

  return errorMessage;
}
