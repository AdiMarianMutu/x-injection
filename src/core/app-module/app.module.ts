import type { IProviderModule } from '../provider-module';
import { ProviderModule } from '../provider-module/provider-module';

/**
 * The `root` {@link IProviderModule} of your application.
 *
 * All global modules are imported into the {@link AppModule} and all your custom
 * modules inherit from it.
 */
export const AppModule = new ProviderModule({
  id: 'AppModule',
}) as IProviderModule;

//@ts-expect-error Read-only property.
// This is done to avoid a circular dependency between
// the `ProviderModule` class and the `AppModule` instance.
ProviderModule.APP_MODULE_REF = AppModule;
