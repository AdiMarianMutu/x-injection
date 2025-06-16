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

    switch (type) {
      case MiddlewareType.BeforeAddImport:
      case MiddlewareType.BeforeAddProvider:
        if (!middlewares) return args[0];

        let chainedArg = args[0];

        for (const middleware of middlewares) {
          const result = middleware(chainedArg);

          if (result === false) return false as T;
          if (result === true) continue;

          chainedArg = result;
        }

        return chainedArg;

      case MiddlewareType.BeforeGet:
        return !middlewares ? args[0] : middlewares.reduce((arg, middleware) => middleware(arg, args[1]), args[0]);

      case MiddlewareType.BeforeRemoveImport:
      case MiddlewareType.BeforeRemoveProvider:
      case MiddlewareType.BeforeRemoveExport:
      case MiddlewareType.OnExportAccess:
        return (!middlewares || !middlewares.some((middleware) => !middleware(args[0], args[1]))) as T;
    }
  }

  clear(): void {
    this.middlewaresMap.clear();
  }

  dispose(): void {
    //@ts-expect-error `null` not being assignable to Map.
    this.middlewaresMap = null;
  }
}
