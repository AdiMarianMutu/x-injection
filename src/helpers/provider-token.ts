import { getClassMetadata } from '@inversifyjs/core';
import type { ServiceIdentifier } from 'inversify';

import { InjectionScope } from '../enums';
import type {
  ProviderClassToken,
  ProviderFactoryToken,
  ProviderIdentifier,
  ProviderOptions,
  ProviderScopeOption,
  ProviderToken,
  ProviderValueToken,
} from '../types';
import { isClass } from './is-class';
import { isClassOrFunction } from './is-class-or-function';
import { isPlainObject } from './is-plain-object';
import { bindingScopeToInjectionScope } from './scope-converter';

export namespace ProviderTokenHelpers {
  export function isClassToken<T>(provider: ProviderToken<T>): provider is ProviderClassToken<T> {
    return hasProvideProperty(provider) && 'useClass' in provider;
  }

  export function isValueToken<T>(provider: ProviderToken<T>): provider is ProviderValueToken<T> {
    return hasProvideProperty(provider) && 'useValue' in provider;
  }

  export function isFactoryToken<T>(provider: ProviderToken<T>): provider is ProviderFactoryToken<T> {
    return hasProvideProperty(provider) && 'useFactory' in provider;
  }

  export function isProviderIdentifier<T = any>(value: any): value is ProviderIdentifier<T> {
    return typeof value === 'string' || typeof value === 'symbol' || isClassOrFunction(value);
  }

  export function toServiceIdentifier<T = any>(provider: ProviderToken<T>): ServiceIdentifier<T> {
    return isProviderIdentifier(provider) ? provider : provider.provide;
  }

  export function toServiceIdentifiers(providers: ProviderToken[]): ServiceIdentifier<unknown>[] {
    return providers.map((provider) => toServiceIdentifier(provider));
  }

  /**
   * The priority order is as follows:
   * 1. From the `ProviderToken.scope`
   * 2. From the class `@Injectable(scope)` decorator
   * 3. From the `ProviderModule` default scope.
   *
   * @param provider The {@link ProviderToken}.
   * @param moduleDefaultScope The module default scope.
   */
  export function getInjectionScopeByPriority(
    provider: ProviderToken,
    moduleDefaultScope: InjectionScope
  ): InjectionScope {
    return tryGetScopeFromProvider(provider) ?? tryGetDecoratorScopeFromClass(provider) ?? moduleDefaultScope;
  }

  export function tryGetProviderOptions<T>(
    provider: ProviderToken<T>
  ): (ProviderOptions<T> & ProviderScopeOption) | undefined {
    if (!hasProvideProperty(provider)) return;

    return provider as any;
  }

  export function tryGetScopeFromProvider(provider: ProviderToken): InjectionScope | undefined {
    const providerOptions = tryGetProviderOptions(provider);
    if (!providerOptions) return;

    return providerOptions.scope;
  }

  export function tryGetDecoratorScopeFromClass<T = any>(provider: ProviderToken<T>): InjectionScope | undefined {
    const providerClass = toServiceIdentifier(provider);
    if (!isClass(providerClass)) return;

    const inversifyScope = getClassMetadata(providerClass as any)?.scope;
    if (!inversifyScope) return;

    return bindingScopeToInjectionScope(inversifyScope);
  }

  function hasProvideProperty(provider: any): provider is object {
    return isPlainObject(provider) && typeof provider === 'object' && 'provide' in provider;
  }
}
