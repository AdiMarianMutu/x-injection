import type { ProviderModuleOrDefinition } from '../types';

/**
 * Each module which uses the `isGlobal` marker will
 * register itself into this register.
 *
 * Will then be used by the `AppModule` to make sure that the imported modules
 * are correctly using the global flag option.
 *
 * _Should be empty if all global modules are correctly registered._
 */
export const GlobalModuleRegister = new Set<ProviderModuleOrDefinition>();
