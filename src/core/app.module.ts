import { XInjectionError } from '../errors';
import { ProviderModuleHelpers } from '../helpers';
import type { AppModuleOptions, IAppModule, IProviderModuleNaked } from '../types';
import { ProviderModule } from './provider-module';

/**
 * Class of the {@link AppModule} instance.
 *
 * **You shouldn't initialize a new instance of this class, please use the {@link AppModule} instance!**
 */
export class GlobalAppModule extends ProviderModule implements IAppModule {
  private nakedModule = this as unknown as IProviderModuleNaked;
  private isLoaded = false;

  constructor() {
    super(
      ProviderModuleHelpers.buildInternalConstructorParams({
        name: GlobalAppModule.name,
        isAppModule: true,
      })
    );
  }

  register<AsNaked extends boolean = false>(
    options: AppModuleOptions
  ): AsNaked extends false ? IAppModule : IAppModule & IProviderModuleNaked {
    if (this.isLoaded) {
      throw new XInjectionError(`The '${this.nakedModule.name}' has already been registered!`);
    }

    this.nakedModule._lazyInit(options);

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
}

/**
 * Special instance of {@link ProviderModule} which acts as the global module of your application in which you can inject any provider
 * which must be available through your entire application.
 *
 * The registered providers will automatically be available inside all the modules.
 *
 * @example
 * ```ts
 * import { AppModule } from '@adimm/x-injection';
 *
 * // The `register` method must be invoked only once during your application life cycle!
 * AppModule.register({
 *   imports: [ConfigModule, ApiModule, UserModule, DatabaseModule],
 *   providers: [DummyService],
 * });
 * ```
 */
export const AppModule = new GlobalAppModule();
