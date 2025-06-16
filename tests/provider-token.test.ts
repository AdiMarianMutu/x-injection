import {
  Injectable,
  InjectionProviderModuleMissingProviderError,
  InjectionProviderModuleUnknownProviderError,
  ProviderClassToken,
  ProviderFactoryToken,
  ProviderModule,
  ProviderValueToken,
} from '../src';
import { EmptyService, EmptyService2, GlobalService } from './setup';

describe('ProviderToken', () => {
  const m0 = new ProviderModule({
    id: 'm0',
  });

  beforeEach(async () => {
    await m0.reset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if an unknown `ProviderToken` is supplied', () => {
    const UNKNOWN_PROVIDER = { provide: [0], b: 0 } as any;

    expect(() =>
      ProviderModule.create({
        id: 'm0',
        providers: [UNKNOWN_PROVIDER],
      })
    ).toThrow(InjectionProviderModuleUnknownProviderError);

    expect(() => m0.update.addProvider(UNKNOWN_PROVIDER)).toThrow(InjectionProviderModuleUnknownProviderError);
  });

  it('should resolve a `ProviderClassToken`', () => {
    const PROVIDER: ProviderClassToken<EmptyService> = {
      provide: 'CLASS_PROVIDER',
      useClass: EmptyService,
    };

    m0.update.addProvider(PROVIDER);

    expect(m0.get(PROVIDER)).toBeInstanceOf(EmptyService);

    m0.update.removeProvider(PROVIDER);
  });

  it('should resolve a `ProviderValueToken`', () => {
    const PROVIDER: ProviderValueToken<EmptyService> = {
      provide: 'VALUE_PROVIDER',
      useValue: new EmptyService(),
    };

    m0.update.addProvider(PROVIDER);

    expect(m0.get(PROVIDER)).toBeInstanceOf(EmptyService);

    m0.update.removeProvider(PROVIDER);
  });

  it('should resolve a `ProviderFactoryToken`', () => {
    const PROVIDER: ProviderFactoryToken<EmptyService> = {
      provide: 'FACTORY_PROVIDER',
      useFactory: () => new EmptyService(),
    };

    m0.update.addProvider(PROVIDER);

    expect(m0.get(PROVIDER)).toBeInstanceOf(EmptyService);

    m0.update.removeProvider(PROVIDER);
  });

  it('should resolve a `ProviderFactoryToken` with `inject` param', () => {
    const PROVIDER: ProviderFactoryToken<{
      globalService: GlobalService;
      constant: string;
      emptyService: EmptyService;
    }> = {
      provide: 'FACTORY_PROVIDER_RESOLVING_FROM_APP_MODULE',
      useFactory: (globalService: GlobalService, constant: string) => {
        return {
          globalService,
          constant,
          emptyService: new EmptyService(),
        };
      },
      inject: [GlobalService, 'CONSTANT'],
    };

    m0.update.addProvider(PROVIDER);

    @Injectable()
    class M1Service {}

    const m1 = ProviderModule.create({
      id: 'm1',
      providers: [
        M1Service,
        {
          provide: 'FACTORY_PROVIDER_RESOLVING_FROM_OWN_MODULE',
          useFactory: (m1Service: M1Service) => {
            return m1Service;
          },
          inject: [M1Service],
        },
      ],
    });

    expect(m1.get('FACTORY_PROVIDER_RESOLVING_FROM_OWN_MODULE')).toBeInstanceOf(M1Service);

    const d = m0.get(PROVIDER);

    expect(d.globalService).toBeInstanceOf(GlobalService);
    expect(d.constant).toBe('22.03.2013');
    expect(d.emptyService).toBeInstanceOf(EmptyService);
  });

  describe('InversifyJS', () => {
    describe('When Clause', () => {
      it('should retrieve provider', () => {
        m0.update.addProvider({
          provide: EmptyService,
          useClass: EmptyService,
          when: () => true,
        });

        expect(() => m0.get(EmptyService)).not.toThrow(InjectionProviderModuleMissingProviderError);
      });

      it('should fail to retrieve provider', () => {
        m0.update.addProvider({
          provide: EmptyService,
          useClass: EmptyService,
          when: () => false,
        });

        expect(() => m0.get(EmptyService)).toThrow(InjectionProviderModuleMissingProviderError);
      });
    });

    describe('On Event', () => {
      const cb = jest.fn();

      it('should invoke the `onGet` callback event', () => {
        m0.update.addProvider({
          provide: EmptyService,
          useClass: EmptyService,
          event: {
            onGet: cb,
          },
        });

        m0.get('OPTIONAL', true);
        m0.get(EmptyService);

        expect(cb).toHaveBeenCalledTimes(1);
      });

      it('should invoke the `onRemove` callback event', () => {
        const PROVIDER: ProviderClassToken<EmptyService> = {
          provide: EmptyService,
          useClass: EmptyService,
          event: {
            onRemove: cb,
          },
        };

        m0.update.addProvider(PROVIDER);
        m0.update.addProvider(EmptyService2);

        m0.update.removeProvider(PROVIDER);
        m0.update.removeProvider(EmptyService2);

        expect(cb).toHaveBeenCalledTimes(1);
      });
    });
  });
});
