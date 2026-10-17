const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function isRetryable(error) {
  return RETRYABLE_STATUSES.has(Number(error?.status)) ||
    String(error?.code || '').toUpperCase().includes('RESOURCE_EXHAUSTED') ||
    error?.name === 'AbortError' ||
    !error?.status;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function requestWithGeminiFallback(models, request, options = {}) {
  if (!Array.isArray(models) || models.length === 0) {
    throw new Error('At least one Gemini scan model must be configured');
  }

  const delay = options.delay || wait;
  const baseDelayMs = options.baseDelayMs ?? 500;
  let lastError;
  let failureCount = 0;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    const model = models[modelIndex];
    const maxAttempts = modelIndex === 0 ? 2 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await request(model);
      } catch (error) {
        lastError = error;
        const retryable = isRetryable(error);
        const canTryAnotherModel = modelIndex < models.length - 1 &&
          (retryable || Number(error?.status) === 404);
        const canRetryModel = retryable && attempt < maxAttempts - 1;

        if (!canRetryModel && !canTryAnotherModel) {
          throw error;
        }

        if (canRetryModel) {
          const delayMs = baseDelayMs * (2 ** failureCount);
          failureCount += 1;
          await delay(delayMs);
          continue;
        }

        if (canTryAnotherModel) {
          if (retryable) {
            const delayMs = baseDelayMs * (2 ** failureCount);
            failureCount += 1;
            await delay(delayMs);
          }
          options.onFallback?.(model, models[modelIndex + 1], error);
          break;
        }
      }
    }
  }

  throw lastError || new Error('Gemini scan request failed');
}

module.exports = { requestWithGeminiFallback };
