export type Readiness = { ready: boolean; database: boolean; rateLimit: boolean };

// One probe per process, including after a timeout. A hung dependency cannot
// create an unbounded queue of checks when a monitor keeps polling.
export function createReadinessProbe(checks: { database: () => Promise<unknown>; rateLimit: () => Promise<unknown> },
  onChange: (result: Readiness, durationMs: number) => void,
  options: { timeoutMs?: number; cacheMs?: number; now?: () => number } = {}) {
  const { timeoutMs = 2500, cacheMs = 5000, now = Date.now } = options;
  let inFlight: Promise<Readiness> | undefined;
  let cached: Readiness | undefined;
  let expires = 0;
  let previous = "";
  return (): Promise<Readiness> => {
    if (inFlight) return inFlight;
    if (cached && now() < expires) return Promise.resolve(cached);
    const started = now();
    const result: Readiness = { ready: false, database: false, rateLimit: false };
    const work = Promise.allSettled([
      Promise.resolve().then(checks.database).then(() => { result.database = true; }),
      Promise.resolve().then(checks.rateLimit).then(() => { result.rateLimit = true; }),
    ]);
    let timer: ReturnType<typeof setTimeout>;
    const deadline = new Promise<void>((resolve) => { timer = setTimeout(resolve, timeoutMs); });
    const response = Promise.race([work, deadline]).then(() => {
      clearTimeout(timer);
      const snapshot = { ...result, ready: result.database && result.rateLimit };
      cached = snapshot;
      expires = now() + cacheMs;
      const state = JSON.stringify(snapshot);
      if (state !== previous) { onChange(snapshot, now() - started); previous = state; }
      return snapshot;
    });
    inFlight = response;
    // Retain the settled response until underlying work has finished as well.
    void Promise.all([work, response]).then(() => { inFlight = undefined; });
    return response;
  };
}
