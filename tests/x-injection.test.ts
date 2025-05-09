import { Container } from 'inversify';

import {
  GlobalAppModule,
  InjectionScope,
  ProviderModule,
  ProviderModuleHelpers,
  ProviderModuleOptions,
  XInjectionError,
} from '../src';
import {
  XInjectionDynamicExportsOutOfRange,
  XInjectionProviderModuleDisposedError,
  XInjectionProviderModuleMissingIdentifierError,
} from '../src/errors';
import { XInjectionProviderModuleError } from '../src/errors/provider-module.error';
import {
  AppModule,
  ClassProviderModule,
  ComplexFactoryProviderModule,
  EmptyModule,
  EmptyModule_ImportingModuleWithDynamicExports_NoExports,
  EmptyService,
  FactoryProviderModule,
  ImportedModuleWithExports_WithExports,
  ImportedModuleWithNoExports_NoExports,
  ImportedModuleWithNoExports_WithExports,
  LoggerService,
  NestedImportedModule_WithExportedModules,
  NestedImportedModuleNoExports_WithExportedModules,
  NestedImportedModuleNoExports_WithPrivateExportedModules,
  PaymentService,
  RequestModule_NoExports,
  RequestService,
  SingletonDecoratedService,
  SingletonModule_NoExports,
  SingletonModule_WithExports,
  TransientDecoratedService,
  TransientModule_ImportsSingletonModule_WithExports,
  TransientModule_NoExports,
  UserService,
  ValueProviderModule,
} from './setup';

