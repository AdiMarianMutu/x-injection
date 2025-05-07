import type { IProviderModule } from '../types';

/** Exception which indicates that there is a generic error with an instance of {@link IProviderModule}. */
export class XInjectionProviderModuleError extends Error {
  name = XInjectionProviderModuleError.name;

  constructor(module: IProviderModule, message: string) {
    super(`{ProviderModule.${module.toNaked().name}}: ${message}`);
  }
}
