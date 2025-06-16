import {
  Injectable,
  InjectionScope,
  MiddlewareType,
  ProviderModule,
  ProviderModuleHelpers,
  ProviderTokenHelpers,
} from '../src';
import { EmptyService, EmptyService2, EmptyService3 } from './setup';

describe('Middlewares', () => {
  const m0 = ProviderModule.create({ id: 'm0' });

  afterEach(async () => {
    await m0.reset();

    jest.clearAllMocks();
  });

  describe('BeforeAddImport', () => {
    it('should add providers to the imported module', () => {
      m0.middlewares.add(MiddlewareType.BeforeAddImport, (module) => {
        module.update.addProvider(EmptyService, true);

        return module;
      });
      m0.middlewares.add(MiddlewareType.BeforeAddImport, (module) => {
        module.update.addProvider(EmptyService2, true);

        return module;
      });
      m0.middlewares.add(MiddlewareType.BeforeAddImport, () => {
        return true;
      });

      const m1 = ProviderModule.create({ id: 'm1' });

      m0.update.addImport(m1);

      expect(m0.hasProvider(EmptyService)).toBe(true);
      expect(m0.hasProvider(EmptyService2)).toBe(true);
    });

    it('should disallow import of specific module', () => {
      m0.middlewares.add(MiddlewareType.BeforeAddImport, (module) => {
        return module.id !== 'NotAllowedModule';
      });

      m0.update.addImport(ProviderModule.create({ id: 'NotAllowedModule' }));
      m0.update.addImport(ProviderModule.create({ id: 'AllowedModule' }));
      m0.update.addImport(ProviderModule.create({ id: 'RandomModule' }));

      expect(m0.isImportingModule('NotAllowedModule')).toBe(false);
      expect(m0.isImportingModule('AllowedModule')).toBe(true);
      expect(m0.isImportingModule('RandomModule')).toBe(true);
    });
  });

  describe('BeforeAddProvider', () => {
    it('should change the scope', () => {
      m0.middlewares.add(MiddlewareType.BeforeAddProvider, (provider) => {
        return {
          provide: provider as any,
          useClass: provider as any,
          scope: InjectionScope.Transient,
        };
      });
      m0.middlewares.add(MiddlewareType.BeforeAddProvider, () => {
        return true;
      });

      m0.update.addProvider(EmptyService);

      expect(m0.hasProvider(EmptyService)).toBe(true);
      expect(m0.get(EmptyService)).not.toBe(m0.get(EmptyService));
    });

    it('should not be able to add a specific provider', () => {
      m0.middlewares.add(MiddlewareType.BeforeAddProvider, (provider) => {
        return (provider as any).name !== 'EmptyService2';
      });

      m0.update.addProvider(EmptyService);
      m0.update.addProvider(EmptyService2);
      m0.update.addProvider(EmptyService3);

      expect(m0.hasProvider(EmptyService)).toBe(true);
      expect(m0.hasProvider(EmptyService2)).toBe(false);
      expect(m0.hasProvider(EmptyService3)).toBe(true);
    });
  });

  describe('BeforeGet', () => {
    it('should change the retrieved provider to `null` under some circumstances', () => {
      m0.middlewares.add(MiddlewareType.BeforeGet, (provider) => {
        return provider instanceof EmptyService ? null : provider;
      });

      m0.update.addProvider(EmptyService);
      m0.update.addProvider(EmptyService2);

      expect(m0.get(EmptyService)).toBe(null);
      expect(m0.get(EmptyService2)).toBeInstanceOf(EmptyService2);
    });

    it('should change the retrieved provider value through middleware chain', () => {
      m0.middlewares.add(MiddlewareType.BeforeGet, (provider) => {
        return provider;
      });
      m0.middlewares.add(MiddlewareType.BeforeGet, (provider) => {
        return provider instanceof EmptyService ? new EmptyService2() : provider;
      });
      m0.middlewares.add(MiddlewareType.BeforeGet, (provider) => {
        return provider;
      });

      m0.update.addProvider(EmptyService);
      m0.update.addProvider(EmptyService2);

      expect(m0.get(EmptyService)).toBeInstanceOf(EmptyService2);
      expect(m0.get(EmptyService2)).toBeInstanceOf(EmptyService2);
    });
  });

  describe('BeforeRemoveImport', () => {
    it('should not allow to remove an import', () => {
      m0.middlewares.add(MiddlewareType.BeforeRemoveImport, (module) => {
        return module.toString() !== 'PermanentModule';
      });

      const PermanentModule = ProviderModule.create({ id: 'PermanentModule' });
      const m1 = ProviderModule.create({ id: 'm1' });
      const m2 = ProviderModule.create({ id: 'm2' });

      m0.update.addImport(PermanentModule);
      m0.update.addImport(m1);
      m0.update.addImport(m2);

      m0.update.removeImport(PermanentModule);
      m0.update.removeImport(m1);
      m0.update.removeImport(m2);

      expect(m0.isImportingModule(PermanentModule)).toBe(true);
      expect(m0.isImportingModule(m1)).toBe(false);
      expect(m0.isImportingModule(m2)).toBe(false);
    });
  });

  describe('BeforeRemoveProvider', () => {
    it('should not allow to remove a provider', () => {
      m0.middlewares.add(MiddlewareType.BeforeRemoveProvider, (provider) => {
        return provider === EmptyService2;
      });

      m0.update.addProvider(EmptyService);
      m0.update.addProvider(EmptyService2);
      m0.update.addProvider(EmptyService3);

      m0.update.removeProvider(EmptyService);
      m0.update.removeProvider(EmptyService2);
      m0.update.removeProvider(EmptyService3);

      expect(m0.hasProvider(EmptyService)).toBe(true);
      expect(m0.hasProvider(EmptyService2)).toBe(false);
      expect(m0.hasProvider(EmptyService3)).toBe(true);
    });
  });

  describe('BeforeRemoveExport', () => {
    it('should not allow to remove an export', () => {
      m0.middlewares.add(MiddlewareType.BeforeRemoveExport, (exportDef) => {
        if (ProviderModuleHelpers.isModule(exportDef)) {
          return exportDef.toString() !== 'PermanentModule';
        } else {
          return exportDef === EmptyService2;
        }
      });

      const PermanentModule = ProviderModule.create({ id: 'PermanentModule' });
      const m1 = ProviderModule.create({ id: 'm1' });
      const m2 = ProviderModule.create({ id: 'm2' });

      m0.update.addImport(PermanentModule, true);
      m0.update.addImport(m1, true);
      m0.update.addImport(m2, true);

      m0.update.addProvider(EmptyService, true);
      m0.update.addProvider(EmptyService2, true);
      m0.update.addProvider(EmptyService3, true);

      m0.update.removeFromExports(PermanentModule);
      m0.update.removeFromExports(m1);
      m0.update.removeFromExports(m2);

      m0.update.removeFromExports(EmptyService);
      m0.update.removeFromExports(EmptyService2);
      m0.update.removeFromExports(EmptyService3);

      expect(m0.isExportingModule(PermanentModule)).toBe(true);
      expect(m0.isExportingModule(m1)).toBe(false);
      expect(m0.isExportingModule(m2)).toBe(false);

      expect(m0.isExportingProvider(EmptyService)).toBe(true);
      expect(m0.isExportingProvider(EmptyService2)).toBe(false);
      expect(m0.isExportingProvider(EmptyService3)).toBe(true);
    });
  });

  describe('OnExportAccess', () => {
    it('should conditionally allow an importer to tap into the exports', () => {
      const m1 = ProviderModule.create({
        id: 'm1',
      });

      const m2 = ProviderModule.create({
        id: 'm2',
        imports: [m1],
        providers: [EmptyService, EmptyService2],
        exports: [m1, EmptyService, EmptyService2],
      });

      const m3 = ProviderModule.create({
        id: 'm3',
        imports: [m2],
      });

      m0.update.addImport(m2);

      m2.middlewares.add(MiddlewareType.OnExportAccess, (importerModule, currentExport) => {
        if (importerModule.toString() === 'm0' && currentExport === EmptyService2) return false;

        return true;
      });

      @Injectable()
      class A {
        constructor(public readonly e2: EmptyService2) {}
      }

      m0.update.addProvider(A);

      const b = m0.get(A);

      expect(b.e2).toBeUndefined();

      expect(m0.hasProvider(EmptyService2)).toBe(false);
      expect(m3.hasProvider(EmptyService2)).toBe(true);
    });

    it('should just not allow any export', () => {
      const m1 = ProviderModule.create({
        id: 'm1',
      });

      const m2 = ProviderModule.create({
        id: 'm2',
        imports: [m1],
        providers: [EmptyService, EmptyService3],
        exports: [m1, EmptyService, EmptyService3],
      });

      m2.middlewares.add(MiddlewareType.OnExportAccess, () => {
        return false;
      });

      m0.update.addImport(m2);

      expect(m0.hasProvider(EmptyService3)).toBe(false);
    });
  });
});
