import type {
  DynamicExports,
  ProviderModuleConstructor,
  ProviderModuleConstructorInternal,
  StaticExports,
} from '../types';

export namespace ProviderModuleHelpers {
  export function buildInternalConstructorParams(
    params: ProviderModuleConstructor & ProviderModuleConstructorInternal
  ): ProviderModuleConstructor {
    return params as ProviderModuleConstructor;
  }

  export function isDynamicExport(exporter: StaticExports | DynamicExports): exporter is DynamicExports {
    return !Array.isArray(exporter) && typeof exporter === 'function';
  }
}
