import type { IProviderModule, ProviderModule, ProviderModuleBlueprint } from '../core';
import type { DependencyProvider, ProviderToken } from './provider-token';

export type ModuleIdentifier = symbol | string;

export type ModuleOrBlueprint = (ProviderModule | IProviderModule) | ProviderModuleBlueprint;

export type ImportsDefinition = ModuleOrBlueprint[];
export type ProvidersDefinition = DependencyProvider[];
export type ExportsDefinition = ExportDefinition[];

export type ImportsDefinitionOptimized = Set<IProviderModule>;
export type ProvidersDefinitionOptimized = Set<DependencyProvider>;
export type ExportsDefinitionOptimized = Set<ExportDefinition>;

export interface ModuleDefinition<Optimized extends boolean = false> {
  readonly imports: Optimized extends false ? ImportsDefinition : ImportsDefinitionOptimized;
  readonly providers: Optimized extends false ? ProvidersDefinition : ProvidersDefinitionOptimized;
  readonly exports: Optimized extends false ? ExportsDefinition : ExportsDefinitionOptimized;
}

export type ExportDefinition = ProviderToken | ModuleOrBlueprint;
