export default async function asyncRetry(fn, options = {}) {
  let lastError;
  const maxRetries = options.retries || 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        const delay = options.minTimeout || 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