describe('Core', () => {
  afterEach(() => jest.clearAllMocks());

  it('should resolve a singleton dependency', () => {
    // Scenario where the dep. should be available at least in the module context.
    expect(SingletonModule_NoExports.get(EmptyService) instanceof EmptyService).toBe(true);
  });

  it('should fail to resolve a dependency from an imported module with no exports', () => {
    // Scenario where a module without defined exports imports another module without defined exports.
    expect(() => ImportedModuleWithNoExports_NoExports.get(EmptyService)).toThrow();
    // Scenario where a module with defined exports imports another module having defined imports but without exports.
    expect(() => ImportedModuleWithNoExports_WithExports.get(EmptyService)).toThrow();
    // Scenario where a module without defined exports imports a nested module which does not re-export an exportable module.
    expect(() => NestedImportedModuleNoExports_WithPrivateExportedModules.get(EmptyService)).toThrow();
  });

  it('should resolve a dependency from an imported module with exports', () => {
    // Scenario where a module imports a module with defined exports and re-exports it.
    expect(ImportedModuleWithExports_WithExports.get(EmptyService) instanceof EmptyService).toBe(true);
    // Scenario where a module imports a nested module with defined exports and re-exports it.
    expect(NestedImportedModule_WithExportedModules.get(EmptyService) instanceof EmptyService).toBe(true);
    // Scenario where a mdule imports a nested module with defined exports and does not re-export it.
    expect(NestedImportedModuleNoExports_WithExportedModules.get(EmptyService) instanceof EmptyService).toBe(true);
  });

  describe('InjectionScope', () => {
    afterEach(() => jest.clearAllMocks());

    it('should correctly use the `scope` declared into the `ProviderToken` rather than the default one from the module', () => {
      const m = new ProviderModule({
        identifier: Symbol(0),
        defaultScope: InjectionScope.Singleton,
        providers: [
          {
            provide: EmptyService,
            useClass: EmptyService,
            scope: InjectionScope.Transient,
          },
        ],
      });

      expect(m.get(EmptyService)).not.toBe(m.get(EmptyService));
    });

    describe('Singleton', () => {
      it('should be the same instance inherited from AppModule', () => {
        const x = SingletonModule_NoExports.get(LoggerService);
        const y = SingletonModule_NoExports.get(LoggerService);

        expect(x).toBe(y);
      });
    });

    describe('Transient', () => {
      it('should be different instances', () => {
        const x = TransientModule_NoExports.get(EmptyService);
        const y = TransientModule_NoExports.get(EmptyService);

        expect(x).not.toBe(y);
      });
    });

    describe('Request', () => {
      afterEach(() => jest.clearAllMocks());

      it('should be the same instance in the `RequestService`', () => {
        const requestService = RequestModule_NoExports.get(RequestService);

        expect(requestService.firstEmptyService).toBe(requestService.secondEmptyService);
      });

      it('should be different instances when resolved outside of the `RequestService`', () => {
        const x = RequestModule_NoExports.get(EmptyService);
        const y = RequestModule_NoExports.get(EmptyService);

        expect(x).not.toBe(y);
      });
    });

    describe('Imported modules with mixed injection scopes', () => {
      afterEach(() => jest.clearAllMocks());

      it('should use the injection scope of the imported modules', () => {
        const fromImportedSingleton_a = TransientModule_ImportsSingletonModule_WithExports.get(EmptyService);
        const fromImportedSingleton_b = TransientModule_ImportsSingletonModule_WithExports.get(EmptyService);
        const fromOriginalSingleton = SingletonModule_WithExports.get(EmptyService);
        const fromOwnModule = TransientModule_ImportsSingletonModule_WithExports.get('TRANSIENT_EMPTY_SERVICE');

        expect(fromImportedSingleton_a).toBe(fromImportedSingleton_b);
        expect(fromImportedSingleton_a).toBe(fromOriginalSingleton);
        expect(fromOwnModule).not.toBe(fromImportedSingleton_a);
      });
    });

    describe('Priority Order', () => {
      afterEach(() => jest.clearAllMocks());

      it('should use the scope from the `ProviderToken.scope`', () => {
        const m = new ProviderModule({
          identifier: Symbol(0),
          defaultScope: InjectionScope.Singleton,
          providers: [
            {
              provide: SingletonDecoratedService,
              useClass: SingletonDecoratedService,
              scope: InjectionScope.Transient,
            },
          ],
        });

        expect(m.get(SingletonDecoratedService)).not.toBe(m.get(SingletonDecoratedService));
      });

      it('should use the scope from the `Injectable` decorator even if the module default scope is different', () => {
        const m = new ProviderModule({
          identifier: Symbol(0),
          defaultScope: InjectionScope.Singleton,
          providers: [TransientDecoratedService],
        });

        expect(m.get(TransientDecoratedService)).not.toBe(m.get(TransientDecoratedService));
      });

      it('should use the scope from the `ProviderModule.defaultScope`', () => {
        const m = new ProviderModule({
          identifier: Symbol(0),
          defaultScope: InjectionScope.Transient,
          providers: [EmptyService],
        });

        expect(m.get(EmptyService)).not.toBe(m.get(EmptyService));
      });
    });
  });

  describe('ProviderToken', () => {
    afterEach(() => jest.clearAllMocks());

    it('should fail to resolve a dependency with wrong `provide`', () => {
      expect(() => ClassProviderModule.get(EmptyService)).toThrow();
    });

    it('should resolve a `ProviderClassToken`', () => {
      expect(ClassProviderModule.get('CLASS_PROVIDER') instanceof EmptyService).toBe(true);
    });

    it('should resolve a `ProviderValueToken`', () => {
      expect(ValueProviderModule.get('VALUE_PROVIDER') instanceof EmptyService).toBe(true);
    });

    it('should resolve a `ProviderFactoryToken`', () => {
      expect(FactoryProviderModule.get('FACTORY_PROVIDER') instanceof EmptyService).toBe(true);
    });

    it('should resolve a complex (self injection) `ProviderFactoryToken`', () => {
      const { loggerService, userService, emptyService } = ComplexFactoryProviderModule.get<{
        loggerService: LoggerService;
        userService: UserService;
        emptyService: EmptyService;
      }>('COMPLEX_FACTORY_PROVIDER');

      expect(loggerService instanceof LoggerService).toBe(true);
      expect(userService instanceof UserService).toBe(true);
      expect(emptyService instanceof EmptyService).toBe(true);
    });
  });

  describe('Events', () => {
    afterEach(() => jest.clearAllMocks());

    it('should invoke the `activation` event', () => {
      const cb = jest.fn();

      TransientModule_NoExports.onActivationEvent(EmptyService, (ctx) => {
        cb();

        return new EmptyService();
      });

      TransientModule_NoExports.get(EmptyService);

      expect(cb).toHaveBeenCalled();
    });

    it('should invoke the `deactivation` event', async () => {
      const cb = jest.fn();
      SingletonModule_NoExports.__takeSnapshot();

      SingletonModule_NoExports.onDeactivationEvent(EmptyService, cb);

      await SingletonModule_NoExports.__unbind(EmptyService);

      SingletonModule_NoExports.__restoreSnapshot();

      expect(cb).toHaveBeenCalled();
    });

    it('should invoke all onBind registered side effects', () => {
      const cb = jest.fn();

      EmptyModule._onBind(EmptyService, cb);

      EmptyModule.__bind(EmptyService);

      expect(cb).toHaveBeenCalled();
    });

    it('should invoke all onRebind registered side effects', async () => {
      const cb = jest.fn();

      EmptyModule._onRebind(EmptyService, cb);

      await EmptyModule.__rebind(EmptyService);

      expect(cb).toHaveBeenCalled();
    });

    it('should invoke all onUnbind registered side effects', async () => {
      const cb = jest.fn();

      EmptyModule._onUnbind(EmptyService, cb);

      await EmptyModule.__unbind(EmptyService);

      expect(cb).toHaveBeenCalled();
    });

    it('should invoke all onUnbind registered side effects when `unbindAll`', async () => {
      const m = new ProviderModule({
        identifier: Symbol(0),
        providers: [EmptyService, PaymentService],
      }).toNaked();
      const cb = jest.fn();

      m._onUnbind(EmptyService, cb);
      m._onUnbind(PaymentService, cb);

      await m.__unbindAll();

      expect(cb).toHaveBeenCalledTimes(2);
    });
  });
});

