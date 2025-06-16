import { Container, type BindInWhenOnFluentSyntax, type BindWhenOnFluentSyntax } from 'inversify';

import { InjectionScope, MiddlewareType } from '../../enums';
import { InjectionProviderModuleMissingProviderError, InjectionProviderModuleUnknownProviderError } from '../../errors';
import { injectionScopeToBindingScope, isPlainObject, ProviderTokenHelpers } from '../../helpers';
import type {
  DependencyProvider,
  ProviderClassToken,
  ProviderFactoryToken,
  ProviderOptions,
  ProviderToken,
  ProviderValueToken,
} from '../../types';
import { AppModuleInversifyContainer } from '../app-module/container';
import type {
  ProviderModuleGetManyParam,
  ProviderModuleGetManyReturn,
  ProviderModuleGetReturn,
} from '../provider-module';
import { ProviderModule } from '../provider-module/provider-module';

export class ModuleContainer {
  readonly container: Container;
  private readonly providerModule: ProviderModule;

  constructor(providerModule: ProviderModule, inversifyParentContainer?: Container) {
    this.providerModule = providerModule;

    const { defaultScope = InjectionScope.Singleton } = providerModule.options;

    this.container =
      providerModule.id === 'AppModule'
        ? AppModuleInversifyContainer
        : new Container({
            parent: inversifyParentContainer ?? this.providerModule.appModuleRef.moduleContainer.container,
            defaultScope: injectionScopeToBindingScope(defaultScope),
          });

    this.providerModule.options.providers?.forEach((x) => this.bindToContainer(x));
  }

  get<T, IsOptional extends boolean | undefined = undefined, AsList extends boolean | undefined = undefined>(
    provider: ProviderToken<T>,
    isOptional?: IsOptional,
    asList?: AsList
  ): ProviderModuleGetReturn<T, IsOptional, AsList> {
    const middlewareResult = this.providerModule.middlewaresManager.applyMiddlewares<any>(
      MiddlewareType.BeforeGet,
      this.getProvider(provider, asList),
      provider,
      this.getProvider.bind(this)
    );
    if (middlewareResult || middlewareResult === null) return middlewareResult;

    if (isOptional) return undefined as any;

    throw new InjectionProviderModuleMissingProviderError(this.providerModule, provider);
  }

  getMany<D extends (ProviderModuleGetManyParam<any> | ProviderToken)[]>(
    ...deps: D | unknown[]
  ): ProviderModuleGetManyReturn<D> {
    return (deps as D).map((dep) => {
      const withOptions = isPlainObject(dep) && 'provider' in dep;

      return this.get(
        withOptions ? dep.provider : dep,
        withOptions ? dep.isOptional : false,
        withOptions ? dep.asList : false
      );
    }) as any;
  }

  bindToContainer<T>(provider: DependencyProvider<T>): void {
    const providerIdentifier = ProviderTokenHelpers.toProviderIdentifier(provider);

    const binders: Array<{
      providerTypeMatches: (p: any) => boolean;
      bind: () => BindInWhenOnFluentSyntax<any> | BindWhenOnFluentSyntax<any>;
    }> = [
      {
        providerTypeMatches: ProviderTokenHelpers.isProviderIdentifier,
        bind: () => this.container.bind(providerIdentifier).toSelf(),
      },
      {
        providerTypeMatches: ProviderTokenHelpers.isClassToken,
        bind: () => this.container.bind(providerIdentifier).to((provider as ProviderClassToken<T>).useClass),
      },
      {
        providerTypeMatches: ProviderTokenHelpers.isValueToken,
        bind: () =>
          this.container.bind(providerIdentifier).toConstantValue((provider as ProviderValueToken<T>).useValue),
      },
      {
        providerTypeMatches: ProviderTokenHelpers.isFactoryToken,
        bind: () =>
          this.container.bind(providerIdentifier).toResolvedValue(() => {
            const p = provider as ProviderFactoryToken<T>;

            const dependencies = this.providerModule.getMany(...(p.inject ?? []));

            return p.useFactory(...dependencies);
          }),
      },
    ];

    const { bind } = binders.find(({ providerTypeMatches }) => providerTypeMatches(provider)) ?? {};
    if (!bind) {
      throw new InjectionProviderModuleUnknownProviderError(this.providerModule, provider);
    }

    const isProviderIdentifier = ProviderTokenHelpers.isProviderIdentifier(provider);

    // Create initial inversify binding fluent syntax object
    let binding = bind();

    // A `ValueToken` is always a constant, so there's no point in binding a specific scope.
    // And if the provider is a simple `ProviderIdentifier` then it means that it'll use the container default scope.
    if (!ProviderTokenHelpers.isValueToken(provider) && !isProviderIdentifier) {
      binding = this.setBindingScope(provider, binding as BindInWhenOnFluentSyntax<any>);
    }

    // If it is a simple `ProviderIdentifier` there's nothing more we can do
    // as it is not an object which contains the `ProviderOptions` properties.
    if (isProviderIdentifier) return;

    const opts = provider as ProviderOptions<unknown>;

    if (opts.when) {
      binding.when(opts.when) as any;
    }
  }

  setBindingScope<T>(provider: ProviderToken<T>, binding: BindInWhenOnFluentSyntax<T>): BindWhenOnFluentSyntax<T> {
    const injectionScope = ProviderTokenHelpers.getInjectionScopeByPriority(
      provider,
      this.providerModule.options.defaultScope ?? InjectionScope.Singleton
    );

    switch (injectionScope) {
      case InjectionScope.Singleton:
        return binding.inSingletonScope();
      case InjectionScope.Transient:
        return binding.inTransientScope();
      case InjectionScope.Request:
        return binding.inRequestScope();
    }
  }

  dispose(): void {
    //@ts-expect-error Read-only property.
    this.providerModule = null;
    //@ts-expect-error Read-only property.
    this.container = null;
  }

  private getProvider<T>(provider: ProviderToken<T>, asList?: boolean): T | T[] | void {
    const providerIdentifier = ProviderTokenHelpers.toProviderIdentifier(provider);

    if (asList) {
      return this.container.getAll(providerIdentifier, { optional: true });
    }

    return this.container.get(providerIdentifier, { optional: true });
  }
}
