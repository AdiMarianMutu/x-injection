import { ProviderModule, type IProviderModule } from '../provider-module';
import type { ProviderModuleOptions } from '../provider-module/types';

/**
 * Base class for creating OOP-style modules with composition pattern.
 *
 * Provides a clean separation between your custom module logic and the `DI` container
 * by exposing all {@link ProviderModule} functionality through the `module` property.
 *
 * This avoids naming conflicts between your methods and {@link ProviderModule} methods.
 *
 * ```ts
 * Injectable()
 * class UserService {
 *   get(id: string) {
 *     // ... get logic
 *   }
 * }
 *
 * class AuthModule extends ProviderModuleClass {
 *   constructor() {
 *     super({
 *       id: 'AuthModule',
 *       providers: [UserService],
 *       exports: [UserService],
 *     });
 *   }
 *
 *   // Your custom methods - no conflicts with the `ProviderModule` class methods
 *   authenticateUser(userId: string) {
 *     const userService = this.module.get(UserService);
 *
 *     return userService.get(userId);
 *   }
 * }
 *
 * const authModule = new AuthModule();
 * authModule.authenticateUser('123');
 * ```
 */
export class ProviderModuleClass {
  /**
   * The underlying {@link ProviderModule} instance.
   * Access all `DI` container methods through this property.
   */
  readonly module: IProviderModule;

  constructor(options: ProviderModuleOptions) {
    this.module = ProviderModule.create(options);
  }
}
