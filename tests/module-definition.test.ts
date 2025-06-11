import { ProviderModule, ProviderModuleDefinition } from '../src';
import { EmptyService, EmptyService2, EmptyService3 } from './setup';

describe('ProviderModuleDefinition', () => {
  afterEach(() => jest.clearAllMocks());

  it('should instantiate a `ProviderModule` from a `ProviderModuleDefinition`', () => {
    const m = new ProviderModule({
      identifier: 'm',
      providers: [EmptyService2],
      exports: [EmptyService2],
    });

    const mdef = new ProviderModuleDefinition({
      identifier: 'mdef',
      imports: [m],
      providers: [EmptyService],
    });

    const mm = new ProviderModule(mdef).toNaked();

    expect(mm.__isCurrentBound(EmptyService)).toBe(true);
    expect(mm.__isCurrentBound(EmptyService2)).toBe(true);
  });

  it('should lazy import a `ProviderModuleDefinition`', () => {
    const m = new ProviderModule({
      identifier: 'm',
    }).toNaked();

    const mdef = new ProviderModuleDefinition({
      identifier: 'mdef',
      providers: [EmptyService3],
      exports: [EmptyService3],
    });

    m.lazyImport(mdef);

    expect(m.__isCurrentBound(EmptyService3)).toBe(true);
  });
});
