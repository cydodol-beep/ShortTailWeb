import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://gggpkciminardekbmpyk.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ3BrY2ltaW5hcmRla2JtcHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzk0MzcsImV4cCI6MjA3OTgxNTQzN30.2mx1CKUBZDnhyNpeZ1JlwDk_OJ7MAwyW_VBVDIBQMKc';

const resilientFetch: typeof fetch = async (input, init) => {
  const method = (
    init?.method ||
    (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')
  ).toUpperCase();
  const canRetry = method === 'GET' || method === 'HEAD';
  const maxAttempts = canRetry ? 3 : 1;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const baseFetch =
        typeof window !== 'undefined' && typeof window.fetch === 'function'
          ? window.fetch.bind(window)
          : globalThis.fetch.bind(globalThis);
      const response = await baseFetch(input, init);
      if (canRetry && response.status >= 502 && response.status <= 529 && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
        continue;
      }
      return response;
    } catch (err: unknown) {
      lastError = err;
      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (!canRetry || isAbort || attempt >= maxAttempts) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
    }
  }
  throw lastError;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args: Parameters<typeof fetch>) => resilientFetch(...args),
  },
});
