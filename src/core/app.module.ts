import { InjectionError, InjectionProviderModuleGlobalMarkError } from '../errors';
import { ProviderModuleHelpers } from '../helpers';
import type { AppModuleOptions, IAppModule, IProviderModuleNaked } from '../types';
import { GLOBAL_APP_MODULE_ID } from './constants';
import { ProviderModule } from './provider-module';

/**
 * Class of the {@link AppModule} instance.
 *
 * **You shouldn't initialize a new instance of this class, please use the {@link AppModule} instance!**
 */
export class GlobalAppModule extends ProviderModule implements IAppModule {
  override isMarkedAsGlobal: boolean = true;

  private nakedModule = this as unknown as IProviderModuleNaked;
  private isLoaded = false;

  constructor() {
    super(
      ProviderModuleHelpers.buildInternalConstructorParams({
        identifier: Symbol(GLOBAL_APP_MODULE_ID),
        isAppModule: true,
      })
    );
  }

  register<AsNaked extends boolean = false>(
    options: AppModuleOptions
  ): AsNaked extends false ? IAppModule : IAppModule & IProviderModuleNaked {
    if (this.isLoaded) {
      throw new InjectionError(`The '${this.toString()}' has already been registered!`);
    }

    this.nakedModule._lazyInit(options);

    this.checkIfImportsHaveGlobalMark();

    this.isLoaded = true;

    return this as any;
  }

  /* istanbul ignore next */
  override toNaked(): IAppModule & IProviderModuleNaked {
    return super.toNaked() as any;
  }

  protected override async _dispose(): Promise<void> {
    this.isLoaded = false;

    super._dispose();
  }

  private checkIfImportsHaveGlobalMark(): void {
    this.imports.forEach((imported) => {
      if (imported.isMarkedAsGlobal) return;

      throw new InjectionProviderModuleGlobalMarkError(
        imported,
        'Is not marked as `global` but has been imported into the `AppModule`!'
      );
    });
  }
}

/**
 * Special instance of {@link ProviderModule} which acts as the global module of your application in which you can inject any provider
 * which must be available through your entire application.
 *
 * The registered providers will automatically be available inside all the modules.
 *
 * @example
 * ```ts
 * // The `register` method must be invoked only once during your application life cycle!
 * AppModule.register({
 *   imports: [ConfigModule, ApiModule, UserModule, DatabaseModule],
 *   providers: [DummyService],
 * });
 * ```
 */
export const AppModule = new GlobalAppModule();
