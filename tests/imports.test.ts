import { InjectionScope, ProviderModule } from '../src';
import { EmptyService, EmptyService2 } from './setup';

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

    expect(mmm.get(EmptyService) instanceof EmptyService).toBe(true);
    expect(mmm.get(EmptyService)).not.toBe(mm.get(EmptyService));
    expect(mm.get(EmptyService)).not.toBe(m.get(EmptyService));
  });

  describe('Lazy', () => {
    describe('Imports', () => {
      const m = new ProviderModule({
        identifier: 'm',
        providers: [EmptyService],
        exports: [EmptyService],
      });

      it('should succeed', () => {
        const mm = new ProviderModule({
          identifier: 'mm',
          imports: [() => m],
        }).toNaked();

        expect(mm.__isCurrentBound(EmptyService)).toBe(true);
      });

      it('should import nested lazy exported module', () => {
        const mm = new ProviderModule({
          identifier: 'mm',
          imports: [() => m],
          exports: [
            (importerModule) => {
              if (importerModule.toString() === 'mmm') return m;
            },
          ],
        }).toNaked();

        const mmm = new ProviderModule({
          identifier: 'mmm',
          imports: [() => mm],
        }).toNaked();

        const mmmm = new ProviderModule({
          identifier: 'mmmm',
          imports: [() => mmm],
        }).toNaked();

        expect(mmm.__isCurrentBound(EmptyService)).toBe(true);
        expect(mmmm.__isCurrentBound(EmptyService)).toBe(false);
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

        expect(m.get(EmptyService2) instanceof EmptyService2).toBe(true);
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

        expect(m.get(EmptyService2) instanceof EmptyService2).toBe(true);
        expect(() => mm.get(EmptyService2)).toThrow();
      });
    });
  });
});
