import type { ProviderModuleOrDefinition } from '../types';

/** Exception which indicates that there is a generic error with an instance of {@link IProviderModule}. */
export class InjectionProviderModuleError extends Error {
  override name = InjectionProviderModuleError.name;

  constructor(module: ProviderModuleOrDefinition, message: string) {
    super(`{ProviderModule.${module.toString()}} => ${message}`);
  }
}