describe('AppModule', () => {
  afterEach(() => jest.clearAllMocks());

  it('should have a bound container', () => {
    expect(AppModule.container).toBeDefined();
    expect(AppModule.container instanceof Container).toBe(true);
  });

  it('should have the `LoggerService` bound', () => {
    expect(AppModule.__isCurrentBound(LoggerService)).toBe(true);
  });

  it('should have the `UserService` bound', () => {
    expect(AppModule.__isCurrentBound(LoggerService)).toBe(true);
  });

  it('should throw error if `register` is invoked more than once per app life-cycle', () => {
    expect(() => AppModule.register({})).toThrow(XInjectionError);
  });

  it('should be able to re-invoke `register` after a dispose process', async () => {
    let onDisposeCbInvoked = false;
    const MODULE_OPTIONS = ProviderModuleHelpers.buildInternalConstructorParams({
      identifier: Symbol(0),
      container: () => new Container(),
      onDispose: async () => {
        onDisposeCbInvoked = true;
      },
    });

    const m = new GlobalAppModule().register<true>(MODULE_OPTIONS);

    await m._dispose();

    expect(onDisposeCbInvoked).toBe(true);
    expect((m as any)['isLoaded']).toBe(false);

    (m as unknown as GlobalAppModule).register(MODULE_OPTIONS);

    expect((m as any)['isLoaded']).toBe(true);
  });

  it('should correctly invoke the `LoggerService.log` method', () => {
    const loggerService = AppModule.get(LoggerService);
    const logSpy = jest.spyOn(console, 'log');
    const logMessage = '04/05/2025-sad';

    loggerService.log(logMessage);

    expect(logSpy).toHaveBeenCalledWith(`[Logger]: ${logMessage}`);
  });

  describe('Inheritance', () => {
    afterEach(() => jest.clearAllMocks());

    it('should resolve the `LoggerService` from the `AppModule`', () => {
      expect(EmptyModule.get(LoggerService) instanceof LoggerService).toBe(true);
    });

    it('should be the same `LoggerService` instance as the one from the `AppModule`', () => {
      expect(EmptyModule.get(LoggerService)).toBe(AppModule.get(LoggerService));
    });

    it('should globally inherit nested providers from imported modules from `AppModule`', () => {
      const m0 = new ProviderModule({
        identifier: Symbol(0),
        providers: [TransientDecoratedService],
        exports: [TransientDecoratedService],
      });
      const m1 = new ProviderModule({ identifier: Symbol(1), imports: [m0], exports: [m0] });
      const m2 = new ProviderModule({ identifier: Symbol(2), imports: [m1], exports: [m1] });
      const m3 = new ProviderModule({ identifier: Symbol(3), imports: [m2], exports: [m2] });
      const m4 = new ProviderModule({ identifier: Symbol(4), imports: [m3], exports: [m3] });

      const am = new GlobalAppModule().register<true>({
        imports: [m4],
      });

      const m5 = new ProviderModule({ identifier: Symbol(5) });

      expect(m5.get(TransientDecoratedService) instanceof TransientDecoratedService).toBe(true);
      expect(m5.get(TransientDecoratedService)).not.toBe(m5.get(TransientDecoratedService));
    });
  });
});

