import { Injectable, InjectionScope, ProviderModule } from '../src';
import { EmptyService, FilledService } from './setup';

describe('Injection Scope', () => {
  afterEach(() => jest.clearAllMocks());

  describe('Singleton', () => {
    it('should always be the same instance', () => {
      const m0 = ProviderModule.create({
        id: 'm0',
        defaultScope: InjectionScope.Singleton,
        providers: [EmptyService],
      });

      expect(m0.get(EmptyService)).toBe(m0.get(EmptyService));
    });
  });

  describe('Request', () => {
    it('should be the same instance under the same `get` request', () => {
      const m0 = ProviderModule.create({
        id: 'm0',
        defaultScope: InjectionScope.Request,
        providers: [FilledService, EmptyService],
      });

      const aliceHouse = m0.get(FilledService);
      const bobHouse = m0.get(FilledService);

      expect(aliceHouse.emptyBox).toBe(aliceHouse.emptyCan);
      expect(bobHouse.emptyBox).toBe(bobHouse.emptyCan);

      expect(aliceHouse.emptyBox).not.toBe(bobHouse.emptyBox);
      expect(aliceHouse.emptyCan).not.toBe(bobHouse.emptyCan);
    });
  });

  describe('Transient', () => {
    it('should always be a new instance', () => {
      const m0 = new ProviderModule({
        id: 'm0',
        defaultScope: InjectionScope.Transient,
        providers: [EmptyService],
      });

      expect(m0.get(EmptyService)).not.toBe(m0.get(EmptyService));
    });
  });

  describe('Priorty Order', () => {
    it('1. should use the `scope` declared into the `ProviderToken`', () => {
      @Injectable(InjectionScope.Singleton)
      class SingletonService {}

      const m0 = ProviderModule.create({
        id: 'm0',
        defaultScope: InjectionScope.Singleton,
        providers: [
          {
            provide: SingletonService,
            useClass: SingletonService,
            scope: InjectionScope.Transient,
          },
          {
            provide: EmptyService,
            useClass: EmptyService,
            scope: InjectionScope.Request,
          },
        ],
      });

      expect(m0.get(SingletonService)).not.toBe(m0.get(SingletonService));
      expect(m0.get(EmptyService)).not.toBe(m0.get(EmptyService));
    });

    it('2. should use the `scope` provided to the `Injectable` decorator', () => {
      @Injectable(InjectionScope.Request)
      class TransientService {}

      const m0 = new ProviderModule({
        id: 'm0',
        defaultScope: InjectionScope.Singleton,
        providers: [TransientService],
      });

      expect(m0.get(TransientService)).not.toBe(m0.get(TransientService));
    });

    it('3. should use the module default `scope`', () => {
      const m0 = ProviderModule.create({
        id: 'm0',
        defaultScope: InjectionScope.Transient,
        providers: [EmptyService],
      });

      expect(m0.get(EmptyService)).not.toBe(m0.get(EmptyService));
    });
  });

  describe('Imports', () => {
    it('should use the `imported` module `scope`', () => {
      const m0 = ProviderModule.create({
        id: 'm0',
        defaultScope: InjectionScope.Transient,
        providers: [EmptyService],
        exports: [EmptyService],
      });

      const m1 = ProviderModule.create({
        id: 'm1',
        defaultScope: InjectionScope.Singleton,
        imports: [m0],
      });

      expect(m1.get(EmptyService)).not.toBe(m1.get(EmptyService));
    });
  });
});
