export function toArray<T>(e: any): T[] {
  const result: T[] = [];
  for (const chain of Object.values(e)) {
    if (isNaN(chain as any)) {
      continue;
    }
    result.push(chain as T);
  }
  return result;
}
