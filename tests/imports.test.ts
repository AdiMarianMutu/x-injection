import { InjectionProviderModuleMissingProviderError, InjectionScope, ProviderModule } from '../src';
import { EmptyService, EmptyService2 } from './setup';
import { EmptyModule } from './setup/modules';

describe('Imports', () => {
  afterEach(() => jest.clearAllMocks());

  it('should not import a global module into a scoped module', () => {
    const m0 = new ProviderModule({
      appModuleRef: ProviderModule.create({ id: 'am0' }),
      id: 'm0',
      isGlobal: true,
      providers: [EmptyService],
      exports: [EmptyService],
    });

    const m1 = ProviderModule.create({
      id: 'm1',
      imports: [m0],
    });

    expect(m1.isImportingModule(m0)).toBe(false);
  });

  describe('Nested', () => {
    it('should `get` from the inner most imported module', () => {
      const m0 = new ProviderModule({
        id: 'm0',
        providers: [EmptyService],
        exports: [EmptyModule, EmptyService],
      });

      const m1 = new ProviderModule({
        id: 'm1',
        imports: [m0],
        providers: [EmptyService2],
        exports: [EmptyModule, EmptyService2, m0],
      });

      const m2 = new ProviderModule({
        id: 'm2',
        imports: [m1],
        exports: [EmptyModule, m1],
      });

      const m3 = new ProviderModule({
        id: 'm3',
        imports: [EmptyModule, m2],
      });

      expect(m3.moduleContainer.get(EmptyService)).toBeInstanceOf(EmptyService);
    });

    it('should fail to export a module which has not been first imported', () => {
      const m0 = new ProviderModule({
        id: 'm0',
        providers: [EmptyService],
        exports: [EmptyService],
      });

      const m1 = new ProviderModule({
        id: 'm1',
        // Missing import of the `m0` here.
        // imports: [m0],
        exports: [m0],
      });

      const m2 = new ProviderModule({
        id: 'm2',
        imports: [m1],
      });

      expect(() => m2.get(EmptyService)).toThrow(InjectionProviderModuleMissingProviderError);
    });

    it('should fail to `get` from the inner most imported module if not exported during the importing chain', () => {
      const m0 = new ProviderModule({
        id: 'm0',
        providers: [EmptyService],
        exports: [EmptyService],
      });

      const m1 = new ProviderModule({
        id: 'm1',
        imports: [m0],
        providers: [EmptyService2],
        exports: [EmptyService2, m0],
      });

      const m2 = new ProviderModule({
        id: 'm2',
        imports: [m1],
        // Missing re-export of the `m1` module here
      });

      const m3 = new ProviderModule({
        id: 'm3',
        imports: [m2],
      });

      expect(() => m3.get(EmptyService)).toThrow(InjectionProviderModuleMissingProviderError);
    });
  });

  describe('Circular Dependencies', () => {
    it('should handle circular module imports gracefully', () => {
      const m0 = ProviderModule.create({ id: 'm0', providers: [EmptyService], exports: [EmptyService] });
      const m1 = ProviderModule.create({ id: 'm1', imports: [m0] });

      // Introduce circular import
      m0.update.addImport(m1);

      expect(() => m1.get(EmptyService)).not.toThrow();
    });
  });

  describe('Injection Scope', () => {
    it('imports should retain their original scope', () => {
      const mb0 = ProviderModule.blueprint({
        id: 'mb0',
      });

      const p0 = { provide: EmptyService, useClass: EmptyService, scope: InjectionScope.Transient };

      const mb1 = ProviderModule.blueprint({
        id: 'mb1',
        imports: [mb0],
        providers: [p0],
        exports: [p0, mb0],
      });

      const mb2 = ProviderModule.blueprint({
        id: 'mb2',
        defaultScope: InjectionScope.Request,
        imports: [mb1],
        providers: [EmptyService2],
        exports: [EmptyService2, mb1],
      });

      const m0 = ProviderModule.create({
        id: 'm0',
        imports: [mb2],
      });

      expect(m0.get(EmptyService)).not.toBe(m0.get(EmptyService));
      expect(m0.get(EmptyService2)).not.toBe(m0.get(EmptyService2));
    });
  });
});
