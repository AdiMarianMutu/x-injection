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
    const {
      identifier,
      imports,
      providers,
      exports,
      defaultScope,
      markAsGlobal,
      onReady,
      onDispose,
      ...internalParams
    } = optionsOrDefinition;
    const internalOptions = internalParams as ProviderModuleOptionsInternal;

    if (isModuleDefinition(optionsOrDefinition)) {
      const ip = internalParams as any;

      delete ip['getDefinition'];
      delete ip['toString'];
    }

    return {
      options: {
        identifier,
        imports,
        providers,
        exports,
        defaultScope,
        markAsGlobal,
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
