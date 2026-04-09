'use client';

import { useCallback, useState } from 'react';

interface UseStreamingTextOptions {
  onFinish?: (text: string) => void;
  onError?: (error: Error) => void;
}

interface UseStreamingTextReturn {
  text: string;
  isLoading: boolean;
  error: Error | null;
  trigger: (body: Record<string, unknown>) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

/**
 * Hook for consuming streaming text from AI SDK endpoints
 * Works with toTextStreamResponse() - plain text streaming
 */
export function useStreamingText(
  endpoint: string,
  options: UseStreamingTextOptions = {}
): UseStreamingTextReturn {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const stop = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  }, [abortController]);

  const reset = useCallback(() => {
    setText('');
    setError(null);
    setIsLoading(false);
  }, []);

  const trigger = useCallback(
    async (body: Record<string, unknown>) => {
      // Abort any existing request
      if (abortController) {
        abortController.abort();
      }

      const controller = new AbortController();
      setAbortController(controller);
      setIsLoading(true);
      setError(null);
      setText('');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let accumulated = '';

        // Read plain text stream from toTextStreamResponse()
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setText(accumulated);
        }

        options.onFinish?.(accumulated);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled, not an error
          return;
        }
        const error = err instanceof Error ? err : new Error('Stream failed');
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
        setAbortController(null);
      }
    },
    [endpoint, abortController, options]
  );

  return { text, isLoading, error, trigger, stop, reset };
}
