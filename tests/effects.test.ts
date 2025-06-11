import { InjectionProviderModuleError, ProviderModule } from '../src';
import { EmptyService, EmptyService2 } from './setup';

describe('Effects', () => {
  const mOptions = {
    identifier: 'm',
    providers: [EmptyService2],
  };
  const m = new ProviderModule(mOptions).toNaked();

  let cb: () => void;

  beforeEach(() => {
    cb = jest.fn();
  });

  afterEach(() => jest.clearAllMocks());

  describe('On Bind', () => {
    it('should invoke the provided effect callback', () => {
      m._onBind(EmptyService, cb);
      m.__bind(EmptyService);

      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('On Get', () => {
    it('should invoke the provided effect callback', () => {
      const cbMultiple = jest.fn();

      m._onGet(EmptyService2, true, cb);
      m._onGet(EmptyService2, false, cbMultiple);

      [...new Array(4)].forEach(() => m.get(EmptyService2));

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cbMultiple).toHaveBeenCalledTimes(4);
    });

    it('should throw when the `once` param has not been provided', () => {
      expect(() => m._onGet(EmptyService2, undefined as any, () => {})).toThrow(InjectionProviderModuleError);
    });
  });

  describe('On Rebind', () => {
    it('should invoke the provided effect callback', async () => {
      m._onRebind(EmptyService, cb);

      await m.__rebind(EmptyService);

      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('On Unbind', () => {
    it('should invoke the provided effect callback', async () => {
      m._onUnbind(EmptyService, cb);
      await m.__unbind(EmptyService);

      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('should invoke the provided effect callback when the `dispose` method is invoked', async () => {
      m._onUnbind(EmptyService, cb);
      await m.dispose();

      expect(cb).toHaveBeenCalledTimes(1);

      m._lazyInit(mOptions);
    });
  });

  describe('On Unbind All', () => {
    it('should invoke the provided effect callback', async () => {
      m._onUnbind(EmptyService, cb);
      m._onUnbind(EmptyService2, cb);

      await m.__unbindAll();

      expect(cb).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cleanup', () => {
    it('should invoke the provided effect callback individually when unbinding a `provider` form the `imported` module', async () => {
      const im = new ProviderModule({
        identifier: 'im',
        providers: [EmptyService],
        exports: [EmptyService],
      }).toNaked();

      const am = new ProviderModule({
        identifier: 'am',
        imports: [im],
      }).toNaked();

      const bm = new ProviderModule({
        identifier: 'bm',
        imports: [im],
      }).toNaked();

      am._onUnbind(EmptyService, cb);
      bm._onUnbind(EmptyService, cb);

      expect(im.registeredSideEffects.get(EmptyService)?.onUnbindEffects.length).toBe(2);

      await am.__unbind(EmptyService);
      await bm.__unbind(EmptyService);

      expect(cb).toHaveBeenCalledTimes(2);

      // At this point the imported module should also not have any `unbind` effects registered anymore.
      expect(im.registeredSideEffects.get(EmptyService)?.onUnbindEffects.length).toBe(0);
    });

    it('should invoke the provided effect callback when thr `imported` module unbinds', async () => {
      const im = new ProviderModule({
        identifier: 'im',
        providers: [EmptyService],
        exports: [EmptyService],
      }).toNaked();

      const am = new ProviderModule({
        identifier: 'am',
        imports: [im],
      }).toNaked();

      const bm = new ProviderModule({
        identifier: 'bm',
        imports: [im],
      }).toNaked();

      am._onUnbind(EmptyService, cb);
      bm._onUnbind(EmptyService, cb);

      await im.__unbind(EmptyService);

      expect(cb).toHaveBeenCalledTimes(2);

      // At this point the imported module should also not have any `unbind` effects registered anymore.
      // This time it'll be `undefined` because the entire `onUnbindEffects` object has been removed by the
      // `im.__unbind` method.
      expect(im.registeredSideEffects.get(EmptyService)?.onUnbindEffects.length).toBeUndefined();
    });
  });
});
