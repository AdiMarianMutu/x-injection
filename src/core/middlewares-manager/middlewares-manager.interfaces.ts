import type { MiddlewareType } from '../../enums';
import type { DependencyProvider, ExportDefinition, ProviderToken } from '../../types';
import type { IProviderModule } from '../provider-module';

export interface IMiddlewaresManager {
  /** See {@link MiddlewareType} for more info. */
  add<T extends MiddlewareType>(type: T, cb: AddMiddlewareCallbackType<T>): void;
}

export type AddMiddlewareCallbackType<T extends MiddlewareType> = T extends MiddlewareType.BeforeAddImport
  ? (module: IProviderModule) => IProviderModule | boolean
  : T extends MiddlewareType.BeforeAddProvider
    ? (provider: ProviderToken) => ProviderToken | boolean
    : T extends MiddlewareType.BeforeGet
      ? (provider: any, providerToken: ProviderToken) => any
      : T extends MiddlewareType.BeforeRemoveImport
        ? (module: IProviderModule) => boolean
        : T extends MiddlewareType.BeforeRemoveProvider
          ? (dependencyProvider: DependencyProvider<any>) => boolean
          : T extends MiddlewareType.BeforeRemoveExport
            ? (providerOrModule: ExportDefinition) => boolean
            : T extends MiddlewareType.OnExportAccess
              ? (importerModule: IProviderModule, currentExport: ProviderToken) => boolean
              : never;
