import { InjectionError, InjectionProviderModuleGlobalMarkError } from '../errors';
import { ProviderModuleHelpers } from '../helpers';
import type {
  AppModuleOptions,
  ExportsList,
  IAppModule,
  IProviderModuleNaked,
  ProviderModuleOrDefinition,
} from '../types';
import { GLOBAL_APP_MODULE_ID } from './constants';
import { GlobalModuleRegister } from './global-modules-register';
import { ProviderModule } from './provider-module';

/**
 * Class of the {@link AppModule} instance.
 *
 * **You shouldn't initialize a new instance of this class, please use the {@link AppModule} instance!**
 */
export class GlobalAppModule extends ProviderModule implements IAppModule {
  _strict: AppModuleOptions['_strict'];

  private nakedModule = this as unknown as IProviderModuleNaked;
  private isLoaded = false;

  constructor() {
    super(
      ProviderModuleHelpers.buildInternalConstructorParams({
        identifier: GLOBAL_APP_MODULE_ID,
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

    this._strict = options._strict ?? true;

    this.nakedModule._internalInit(options);

    this.checkIfRegisteredModulesHaveGlobalMark(this.nakedModule, this.imports);

    this.isLoaded = true;

    return this as any;
  }

  override lazyImport(...modules: ProviderModuleOrDefinition[]): void {
    this.checkIfRegisteredModulesHaveGlobalMark(this.nakedModule, modules);

    super.lazyImport(...modules);
  }

  /* istanbul ignore next */
  override toNaked(): IAppModule & IProviderModuleNaked {
    return super.toNaked() as any;
  }

  override async dispose(): Promise<void> {
    this.isLoaded = false;

    await super.dispose();
  }

  private checkIfRegisteredModulesHaveGlobalMark(
    parentModule: IProviderModuleNaked,
    list: ExportsList,
    isSecondaryImport = false
  ): void {
    if (!this._strict) return;

    list.forEach((m) => {
      const module = ProviderModuleHelpers.tryStaticOrLazyExportToStaticExport(this, m) as IProviderModuleNaked;
      const isModuleDefinition = ProviderModuleHelpers.isModuleDefinition(module);

      if (!(module instanceof ProviderModule) && !isModuleDefinition) return;

      const hasMarkedAsGlobal = isModuleDefinition ? module.markAsGlobal : module.isMarkedAsGlobal;

      if (hasMarkedAsGlobal) {
        GlobalModuleRegister.delete(module);

        // This module may also export other modules
        // which may have been marked as global
        // and not directly imported into the `AppModule`.
        if (module.exports) {
          this.checkIfRegisteredModulesHaveGlobalMark(module, module.exports, true);
        }

        return;
      }

      throw new InjectionProviderModuleGlobalMarkError(
        module,
        isSecondaryImport
          ? 'Is not marked as `global` but has been imported into the `AppModule` ' +
            `via the \`${parentModule.toString()}\` module!`
          : 'Is not marked as `global` but has been imported into the `AppModule`!'
      );
    });

    if (isSecondaryImport) return;

    GlobalModuleRegister.forEach((module) => {
      throw new InjectionProviderModuleGlobalMarkError(
        module,
        `Is marked as 'global' and has not been imported into the 'AppModule'!`
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
