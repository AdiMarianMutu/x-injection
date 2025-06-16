export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;

  if (typeof obj === 'function') {
    // Create a new function that calls the original function
    // This ensures the cloned function is a different reference
    return ((...args: any[]) => (obj as any)(...args)) as any;
  }

  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as T;

  const clonedObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone((obj as any)[key]);
    }
  }

  return clonedObj;
}
