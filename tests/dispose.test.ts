import { InjectionProviderModuleDisposedError, ProviderModule, ProviderModuleDefinition } from '../src';
import { EmptyService } from './setup';

describe('Dispose', () => {
  const beforeCb = jest.fn();
  const afterCb = jest.fn();

  const mdef = new ProviderModuleDefinition({
    identifier: 'm',
    onDispose: () => {
      return {
        before: beforeCb,
        after: afterCb,
      };
    },
  });
  const m = new ProviderModule(mdef).toNaked();

  afterEach(() => {
    jest.clearAllMocks();

    m._internalInit(mdef);
  });

  it('should correctly have the `module` disposed', async () => {
    await m.dispose();

    expect(m.isDisposed).toBe(true);
    expect(m.container).toBeNull();
    expect(m.imports).toBeNull();
    expect(m.providers).toBeNull();
    expect(m.exports).toBeNull();
  });

  it('should correctly invoke the `before` callback', async () => {
    await m.dispose();

    expect(beforeCb).toHaveBeenCalledTimes(1);
  });

  it('should correctly invoke the `after` callback', async () => {
    await m.dispose();

    expect(afterCb).toHaveBeenCalledTimes(1);
  });

  it('should throw when accessing a disposed module', async () => {
    await m.dispose();

    expect(() => m.get(EmptyService)).toThrow(InjectionProviderModuleDisposedError);
  });

  it('should be able to use `lazyInit` to re-initialize a disposed `module`', async () => {
    const mmOptions = {
      identifier: 'mm',
      providers: [{ provide: 'IS_AVAILABLE', useValue: true }],
    };
    const mm = new ProviderModule(mmOptions).toNaked();

    expect(mm.get('IS_AVAILABLE')).toBe(true);

    await mm.dispose();

    expect(mm.isDisposed).toBe(true);

    mm._internalInit(mmOptions);

    expect(mm.get('IS_AVAILABLE')).toBe(true);
  });
});
