import type { DynamicExports, ProviderModuleOptions, ProviderModuleOptionsInternal, StaticExports } from '../types';

export namespace ProviderModuleHelpers {
  export function buildInternalConstructorParams(
    params: ProviderModuleOptions & ProviderModuleOptionsInternal
  ): ProviderModuleOptions {
    return params as ProviderModuleOptions;
  }

  export function isDynamicExport(exporter: StaticExports | DynamicExports): exporter is DynamicExports {
    return !Array.isArray(exporter) && typeof exporter === 'function';
  }
}
