import { Container } from 'inversify';

import {
  GlobalAppModule,
  InjectionError,
  InjectionProviderModuleError,
  InjectionProviderModuleGlobalMarkError,
  ProviderModule,
} from '../src';
import { GlobalModuleRegister } from '../src/core';
import { GlobalService, TestAppModule } from './setup';

describe('AppModule', () => {
  afterEach(() => jest.clearAllMocks());

  it('should throw error if `register` is invoked more than once per app life-cycle', () => {
    expect(() => TestAppModule.register({})).toThrow(InjectionError);
  });

  it('should have a bound container', () => {
    expect(TestAppModule.container).toBeDefined();
    expect(TestAppModule.container).toBeInstanceOf(Container);
  });

  it('should have the `GlobalService` bound', () => {
    expect(TestAppModule.__isCurrentBound(GlobalService)).toBe(true);
  });

  it('should throw when a module tries to import the `AppModule`', () => {
    expect(() => new ProviderModule({ identifier: 'm', imports: [TestAppModule] })).toThrow(
      InjectionProviderModuleError
    );
  });

  it('should correctly dispose the `AppModule`', async () => {
    const cb = jest.fn();
    const am = new GlobalAppModule().register<true>({
      onDispose: () => {
        return {
          after: cb,
        };
      },
    });

    await am.dispose();

    expect(cb).toHaveBeenCalledTimes(1);
    expect(am.isDisposed).toBe(true);
  });

  describe('Global Mark', () => {
    afterEach(() => GlobalModuleRegister.clear());

    it('should throw an error when a `module` is marked as `global` and not imported into `AppModule`', () => {
      new ProviderModule({
        identifier: 'm',
        markAsGlobal: true,
      });

      expect(() => {
        new GlobalAppModule().register({});
      }).toThrow(InjectionProviderModuleGlobalMarkError);
    });

    it('should throw an error when a `module` is NOT marked as `global` and imported into `AppModule`', () => {
      expect(() => {
        new GlobalAppModule().register({
          imports: [
            new ProviderModule({
              identifier: 'm',
              markAsGlobal: false,
            }),
          ],
        });
      }).toThrow(InjectionProviderModuleGlobalMarkError);
    });

    it('should throw an error when a global marked `module` exports another module which has NOT been marked as `global`', () => {
      const m = new ProviderModule({
        identifier: 'm',
      });

      const mm = new ProviderModule({
        identifier: 'mm',
        markAsGlobal: true,
        imports: [m],
        exports: [m],
      });

      expect(() => {
        new GlobalAppModule().register({
          imports: [mm],
        });
      }).toThrow(InjectionProviderModuleGlobalMarkError);
    });
  });

  describe('Strict = false', () => {
    it('should NOT throw when importing modules not marked as global', () => {
      expect(() => {
        new GlobalAppModule().register({
          _strict: false,
          imports: [
            new ProviderModule({
              identifier: 'm',
              markAsGlobal: false,
            }),
          ],
        });
      }).not.toThrow(InjectionProviderModuleGlobalMarkError);
    });
  });
});
