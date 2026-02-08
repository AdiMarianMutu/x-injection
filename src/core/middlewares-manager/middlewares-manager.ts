import { MiddlewareType } from '../../enums';
import { InjectionProviderModuleDisposedError } from '../../errors';
import type { ProviderModule } from '../provider-module';
import type { AddMiddlewareCallbackType, IMiddlewaresManager } from './middlewares-manager.interfaces';

export class MiddlewaresManager implements IMiddlewaresManager {
  private middlewaresMap: Map<MiddlewareType, Function[]> = new Map();
  private readonly providerModule: ProviderModule;

  constructor(providerModule: ProviderModule) {
    this.providerModule = providerModule;
  }

  add<T extends MiddlewareType>(type: MiddlewareType, cb: AddMiddlewareCallbackType<T>): void {
    const currentMiddlewares = this.middlewaresMap.get(type);

    if (currentMiddlewares) {
      currentMiddlewares.push(cb);

      return;
    }

    // First middleware
    this.middlewaresMap.set(type, [cb]);
  }

  applyMiddlewares<T>(type: MiddlewareType, ...args: any[]): T {
    if (this.middlewaresMap === null) throw new InjectionProviderModuleDisposedError(this.providerModule);

    const middlewares = this.middlewaresMap.get(type);
    if (!middlewares) return args[0];

    switch (type) {
      case MiddlewareType.BeforeAddImport:
      case MiddlewareType.BeforeAddProvider:
        return this.applyChainMiddleware(middlewares, ...args);

      case MiddlewareType.BeforeGet:
        return this.applyReduceMiddleware(middlewares, ...args);

      case MiddlewareType.BeforeRemoveImport:
      case MiddlewareType.BeforeRemoveProvider:
      case MiddlewareType.BeforeRemoveExport:
      case MiddlewareType.OnExportAccess:
        return this.applyBooleanMiddleware(middlewares, ...args) as T;
    }
  }

  private applyChainMiddleware<T>(middlewares: Function[], ...args: any[]): T {
    let chainedArg = args[0];

    for (const middleware of middlewares) {
      const result = middleware(chainedArg);

      if (result === false) return false as T;
      if (result === true) continue;

      chainedArg = result;
    }

    return chainedArg;
  }

  private applyReduceMiddleware(middlewares: Function[], ...args: any[]): any {
    return middlewares.reduce((arg, middleware) => middleware(arg, args[1], args[2]), args[0]);
  }

  private applyBooleanMiddleware(middlewares: Function[], ...args: any[]): boolean {
    return !middlewares.some((middleware) => !middleware(args[0], args[1]));
  }

  clear(): void {
    this.middlewaresMap.clear();
  }

  dispose(): void {
    //@ts-expect-error `null` not being assignable to Map.
    this.middlewaresMap = null;
  }
}
