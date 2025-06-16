import { InjectionProviderModuleDisposedError, ProviderModule } from '../src';
import { EmptyService } from './setup';

describe('Cleanup', () => {
  const beforeCb = jest.fn();
  const afterCb = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Reset', () => {
    it('should reset the module', async () => {
      const m0 = ProviderModule.create({
        id: 'm0',
        providers: [EmptyService],
        exports: [EmptyService],
      });

      const m1 = ProviderModule.create({
        id: 'm1',
        imports: [m0],
        exports: [m0],
      });

      expect(m1.hasProvider(EmptyService)).toBe(true);
      expect(m1.isImportingModule(m0)).toBe(true);
      expect(m1.isExportingModule(m0)).toBe(true);

      await m1.reset();

      expect(m1.hasProvider(EmptyService)).toBe(false);
      expect(m1.isImportingModule(m0)).toBe(false);
      expect(m1.isExportingModule(m0)).toBe(false);
    });

    it('should invoke the callbacks', async () => {
      const m0 = ProviderModule.create({
        id: 'm0',
        onReset: () => {
          return {
            before: beforeCb,
            after: afterCb,
          };
        },
      });

      await m0.reset();

      expect(beforeCb).toHaveBeenCalledTimes(1);
      expect(afterCb).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dispose', () => {
    it('should dispose the module', async () => {
      const m0 = new ProviderModule({
        id: 'm0',
        providers: [EmptyService],
        exports: [EmptyService],
      });

      const m1 = new ProviderModule({
        id: 'm1',
        imports: [m0],
        exports: [m0],
      });

      expect(m0.isDisposed).toBe(false);

      await m0.dispose();

      expect(m0.isDisposed).toBe(true);

      expect(() => m1.get(EmptyService)).toThrow(InjectionProviderModuleDisposedError);
      expect(() => m0.get(EmptyService)).toThrow(InjectionProviderModuleDisposedError);
      expect(m0.dynamicModuleDef).toBeNull();
      expect(m0.importedModuleContainers).toBeNull();
      expect(m0.moduleContainer).toBeNull();

      await m1.dispose();

      expect(m1.isDisposed).toBe(true);
      expect(() => m1.dynamicModuleDef.subscribe(() => {})).toThrow();
    });

    it('should invoke the callbacks', async () => {
      const m0 = ProviderModule.create({
        id: 'm0',
        onDispose: () => {
          return {
            before: beforeCb,
            after: afterCb,
          };
        },
      });

      await m0.dispose();

      expect(beforeCb).toHaveBeenCalledTimes(1);
      expect(afterCb).toHaveBeenCalledTimes(1);
    });
  });
});