describe('ProviderModule', () => {
  afterEach(() => jest.clearAllMocks());

  it('should throw if no identifier provided', () => {
    expect(() => new ProviderModule({} as any)).toThrow(XInjectionProviderModuleMissingIdentifierError);
  });

  it('should correctly initialize with custom `Container`', () => {
    const container = new Container();
    const m = new ProviderModule(
      ProviderModuleHelpers.buildInternalConstructorParams({ identifier: Symbol(0), container: () => container })
    ).toNaked();

    expect(container).toBe(m.container);
  });

  it('should correctly overwrite internal container `Container` with `_overwriteContainer` method', () => {
    const container = new Container();
    const m = new ProviderModule({ identifier: Symbol(0) }).toNaked();
    m._overwriteContainer(() => container);

    expect(container).toBe(m.container);
  });

  it('should resolve many at once', () => {
    const [loggerService, userService] = AppModule.getMany<[typeof LoggerService, typeof UserService]>(
      LoggerService,
      'USER_SERVICE'
    );

    expect(loggerService instanceof LoggerService).toBe(true);
    expect(userService instanceof UserService).toBe(true);
  });

  it('should resolve many at once with optional provider', () => {
    const [missingService] = AppModule.getMany({ provider: 'MISSING_SERVICE', isOptional: true });

    expect(missingService).toBe(undefined);
  });

  it('should throw when a module tries to import the `AppModule`', () => {
    expect(() => new ProviderModule({ identifier: Symbol(0), imports: [AppModule] })).toThrow(
      XInjectionProviderModuleError
    );
  });

  it('should correctly import exported providers from a module using dynamic exports', () => {
    expect(EmptyModule_ImportingModuleWithDynamicExports_NoExports.get(EmptyService) instanceof EmptyService).toBe(
      true
    );

    // The `PaymentService` provider is being not dynamically exported.
    expect(() => EmptyModule_ImportingModuleWithDynamicExports_NoExports.get(PaymentService)).toThrow();
  });

  it('should throw when importing a module having a dynamic exports with providers/modules out of the declared range of the static exports', () => {
    const m = new ProviderModule({
      identifier: Symbol(0),
      providers: [EmptyService],
      exports: [EmptyService],
      dynamicExports: () => {
        return [EmptyService, EmptyService];
      },
    });

    expect(() => new ProviderModule({ identifier: Symbol(0), imports: [m] })).toThrow(
      XInjectionDynamicExportsOutOfRange
    );
  });

  describe('Dispose Event', () => {
    afterEach(() => jest.clearAllMocks());

    const MODULE_OPTIONS: ProviderModuleOptions = {
      identifier: Symbol(0),
      providers: [{ provide: 'FAKE_SERVICE', useValue: 0 }],
      onDispose: async (module) => {
        expect(module.toNaked().container instanceof Container).toBe(true);
      },
    };

    it('should correctly dispose the module', async () => {
      let onDisposeCbInvoked = false;

      const m = new ProviderModule({
        ...MODULE_OPTIONS,
        onDispose: async (module) => {
          onDisposeCbInvoked = true;

          MODULE_OPTIONS.onDispose!(module);
        },
      }).toNaked();

      expect(m.get('FAKE_SERVICE')).toBe(0);

      await m._dispose();

      expect(onDisposeCbInvoked).toBe(true);
      expect(m.container).toBe(null);
      expect(() => m._getImportedModules()).toThrow(XInjectionProviderModuleDisposedError);
      expect(() => m._getProviders()).toThrow(XInjectionProviderModuleDisposedError);
      expect(() => m._getExportableModulesAndProviders()).toThrow(XInjectionProviderModuleDisposedError);
      expect(m.dynamicExports).toBe(null);
    });

    it('should be able to re-initialize it after the `_dispose` method', async () => {
      const m = new ProviderModule(MODULE_OPTIONS).toNaked();
      await m._dispose();

      m._lazyInit(MODULE_OPTIONS);

      expect(m.__isCurrentBound('FAKE_SERVICE')).toBe(true);
      expect(Array.isArray(m._getProviders())).toBe(true);
    });
  });
});
