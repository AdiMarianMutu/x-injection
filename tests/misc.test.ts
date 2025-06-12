import { Container } from 'inversify';

import {
  InjectionProviderModuleMissingIdentifierError,
  ProviderClassToken,
  ProviderFactoryToken,
  ProviderModule,
  ProviderModuleHelpers,
  ProviderValueToken,
} from '../src';
import { EmptyService, GlobalService, TestAppModule } from './setup';

describe('Misc', () => {
  afterEach(() => jest.clearAllMocks());

  it('should throw if no `identifier` provided during initialization', () => {
    expect(() => new ProviderModule({} as any)).toThrow(InjectionProviderModuleMissingIdentifierError);
  });

  it('should be able to use `getMany`', () => {
    const [globalService, constant] = TestAppModule.getMany(GlobalService, 'CONSTANT');

    expect(globalService).toBeInstanceOf(GlobalService);
    expect(constant).toBe('22.03.2013');
  });

  describe('Optional Param', () => {
    it('`get` with optional param', () => {
      expect(() => TestAppModule.get('UNEXISTENT_DEP', true)).not.toThrow();
    });

    it('`getMany` with optional param', () => {
      expect(() => TestAppModule.getMany({ provider: 'UNEXISTENT_DEP', isOptional: true })).not.toThrow();
    });
  });

  describe('ProviderToken', () => {
    const m = new ProviderModule({
      identifier: 'm',
    }).toNaked();

    beforeEach(async () => {
      await m.dispose();
    });

    it('should resolve a `ProviderClassToken`', () => {
      const PROVIDER: ProviderClassToken<EmptyService> = {
        provide: 'CLASS_PROVIDER',
        useClass: EmptyService,
      };

      m._internalInit(
        ProviderModuleHelpers.buildInternalConstructorParams({
          identifier: 'm',
          providers: [PROVIDER],
        })
      );

      expect(m.get(PROVIDER.provide)).toBeInstanceOf(EmptyService);
    });

    it('should resolve a `ProviderValueToken`', () => {
      const PROVIDER: ProviderValueToken<EmptyService> = {
        provide: 'VALUE_PROVIDER',
        useValue: new EmptyService(),
      };

      m._internalInit(
        ProviderModuleHelpers.buildInternalConstructorParams({
          identifier: 'm',
          providers: [PROVIDER],
        })
      );

      expect(m.get(PROVIDER.provide)).toBeInstanceOf(EmptyService);
    });

    it('should resolve a `ProviderFactoryToken`', () => {
      const PROVIDER: ProviderFactoryToken<EmptyService> = {
        provide: 'FACTORY_PROVIDER',
        useFactory: () => new EmptyService(),
      };

      m._internalInit(
        ProviderModuleHelpers.buildInternalConstructorParams({
          identifier: 'm',
          providers: [PROVIDER],
        })
      );

      expect(m.get(PROVIDER.provide)).toBeInstanceOf(EmptyService);
    });

    it('should resolve a `ProviderFactoryToken` with `inject` param', () => {
      const PROVIDER: ProviderFactoryToken<{
        globalService: GlobalService;
        constant: string;
        emptyService: EmptyService;
      }> = {
        provide: 'FACTORY_WITH_INJECT_PROVIDER',
        useFactory: (globalService: GlobalService, constant: string) => {
          return {
            globalService,
            constant,
            emptyService: new EmptyService(),
          };
        },
        inject: [GlobalService, 'CONSTANT'],
      };

      m._internalInit(
        ProviderModuleHelpers.buildInternalConstructorParams({
          identifier: 'm',
          providers: [PROVIDER],
        })
      );

      const d = m.get(PROVIDER.provide);

      expect(d.globalService).toBeInstanceOf(GlobalService);
      expect(d.constant).toBe('22.03.2013');
      expect(d.emptyService).toBeInstanceOf(EmptyService);
    });
  });

  describe('InversifyJS Container', () => {
    it('should initialize with user provided `Container`', () => {
      const container = new Container();
      const m = new ProviderModule(
        ProviderModuleHelpers.buildInternalConstructorParams({ identifier: 'm', container: () => container })
      ).toNaked();

      expect(container).toBe(m.container);
    });

    it('should overwrite the internal container by using the `overwriteContainer` method', () => {
      const container = new Container();
      const m = new ProviderModule({ identifier: 'm' }).toNaked();

      m._overwriteContainer(() => container);

      expect(container).toBe(m.container);
    });
  });
});
