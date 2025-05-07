import type { BindInWhenOnFluentSyntax, BindOnFluentSyntax, BindWhenOnFluentSyntax, Container } from 'inversify';

import { InjectionScope } from '../enums';
import { ProviderTokenHelpers } from '../helpers';
import type {
  IProviderModule,
  IProviderModuleNaked,
  ProviderClassToken,
  ProviderFactoryToken,
  ProviderOptions,
  ProviderSelfToken,
  ProviderToken,
  ProviderValueToken,
} from '../types';

/**
 * Class containing an internal set of `utils`.
 *
 * Each {@link IProviderModuleNaked.moduleUtils | ProviderModule} instance has its own {@link ProviderModuleUtils} property instance.
 */
export class ProviderModuleUtils {
  /** The low-level InversifyJS {@link Container} owned by {@link ProviderModuleUtils.module | module}. */
  get container(): Container {
    return this.module.toNaked().container;
  }

  /** The parent {@link IProviderModule | ProviderModule} of `this` instance. */
  readonly module: IProviderModule;
  readonly moduleNaked: IProviderModuleNaked;

  constructor(module: IProviderModule) {
    this.module = module;
    this.moduleNaked = module.toNaked();
  }

  /**
   * Low-level method which can be used to manually register _(bind)_ a new {@link provider} into the {@link ProviderModuleUtils.module | module} container.
   *
   * **Note:** _You shouldn't directly use this to register providers as they will not appear_
   * _into the module's `imports` and `exports` arrays! Therefore leading to unexpected bugs and confusion!_
   *
   * @param provider The {@link ProviderToken | provider} to register.
   * @param defaultScope Optionally provide the default {@link InjectionScope} to use when applicable.
   * @returns `true` when the {@link provider} has been bound otherwhise `false`.
   */
  bindToContainer<T>(provider: ProviderToken<T>, defaultScope?: InjectionScope): boolean {
    if (ProviderTokenHelpers.isSelfToken(provider)) {
      return this.bindSelfTokenToContainer(provider, defaultScope);
    } else if (ProviderTokenHelpers.isClassToken(provider)) {
      return this.bindClassTokenToContainer(provider, defaultScope);
    } else if (ProviderTokenHelpers.isValueToken(provider)) {
      return this.bindValueTokenToContainer(provider);
    } else if (ProviderTokenHelpers.isFactoryToken(provider)) {
      return this.bindFactoryTokenToContainer(provider, defaultScope);
    }

    return false;
  }

  /** Low-level method which does exactly what {@link bindToContainer} does, however accepts a list of {@link providers}.  */
  bindManyToContainer(providers: ProviderToken[], defaultScope?: InjectionScope): void {
    providers.forEach((provider) => this.bindToContainer(provider, defaultScope));
  }

  private bindSelfTokenToContainer<T>(
    provider: ProviderSelfToken<T>,
    defaultScope: InjectionScope | undefined
  ): boolean {
    this.setBindingScope(
      provider,
      this.container.bind(ProviderTokenHelpers.toSimpleServiceIdentifier(provider)).toSelf(),
      defaultScope
    );

    return this.moduleNaked.__isCurrentBound(provider);
  }

  private bindClassTokenToContainer<T>(
    provider: ProviderClassToken<T>,
    defaultScope: InjectionScope | undefined
  ): boolean {
    this.setBindingOnEvent(
      provider,
      this.setWhenBinding(
        provider,
        this.setBindingScope(
          provider,
          this.container.bind(ProviderTokenHelpers.toSimpleServiceIdentifier(provider)).to(provider.useClass),
          defaultScope
        )
      )
    );

    return this.moduleNaked.__isCurrentBound(provider);
  }

  private bindValueTokenToContainer<T>(provider: ProviderValueToken<T>): boolean {
    this.setBindingOnEvent(
      provider,
      this.setWhenBinding(
        provider,
        this.container.bind(ProviderTokenHelpers.toSimpleServiceIdentifier(provider)).toConstantValue(provider.useValue)
      )
    );

    return this.moduleNaked.__isCurrentBound(provider);
  }

  private bindFactoryTokenToContainer<T>(
    provider: ProviderFactoryToken<T>,
    defaultScope: InjectionScope | undefined
  ): boolean {
    this.setBindingOnEvent(
      provider,
      this.setWhenBinding(
        provider,
        this.setBindingScope(
          provider,
          this.container
            .bind(ProviderTokenHelpers.toSimpleServiceIdentifier(provider))
            .toResolvedValue(
              provider.useFactory,
              ProviderTokenHelpers.toSimpleServiceIdentifiers(provider.inject ?? [])
            ),
          defaultScope
        )
      )
    );

    return this.moduleNaked.__isCurrentBound(provider);
  }

  /** Sets the {@link InjectionScope} of a bound {@link provider}. */
  private setBindingScope<T>(
    provider: ProviderToken<T>,
    binding: BindInWhenOnFluentSyntax<T>,
    defaultScope?: InjectionScope
  ): BindWhenOnFluentSyntax<T> {
    // A constant token will always be a singleton.
    if (ProviderTokenHelpers.isValueToken(provider)) return binding;

    const INJECTION_SCOPE =
      // The priority order is as follows:
      // 1. From the `ProviderToken.scope`
      // 2. From the class `@Injectable(scope)` decorator
      // 3. From the `ProviderModule` default scope.
      ProviderTokenHelpers.tryGetScopeFromProvider(provider) ??
      ProviderTokenHelpers.tryGetDecoratorScopeFromClass(provider) ??
      defaultScope;

    switch (INJECTION_SCOPE) {
      case InjectionScope.Singleton:
        return binding.inSingletonScope();
      case InjectionScope.Transient:
        return binding.inTransientScope();
      case InjectionScope.Request:
        return binding.inRequestScope();
    }

    return binding;
  }

  /** Sets the `when` clause of a bound {@link provider}. */
  private setWhenBinding<T>(
    provider: ProviderToken<T>,
    binding: BindWhenOnFluentSyntax<T>
  ): BindOnFluentSyntax<unknown> {
    // The `SelfToken` has no options.
    if (ProviderTokenHelpers.isSelfToken(provider)) return binding;

    const when = (provider as ProviderOptions<unknown>).when;
    if (!when) return binding;

    return binding.when(when);
  }

  /** Sets the `activation` and `deactivation` events of a bound {@link provider}. */
  private setBindingOnEvent(provider: ProviderToken, binding: BindOnFluentSyntax<any>): void {
    // The `SelfToken` has no options.
    if (ProviderTokenHelpers.isSelfToken(provider)) return;

    const opts = provider as ProviderOptions<unknown>;

    if (opts.onEvent?.activation) {
      binding.onActivation(opts.onEvent.activation);
    }

    if (opts.onEvent?.deactivation) {
      binding.onDeactivation(opts.onEvent.deactivation);
    }
  }
}
