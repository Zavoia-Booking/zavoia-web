export class HomeRequestTimeoutError extends Error {
  constructor() {
    super("Home request deadline exceeded");
    this.name = "HomeRequestTimeoutError";
  }
}

/** Bound the entire operation, even when its transport ignores cancellation. */
export function withHomeDeadline<T>(
  request: (signal: AbortSignal) => Promise<T>,
  { controller = new AbortController(), timeoutMs = 15_000 }: {
    controller?: AbortController;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const { signal } = controller;
  if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      action();
    };
    const abort = () => finish(() => reject(new DOMException("Aborted", "AbortError")));
    signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => {
      // Settle first: aborting is best-effort cleanup, never the deadline itself.
      finish(() => reject(new HomeRequestTimeoutError()));
      controller.abort();
    }, timeoutMs);
    try {
      Promise.resolve(request(signal)).then(
        (value) => finish(() => resolve(value)),
        (error: unknown) => finish(() => reject(error)),
      );
    } catch (error) {
      finish(() => reject(error));
    }
  });
}
