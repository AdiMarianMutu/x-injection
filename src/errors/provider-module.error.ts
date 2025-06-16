import type { IProviderModule } from '../core';

/** Exception which indicates that there is a generic error with an instance of {@link IProviderModule}. */
export class InjectionProviderModuleError extends Error {
  override name = InjectionProviderModuleError.name;

  constructor(module: IProviderModule, message: string) {
    let moduleId = 'Unknown';

    try {
      moduleId = module.toString();
    } catch {}

    super(`{ProviderModule.${moduleId}} => ${message}`);
  }
}
