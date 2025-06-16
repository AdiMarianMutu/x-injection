import {
  DefinitionEventType,
  InjectionProviderModuleMissingProviderError,
  ProviderModule,
  ProviderValueToken,
} from '../src';
import { EmptyService, EmptyService2, EmptyService3, FilledService } from './setup';
import { LazyModuleService } from './setup/lazy.module';
import { LAZY_PROVIDER } from './setup/lazy.provider';

describe('Dynamic Definition', () => {
  afterEach(() => jest.clearAllMocks());

  const m0 = new ProviderModule({
    id: 'm0',
  });

  describe('On Ready', () => {
    it('should invoke the callback', () => {
      ProviderModule.create({
        id: 'onReady',
        onReady: (module) => {
          expect(module.id).toBe('onReady');
        },
      });
    });
  });

  describe('Imports', () => {
    it('should import additional modules', () => {
      const m1 = ProviderModule.create({
        id: 'm1',
      });

      m1.update.addImport(m0);

      expect(m1.isImportingModule(m0)).toBe(true);
      expect(m1.isImportingModule(m0.id)).toBe(true);
    });

    it('should lazily import additional modules', async () => {
      await m0.update.addImportLazy(async () => (await import('./setup/lazy.module')).LazyModule);

      expect(m0.isImportingModule('LazyModule')).toBe(true);
      expect(m0.get(LazyModuleService)).toBeInstanceOf(LazyModuleService);
    });

    it('should import additional modules and export them', () => {
      const m1 = ProviderModule.create({
        id: 'm1',
        providers: [EmptyService],
        exports: [EmptyService],
      });

      const m2 = ProviderModule.create({
        id: 'm2',
      });

      expect(m2.isExportingModule(m1)).toBe(false);

      m2.update.addImport(m1, true);

      expect(m2.isExportingModule(m1)).toBe(true);
      expect(m2.get(EmptyService)).toBeInstanceOf(EmptyService);
    });

    it('should remove imported module', async () => {
      const { LazyModule } = await import('./setup/lazy.module');

      expect(m0.isImportingModule(LazyModule)).toBe(true);

      m0.update.removeImport(LazyModule);

      expect(m0.isImportingModule(LazyModule)).toBe(false);
      expect(() => m0.get(LazyModuleService)).toThrow(InjectionProviderModuleMissingProviderError);
    });
  });

  describe('Providers', () => {
    const p0: ProviderValueToken<string> = {
      provide: 'p0',
      useValue: '29.09.1969',
    };

    it('should add additional providers', () => {
      m0.update.addProvider(p0);

      expect(m0.hasProvider(p0)).toBe(true);
      expect(m0.moduleContainer.container.isCurrentBound(p0.provide)).toBe(true);
      expect(m0.get(p0)).toBe(p0.useValue);
    });

    it('should lazily add additional providers', async () => {
      await m0.update.addProviderLazy(async () => (await import('./setup/lazy.provider')).LAZY_PROVIDER);

      expect(m0.hasProvider(LAZY_PROVIDER)).toBe(true);
      expect(m0.moduleContainer.container.isCurrentBound(LAZY_PROVIDER.provide)).toBe(true);
      expect(m0.get(LAZY_PROVIDER)).toBe(LAZY_PROVIDER.useValue);
    });

    it('should import additional providers and export them', () => {
      const m1 = ProviderModule.create({
        id: 'm1',
      });

      const m2 = ProviderModule.create({
        id: 'm2',
        imports: [m1],
      });

      expect(m1.isExportingProvider(p0)).toBe(false);

      m1.update.addProvider(p0, true);

      expect(m1.isExportingProvider(p0)).toBe(true);
      expect(m2.get(p0)).toBe(p0.useValue);
    });

    it('should remove provider', () => {
      m0.update.removeProvider(p0);
      m0.update.removeProvider(LAZY_PROVIDER);

      expect(m0.hasProvider(p0)).toBe(false);
      expect(m0.hasProvider(LAZY_PROVIDER)).toBe(false);
      expect(() => m0.get(p0)).toThrow(InjectionProviderModuleMissingProviderError);
      expect(() => m0.get(LAZY_PROVIDER)).toThrow(InjectionProviderModuleMissingProviderError);
    });

    it('should fail to remove provider', () => {
      const m1 = new ProviderModule({
        id: 'm1',
        providers: [EmptyService],
      });

      m1.definition.providers.delete(EmptyService);

      expect(m1.update.removeProvider(EmptyService)).toBe(false);
    });

    it('should check if has imported provider', () => {
      const m1 = ProviderModule.create({
        id: 'm1',
        providers: [EmptyService],
        exports: [EmptyService],
      });

      const m2 = ProviderModule.create({
        id: 'm2',
        imports: [m1],
      });

      expect(m2.hasProvider(EmptyService)).toBe(true);
      expect(m2.hasProvider(EmptyService2)).toBe(false);
    });
  });

  describe('Exports', () => {
    it('should remove a nested exported module/provider', async () => {
      const m1 = ProviderModule.create({
        id: 'm1',
        imports: [m0],
        providers: [EmptyService],
        exports: [m0, EmptyService],
      });

      const mb0 = ProviderModule.blueprint({
        id: 'mb0',
        imports: [m1],
        exports: [m1],
      });

      const m2 = ProviderModule.create({
        id: 'm2',
        imports: [mb0],
        providers: [EmptyService3],
        exports: [EmptyService3, mb0],
      });

      const m3 = ProviderModule.create({
        id: 'm3',
        imports: [m2],
        exports: [m2],
      });

      const m4 = ProviderModule.create({
        id: 'm4',
        imports: [m3],
      });

      expect(m4.get(EmptyService)).toBeInstanceOf(EmptyService);
      expect(m4.get(EmptyService3)).toBeInstanceOf(EmptyService3);

      m1.update.removeFromExports(EmptyService);

      expect(m4.hasProvider(EmptyService)).toBe(false);

      m3.update.removeFromExports(m2);

      expect(m4.hasProvider(EmptyService3)).toBe(false);
    });
  });

  describe('Events', () => {
    const cb = jest.fn();

    it('should correctly emit and intercept the signal', () => {
      const m00 = ProviderModule.create({ id: 'm00' });

      m00.update.subscribe(cb);

      m00.update.addProvider(EmptyService);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith({ type: DefinitionEventType.Provider, change: EmptyService });
    });

    it('should correctly intercept a `get` event', () => {
      const m1 = ProviderModule.create({ id: 'm1', providers: [FilledService, EmptyService] });

      m1.update.subscribe(({ type, change }) => {
        if (type !== DefinitionEventType.GetProvider) return;

        cb(change);
      });

      const result = m1.get(FilledService);

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(result);
    });
  });
});
