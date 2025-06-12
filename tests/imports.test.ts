import { Injectable, InjectionScope, ProviderModule, ProviderModuleDefinition } from '../src';
import { EmptyService, EmptyService2, EmptyService3, TestAppModule } from './setup';

describe('Imports', () => {
  afterEach(() => jest.clearAllMocks());

  it('should fail to get a dependency from an imported module with no exports', () => {
    const m = new ProviderModule({
      identifier: 'm',
      providers: [EmptyService],
    });

    const mm = new ProviderModule({
      identifier: 'mm',
      imports: [m],
    });

    expect(() => mm.get(EmptyService)).toThrow();
  });

  it('should succeed to get a dependency from an imported module with exports', () => {
    const m = new ProviderModule({
      identifier: 'm',
      providers: [EmptyService],
      exports: [EmptyService],
    });

    const mm = new ProviderModule({
      identifier: 'mm',
      imports: [m],
    });

    expect(() => mm.get(EmptyService)).not.toThrow();
  });

  it('should successfully import multiple nested modules', () => {
    const TRANSIENT_EMPTY_SERVICE = {
      provide: EmptyService,
      useClass: EmptyService,
      scope: InjectionScope.Transient,
    };

    const m = new ProviderModule({
      identifier: 'm',
      providers: [TRANSIENT_EMPTY_SERVICE],
      exports: [TRANSIENT_EMPTY_SERVICE],
    });

    const mm = new ProviderModule({
      identifier: 'mm',
      imports: [m],
      exports: [m],
    });

    const mmm = new ProviderModule({
      identifier: 'mmm',
      imports: [mm],
    });

    expect(mmm.get(EmptyService)).toBeInstanceOf(EmptyService);
    expect(mmm.get(EmptyService)).not.toBe(mm.get(EmptyService));
    expect(mm.get(EmptyService)).not.toBe(m.get(EmptyService));
  });

  it('should automatically import into the `AppModule` a module marked as global when imported into a `scoped` module', () => {
    @Injectable()
    class ForwardedService {}

    const md = new ProviderModuleDefinition({
      identifier: 'md',
      markAsGlobal: true,
      providers: [ForwardedService],
      exports: [ForwardedService],
    });

    const m = new ProviderModule({
      identifier: 'm',
      // As we are importing the module definition marked as global,
      // this scoped provider module will take care of importing it into the AppModule rather than into itself.
      imports: [md],
    }).toNaked();

    expect(m.__isCurrentBound(ForwardedService)).toBe(false);
    expect(TestAppModule.get(ForwardedService)).toBeInstanceOf(ForwardedService);
    expect(TestAppModule.get(ForwardedService)).toBe(m.get(ForwardedService));
  });

  describe('Lazy', () => {
    describe('Imports', () => {
      it('should succeed', () => {
        const m = new ProviderModule({
          identifier: 'm',
          providers: [EmptyService],
          exports: [EmptyService],
        }).toNaked();

        const mm = new ProviderModule({
          identifier: 'mm',
          providers: [EmptyService2],
          exports: [EmptyService2],
        });

        const mmm = new ProviderModule({
          identifier: 'mmm',
          providers: [EmptyService3],
          exports: [EmptyService3],
        });

        m.lazyImport(mm, mmm);

        expect(m.__isCurrentBound(EmptyService2)).toBe(true);
        expect(m.get(EmptyService2)).toBeInstanceOf(EmptyService2);

        expect(m.__isCurrentBound(EmptyService3)).toBe(true);
        expect(m.get(EmptyService3)).toBeInstanceOf(EmptyService3);
      });
    });

    describe('Exports', () => {
      const lm = new ProviderModule({
        identifier: 'lm',
        providers: [EmptyService, EmptyService2],
        exports: [
          EmptyService,
          (importerModule) => {
            // The `mm` module will not be able to import the `EmptyService2` from this module
            if (importerModule.toString() === 'mm') return;

            return EmptyService2;
          },
        ],
      });

      it('should import a lazy exported provider/module', () => {
        const m = new ProviderModule({
          identifier: 'm',
          imports: [lm],
        });

        const mm = new ProviderModule({
          identifier: 'mm',
          imports: [lm],
        });

        expect(m.get(EmptyService2)).toBeInstanceOf(EmptyService2);
        expect(() => mm.get(EmptyService2)).toThrow();
      });

      it('should import a nested lazy exported provider/module', () => {
        const m = new ProviderModule({
          identifier: 'm',
          imports: [lm],
        });

        const mm = new ProviderModule({
          identifier: 'mm',
          imports: [m],
        });

        expect(m.get(EmptyService2)).toBeInstanceOf(EmptyService2);
        expect(() => mm.get(EmptyService2)).toThrow();
      });
    });
  });
});
