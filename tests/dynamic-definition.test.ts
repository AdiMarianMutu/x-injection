import {
  DefinitionEventType,
  InjectionProviderModuleMissingProviderError,
  ProviderModule,
  ProviderValueToken,
} from '../src';
import { EmptyService, EmptyService2, EmptyService3, FilledService } from './setup';

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
        id: 'm1_to_be_removed',
      });

      m0.update.addImport(m1);

      expect(m0.isImportingModule(m1)).toBe(true);
      expect(m0.isImportingModule(m1.id)).toBe(true);
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

    it('should update container providers when imported module updates its export definition', () => {
      const m1 = ProviderModule.create({
        id: 'm1',
      });

      m0.update.addImport(m1);

      const pr0up = { provide: 'update_prov', useValue: 1998 };
      m1.update.addImport(ProviderModule.create({ id: 'update_mod', providers: [pr0up], exports: [pr0up] }), true);

      expect(m0.hasProvider(pr0up)).toBe(true);
      expect(m0.get(pr0up)).toBe(1998);
    });

    describe('Remove', () => {
      it('should remove imported module by `reference`', async () => {
        const { EmptyModuleWithEmptyService } = await import('./setup/modules');

        m0.update.addImport(EmptyModuleWithEmptyService);

        expect(m0.isImportingModule(EmptyModuleWithEmptyService)).toBe(true);

        m0.update.removeImport(EmptyModuleWithEmptyService);

        expect(m0.isImportingModule(EmptyModuleWithEmptyService)).toBe(false);
        expect(() => m0.get(EmptyService)).toThrow(InjectionProviderModuleMissingProviderError);
      });

      it('should remove imported module by `id`', async () => {
        expect(m0.isImportingModule('m1_to_be_removed')).toBe(true);

        m0.update.removeImport('m1_to_be_removed');

        expect(m0.isImportingModule('m1_to_be_removed')).toBe(false);
      });

      it('should fail to remove module', () => {
        expect(m0.update.removeImport('not existing')).toBe(false);
      });
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

    describe('Remove', () => {
      it('should remove provider by `provide` key value', () => {
        const p1 = {
          provide: 'p1_to_be_deleted',
          useValue: 0,
        };

        m0.update.addProvider(p1);

        expect(m0.hasProvider(p1)).toBe(true);

        m0.update.removeProvider('p1_to_be_deleted');

        expect(m0.hasProvider('p1_to_be_deleted')).toBe(false);
      });

      it('should fail to remove provider', () => {
        const m1 = new ProviderModule({
          id: 'm1',
          providers: [EmptyService],
        });

        m1.definition.providers.delete(EmptyService);

        expect(m1.update.removeProvider(EmptyService)).toBe(false);
      });
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
