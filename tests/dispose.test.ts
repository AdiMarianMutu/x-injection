import { ProviderModule } from '../src';

describe('Dispose', () => {
  const beforeCb = jest.fn();
  const afterCb = jest.fn();

  const mOptions = {
    identifier: 'm',
    onDispose: () => {
      return {
        before: beforeCb,
        after: afterCb,
      };
    },
  };
  const m = new ProviderModule(mOptions).toNaked();

  afterEach(() => {
    jest.clearAllMocks();

    m._lazyInit(mOptions);
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

  it('should be able to use `lazyInit` to re-initialize a disposed `module`', async () => {
    const mmOptions = {
      identifier: 'mm',
      providers: [{ provide: 'IS_AVAILABLE', useValue: true }],
    };
    const mm = new ProviderModule(mmOptions).toNaked();

    expect(mm.get('IS_AVAILABLE')).toBe(true);

    await mm.dispose();

    expect(mm.isDisposed).toBe(true);

    mm._lazyInit(mmOptions);

    expect(mm.get('IS_AVAILABLE')).toBe(true);
  });
});
