import { getClassMetadata } from '@inversifyjs/core';
import type { BindingIdentifier, ServiceIdentifier } from 'inversify';

import { InjectionScope } from '../enums';
import type {
  ProviderClassToken,
  ProviderFactoryToken,
  ProviderOrIdentifier,
  ProviderSelfToken,
  ProviderToken,
  ProviderValueToken,
} from '../types';
import { isClass } from './is-class';
import { isPlainObject } from './is-plain-object';
import { bindingScopeToInjectionScope } from './scope-converter';

export namespace ProviderTokenHelpers {
  export function isSelfToken<T>(provider: ProviderToken): provider is ProviderSelfToken<T> {
    return typeof provider === 'function';
  }

  export function isClassToken<T>(provider: ProviderToken): provider is ProviderClassToken<T> {
    return hasProvideProperty(provider) && 'useClass' in provider;
  }

  export function isValueToken<T>(provider: ProviderToken): provider is ProviderValueToken<T> {
    return hasProvideProperty(provider) && 'useValue' in provider;
  }

  export function isFactoryToken<T>(provider: ProviderToken): provider is ProviderFactoryToken<T> {
    return hasProvideProperty(provider) && 'useFactory' in provider;
  }

  export function isSimpleProviderIdentifier(value: any): value is string | symbol {
    return typeof value === 'string' || typeof value === 'symbol';
  }

  export function isBindingIdentifier(value: any): value is BindingIdentifier {
    return isPlainObject(value) && typeof value === 'object' && 'id' in value;
  }

  export function toSimpleServiceIdentifier<T = any>(
    providerOrIdentifier: ProviderOrIdentifier<T> | BindingIdentifier
  ): ServiceIdentifier<T> {
    if (isSimpleProviderIdentifier(providerOrIdentifier) || isSelfToken(providerOrIdentifier as ProviderToken)) {
      return providerOrIdentifier as any;
    } else {
      return (providerOrIdentifier as any)['provide'];
    }
  }

  export function toSimpleServiceIdentifiers(
    providersOrIdentifiers: ProviderOrIdentifier[]
  ): ServiceIdentifier<unknown>[] {
    return providersOrIdentifiers.map((provider) => toSimpleServiceIdentifier(provider));
  }

  export function tryGetScopeFromProvider(provider: ProviderToken): InjectionScope | undefined {
    return isPlainObject(provider) && 'scope' in provider ? provider.scope : undefined;
  }

  export function tryGetDecoratorScopeFromClass<T = any>(provider: ProviderToken<T>): InjectionScope | undefined {
    const providerClass = toSimpleServiceIdentifier(provider);
    if (!isClass(providerClass)) return;

    const inversifyScope = getClassMetadata(providerClass as any)?.scope;
    if (!inversifyScope) return;

    return bindingScopeToInjectionScope(inversifyScope);
  }

  function hasProvideProperty(provider: ProviderToken): boolean {
    return isPlainObject(provider) && typeof provider === 'object' && 'provide' in provider;
  }
}
