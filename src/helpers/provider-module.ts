import { ProviderModuleDefinition } from '../core/provider-module-definition';
import type {
  IProviderModule,
  IProviderModuleDefinition,
  LazyExport,
  ProviderModuleOptions,
  ProviderModuleOptionsInternal,
  StaticExport,
} from '../types';
import { isFunction } from './is-function';

export namespace ProviderModuleHelpers {
  export function buildInternalConstructorParams(
    params: Partial<ProviderModuleOptions & ProviderModuleOptionsInternal>
  ): ProviderModuleOptions {
    return params as ProviderModuleOptions;
  }

  export function getOptionsOrModuleDefinitionOptions(
    optionsOrDefinition: ProviderModuleOptions | IProviderModuleDefinition
  ): { options: ProviderModuleOptions; internalOptions: ProviderModuleOptionsInternal } {
    const { identifier, imports, providers, exports, defaultScope, isGlobal, onReady, onDispose, ...internalParams } =
      optionsOrDefinition;
    const internalOptions = internalParams as ProviderModuleOptionsInternal;

    if (isModuleDefinition(optionsOrDefinition)) {
      const ip = internalParams as any;

      // [TO-DO]: Find a better way to handle this as it is confusing
      // and we may also forget to update this `delete` operation list.
      //
      // This is done because the `ProviderModule` constructor can accept both
      // the `ProviderModuleOptionsInternal` plain object and `ProviderModuleDefinition` instance.
      // So we make sure to delete from the remaining properties (the `internalParams` spread object)
      // the properties/methods of the `ProviderModuleDefinition` instance.
      delete ip['getDefinition'];
      delete ip['clone'];
      delete ip['toString'];
    }

    return {
      options: {
        identifier,
        imports,
        providers,
        exports,
        defaultScope,
        isGlobal,
        onReady,
        onDispose,
      },
      internalOptions,
    };
  }

  export function isModuleDefinition(value: any): value is IProviderModuleDefinition {
    return value instanceof ProviderModuleDefinition;
  }

  export function isLazyExport(exp: any): exp is LazyExport {
    return isFunction(exp);
  }

  export function tryStaticOrLazyExportToStaticExport(
    module: IProviderModule,
    exp: StaticExport | LazyExport
  ): StaticExport | void {
    return isLazyExport(exp) ? exp(module) : exp;
  }
}
