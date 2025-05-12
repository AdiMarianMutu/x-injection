import type { BindInWhenOnFluentSyntax, BindOnFluentSyntax, BindWhenOnFluentSyntax, Container } from 'inversify';

import { InjectionScope } from '../enums';
import { ProviderTokenHelpers } from '../helpers';
import type {
  DependencyProvider,
  IProviderModule,
  IProviderModuleNaked,
  ProviderClassToken,
  ProviderFactoryToken,
  ProviderIdentifier,
  ProviderOptions,
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
    return this.moduleNaked.container;
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
  bindToContainer<T>(provider: DependencyProvider<T>, defaultScope: InjectionScope): boolean {
    if (ProviderTokenHelpers.isProviderIdentifier(provider)) {
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

  private bindSelfTokenToContainer<T>(provider: ProviderIdentifier<T>, defaultScope: InjectionScope): boolean {
    this.setBindingScope(
      provider,
      this.container.bind(ProviderTokenHelpers.toServiceIdentifier(provider)).toSelf(),
      defaultScope
    );

    return this.moduleNaked.__isCurrentBound(provider);
  }

  private bindClassTokenToContainer<T>(provider: ProviderClassToken<T>, defaultScope: InjectionScope): boolean {
    this.setBindingOnEvent(
      provider,
      this.setWhenBinding(
        provider,
        this.setBindingScope(
          provider,
          this.container.bind(ProviderTokenHelpers.toServiceIdentifier(provider)).to(provider.useClass),
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
        this.container.bind(ProviderTokenHelpers.toServiceIdentifier(provider)).toConstantValue(provider.useValue)
      )
    );

    return this.moduleNaked.__isCurrentBound(provider);
  }

  private bindFactoryTokenToContainer<T>(provider: ProviderFactoryToken<T>, defaultScope: InjectionScope): boolean {
    this.setBindingOnEvent(
      provider,
      this.setWhenBinding(
        provider,
        this.setBindingScope(
          provider,
          this.container
            .bind(ProviderTokenHelpers.toServiceIdentifier(provider))
            .toResolvedValue(provider.useFactory, ProviderTokenHelpers.toServiceIdentifiers(provider.inject ?? [])),
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
    defaultScope: InjectionScope
  ): BindWhenOnFluentSyntax<T> {
    // A constant token will always be a singleton.
    if (ProviderTokenHelpers.isValueToken(provider)) return binding;

    const injectionScope = ProviderTokenHelpers.getInjectionScopeByPriority(provider, defaultScope);

    switch (injectionScope) {
      case InjectionScope.Singleton:
        return binding.inSingletonScope();
      case InjectionScope.Transient:
        return binding.inTransientScope();
      case InjectionScope.Request:
        return binding.inRequestScope();
    }
  }

  /** Sets the `when` clause of a bound {@link provider}. */
  private setWhenBinding<T>(
    provider: ProviderToken<T>,
    binding: BindWhenOnFluentSyntax<T>
  ): BindOnFluentSyntax<unknown> {
    // A `ProviderIdentifier` has no options.
    if (ProviderTokenHelpers.isProviderIdentifier(provider)) return binding;

    const when = (provider as ProviderOptions<unknown>).when;
    if (!when) return binding;

    return binding.when(when);
  }

  /** Sets the `activation` and `deactivation` events of a bound {@link provider}. */
  private setBindingOnEvent(provider: ProviderToken, binding: BindOnFluentSyntax<any>): void {
    // A `ProviderIdentifier` has no options.
    if (ProviderTokenHelpers.isProviderIdentifier(provider)) return;

    const opts = provider as ProviderOptions<unknown>;

    if (opts.onEvent?.activation) {
      binding.onActivation(opts.onEvent.activation);
    }

    if (opts.onEvent?.deactivation) {
      binding.onDeactivation(opts.onEvent.deactivation);
    }
  }
}
