import type { BindingScope } from 'inversify';

import { InjectionScope } from '../enums';

export function injectionScopeToBindingScope(injectionScope: InjectionScope): BindingScope {
  switch (injectionScope) {
    case InjectionScope.Singleton:
      return 'Singleton';
    case InjectionScope.Transient:
      return 'Transient';
    case InjectionScope.Request:
      return 'Request';
  }
}

export function bindingScopeToInjectionScope(bindingScope: BindingScope): InjectionScope {
  switch (bindingScope) {
    case 'Singleton':
      return InjectionScope.Singleton;
    case 'Transient':
      return InjectionScope.Transient;
    case 'Request':
      return InjectionScope.Request;
  }
}
