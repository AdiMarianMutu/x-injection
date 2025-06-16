import { getClassMetadata } from '@inversifyjs/core';

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

  export function toProviderIdentifier<T = any>(provider: ProviderToken<T>): ProviderIdentifier<T> {
    return isProviderIdentifier(provider) ? provider : provider.provide;
  }

  export function toProviderIdentifiers(providers: ProviderToken[]): ProviderIdentifier<unknown>[] {
    return providers.map((provider) => toProviderIdentifier(provider));
  }

  export function providerIdentifierToString(providerIdentifier: ProviderIdentifier): string {
    if (typeof providerIdentifier === 'symbol' || typeof providerIdentifier === 'string') {
      return providerIdentifier.toString();
    }

    return providerIdentifier.name;
  }

  export function providerTokenToString(providerToken: ProviderToken): string {
    const providerIdentifier = toProviderIdentifier(providerToken);

    return providerIdentifierToString(providerIdentifier);
  }

  export function providerTokensAreEqual(p0: ProviderToken, p1: ProviderToken): boolean {
    if (p0 === p1) return true;

    const id0 = toProviderIdentifier(p0);
    const id1 = toProviderIdentifier(p1);

    if (id0 !== id1) return false;

    if (isClassToken(p0) && isClassToken(p1)) {
      return p0.useClass === p1.useClass;
    }

    if (isValueToken(p0) && isValueToken(p1)) {
      return p0.useValue === p1.useValue;
    }

    if (isFactoryToken(p0) && isFactoryToken(p1)) {
      if (p0.useFactory !== p1.useFactory) return false;

      // const inject0 = p0.inject ?? [];
      // const inject1 = p1.inject ?? [];

      // if (inject0.length !== inject1.length) return false;

      // for (let i = 0; i < inject0.length; i++) {
      //   if (inject0[i] !== inject1[i]) return false;
      // }

      return true;
    }

    // At this point, identifiers are equal but tokens are not class/value/factory tokens,
    // so consider them equal based on identifier alone.
    return true;
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
    const providerClass = toProviderIdentifier(provider);
    if (!isClass(providerClass)) return;

    const inversifyScope = getClassMetadata(providerClass as any)?.scope;
    if (!inversifyScope) return;

    return bindingScopeToInjectionScope(inversifyScope);
  }

  function hasProvideProperty(provider: any): provider is object {
    return isPlainObject(provider) && typeof provider === 'object' && 'provide' in provider;
  }
}
