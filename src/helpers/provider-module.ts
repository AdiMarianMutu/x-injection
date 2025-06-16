import { ProviderModule, type IProviderModule } from '../core/provider-module';
import { ProviderModuleBlueprint } from '../core/provider-module-blueprint/provider-module-blueprint';

export namespace ProviderModuleHelpers {
  export function isModule(value: any): value is IProviderModule {
    return value instanceof ProviderModule;
  }

  export function isBlueprint(value: any): value is ProviderModuleBlueprint {
    return value instanceof ProviderModuleBlueprint;
  }

  export function isModuleOrBlueprint(value: any): value is IProviderModule | ProviderModuleBlueprint {
    return isModule(value) || isBlueprint(value);
  }

  export function tryBlueprintToModule(value: IProviderModule | ProviderModuleBlueprint): IProviderModule {
    if (!(value instanceof ProviderModuleBlueprint)) return value;

    return blueprintToModule(value);
  }

  export function blueprintToModule(moduleBlueprint: ProviderModuleBlueprint): IProviderModule {
    return ProviderModule.create(moduleBlueprint.getDefinition());
  }
}
