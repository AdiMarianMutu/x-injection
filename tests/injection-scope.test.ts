import { Injectable, InjectionScope, ProviderModule } from '../src';
import { EmptyService, FilledService, GlobalService } from './setup';

describe('Injection Scope', () => {
  afterEach(() => jest.clearAllMocks());

  describe('Singleton', () => {
    it('should always be the same instance', () => {
      const m = new ProviderModule({
        identifier: 'm',
        defaultScope: InjectionScope.Singleton,
        providers: [EmptyService],
      });

      const a = m.get(EmptyService);
      const b = m.get(EmptyService);

      expect(a).toBe(b);
    });

    it('should get from the `AppModule` if not in the current module', () => {
      const m = new ProviderModule({
        identifier: 'm',
      });

      expect(m.get(GlobalService) instanceof GlobalService).toBe(true);
    });
  });

  describe('Request', () => {
    it('should be the same instance under the same `get` request', () => {
      const m = new ProviderModule({
        identifier: 'm',
        defaultScope: InjectionScope.Request,
        providers: [FilledService, EmptyService],
      });

      const aliceHouse = m.get(FilledService);
      const bobHouse = m.get(FilledService);

      expect(aliceHouse.emptyBox).toBe(aliceHouse.emptyCan);
      expect(bobHouse.emptyBox).toBe(bobHouse.emptyCan);

      expect(aliceHouse.emptyBox).not.toBe(bobHouse.emptyBox);
      expect(aliceHouse.emptyCan).not.toBe(bobHouse.emptyCan);
    });
  });

  describe('Transient', () => {
    it('should always be a new instance', () => {
      const m = new ProviderModule({
        identifier: 'm',
        defaultScope: InjectionScope.Transient,
        providers: [EmptyService],
      });

      expect(m.get(EmptyService)).not.toBe(m.get(EmptyService));
    });
  });

  describe('Priorty Order', () => {
    it('1. should use the `scope` declared into the `ProviderToken`', () => {
      @Injectable(InjectionScope.Singleton)
      class SingletonService {}

      const m = new ProviderModule({
        identifier: 'm',
        providers: [
          {
            provide: SingletonService,
            useClass: SingletonService,
            scope: InjectionScope.Transient,
          },
        ],
      });

      const a = m.get(SingletonService);
      const b = m.get(SingletonService);

      expect(a).not.toBe(b);
    });

    it('2. should use the `scope` provided to the `Injectable` decorator', () => {
      @Injectable(InjectionScope.Transient)
      class TransientService {}

      const m = new ProviderModule({
        identifier: 'm',
        defaultScope: InjectionScope.Singleton,
        providers: [TransientService],
      });

      const a = m.get(TransientService);
      const b = m.get(TransientService);

      expect(a).not.toBe(b);
    });

    it('3. should use the module default `scope`', () => {
      const m = new ProviderModule({
        identifier: 'm',
        defaultScope: InjectionScope.Transient,
        providers: [EmptyService],
      });

      const a = m.get(EmptyService);
      const b = m.get(EmptyService);

      expect(a).not.toBe(b);
    });
  });

  describe('Imports', () => {
    it('should use the `imported` module `scope`', () => {
      const m = new ProviderModule({
        identifier: 'm',
        defaultScope: InjectionScope.Transient,
        providers: [EmptyService],
        exports: [EmptyService],
      });

      const p = new ProviderModule({
        identifier: 'p',
        defaultScope: InjectionScope.Singleton,
        imports: [m],
      });

      expect(p.get(EmptyService)).not.toBe(p.get(EmptyService));
    });
  });
});
