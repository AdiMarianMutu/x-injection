import type {
  IProviderModule,
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
