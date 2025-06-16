import { AppModule, Injectable, ProviderModule } from '../src';
import { EmptyService, EmptyService2, EmptyService3 } from './setup';

describe('ProviderModuleBlueprint', () => {
  afterEach(() => jest.clearAllMocks());

  it('should instantiate a `ProviderModule` from a blueprint', () => {
    const m0 = ProviderModule.create({
      id: 'm0',
      providers: [EmptyService2],
      exports: [EmptyService2],
    });

    const mb0 = ProviderModule.blueprint({
      id: 'mb0',
      imports: [m0],
      providers: [EmptyService],
    });

    const m1 = ProviderModule.create(mb0);

    expect(m1.hasProvider(EmptyService2)).toBe(true);
    expect(m1.hasProvider(EmptyService)).toBe(true);
  });

  it('should instantiate a `ProviderModule` from a deep nested blueprint & import it into another module', () => {
    const m0 = ProviderModule.create({
      id: 'm0',
      providers: [EmptyService2],
      exports: [EmptyService2],
    });

    const mb0 = ProviderModule.blueprint({
      id: 'mb0',
      imports: [m0],
      providers: [EmptyService],
      exports: [m0, EmptyService],
    });

    const mb1 = ProviderModule.blueprint({
      id: 'mb1',
      imports: [mb0],
      exports: [mb0],
    });

    const mb2 = ProviderModule.blueprint({
      id: 'mb2',
      imports: [mb1],
      providers: [EmptyService3],
      // Intentionally not exporting the `EmptyService3`
      exports: [mb1],
    });

    const m1 = ProviderModule.create(mb2);

    expect(m1.hasProvider(EmptyService)).toBe(true);
    expect(m1.hasProvider(EmptyService2)).toBe(true);
    expect(m1.hasProvider(EmptyService3)).toBe(true);

    const m2 = ProviderModule.create({
      id: 'm2',
      imports: [m1],
    });

    expect(m2.hasProvider(EmptyService)).toBe(true);
    expect(m2.hasProvider(EmptyService2)).toBe(true);
    expect(m2.hasProvider(EmptyService3)).toBe(false);
  });

  it('should import into a module', () => {
    const m0 = ProviderModule.create({
      id: 'm0',
    });

    const mb = ProviderModule.blueprint({
      id: 'mb',
      providers: [EmptyService],
      exports: [EmptyService],
    });

    m0.update.addImport(mb);

    expect(m0.hasProvider(EmptyService)).toBe(true);
  });

  describe('IsGlobal', () => {
    it('should automatically import into `AppModule` when `autoImportIntoAppModuleWhenGlobal === true`', () => {
      @Injectable()
      class A {}

      ProviderModule.blueprint({
        id: 'mb0_global',
        isGlobal: true,
        providers: [A],
        exports: [A],
      });

      expect(AppModule.isImportingModule('mb0_global')).toBe(true);
      expect(AppModule.hasProvider(A)).toBe(true);
    });

    it('should NOT automatically import into `AppModule` when `autoImportIntoAppModuleWhenGlobal === false`', () => {
      @Injectable()
      class B {}

      ProviderModule.blueprint(
        {
          id: 'mb0_global_autoImportIntoAppModuleWhenGlobal=false',
          isGlobal: true,
          providers: [B],
          exports: [B],
        },
        { autoImportIntoAppModuleWhenGlobal: false }
      );

      expect(AppModule.isImportingModule('mb0_global_autoImportIntoAppModuleWhenGlobal=false')).toBe(false);
      expect(AppModule.hasProvider(B)).toBe(false);
    });
  });

  describe('Clone', () => {
    const mb_0 = ProviderModule.blueprint({ id: 'mb_0' });

    const mb0 = ProviderModule.blueprint({
      id: 'mb0',
      imports: [mb_0],
      providers: [EmptyService, EmptyService2],
      exports: [EmptyService, EmptyService2],
      onReady: () => {},
      onReset: () => {
        return {
          before: () => {},
          after: () => {},
        };
      },
      onDispose: () => {
        return {
          before: () => {},
          after: () => {},
        };
      },
    });

    it('should deep clone instance', () => {
      const mb0_c0 = mb0.clone();

      expect(mb0_c0).toBeDefined();
    });

    it('should modify properties without affecting the original blueprint', () => {
      const mb0_c0 = mb0.clone();

      mb0_c0.id = 'changed';
      mb0_c0.imports = [];
      mb0_c0.providers = [];
      mb0_c0.exports = [];
      mb0_c0.onReady = undefined;
      mb0_c0.onReset = undefined;
      mb0_c0.onDispose = undefined;

      expect(mb0.id).toBe('mb0');
      expect(mb0.imports?.length).toBeGreaterThan(0);
      expect(mb0.providers?.length).toBeGreaterThan(0);
      expect(mb0.exports?.length).toBeGreaterThan(0);
      expect(mb0.onReady).not.toBeUndefined();
      expect(mb0.onReset).not.toBeUndefined();
      expect(mb0.onDispose).not.toBeUndefined();

      expect(mb0_c0.id).toBe('changed');
      expect(mb0_c0.imports?.length).toBe(0);
      expect(mb0_c0.providers?.length).toBe(0);
      expect(mb0_c0.exports?.length).toBe(0);
      expect(mb0_c0.onReady).toBeUndefined();
      expect(mb0_c0.onReset).toBeUndefined();
      expect(mb0_c0.onDispose).toBeUndefined();
    });
  });
});
