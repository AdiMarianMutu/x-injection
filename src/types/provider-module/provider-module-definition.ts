import type { ProviderModuleOptions } from './provider-module-options';

export interface IProviderModuleDefinition extends ProviderModuleOptions {
  /** Returns the {@link ProviderModuleOptions | definition}. */
  getDefinition(): ProviderModuleOptions;

  /** Returns the {@link ProviderModuleOptions.identifier | identifier}. */
  toString(): string;
}
