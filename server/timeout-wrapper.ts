export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]).catch(() => {
    console.log(`⚠️  Timeout reached, using fallback data`);
    return fallback;
  });
}
