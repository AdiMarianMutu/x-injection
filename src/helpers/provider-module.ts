import type {
  IProviderModule,
  LazyExport,
  LazyImport,
  ProviderModuleOptions,
  ProviderModuleOptionsInternal,
  StaticExport,
  StaticImport,
} from '../types';
import { isFunction } from './is-function';

export namespace ProviderModuleHelpers {
  export function buildInternalConstructorParams(
    params: Partial<ProviderModuleOptions & ProviderModuleOptionsInternal>
  ): ProviderModuleOptions {
    return params as ProviderModuleOptions;
  }

  export function isLazyImport(imp: StaticImport | LazyImport): imp is LazyImport {
    return isFunction(imp);
  }

  export function isLazyExport(exp: StaticExport | LazyExport): exp is LazyExport {
    return isFunction(exp);
  }

  export function tryStaticOrLazyExportToStaticExport(
    module: IProviderModule,
    exp: StaticExport | LazyExport
  ): StaticExport | void {
    return isLazyExport(exp) ? exp(module) : exp;
  }
}
