import {
  AppModule,
  InjectionError,
  InjectionProviderModuleError,
  InjectionProviderModuleMissingProviderError,
  ProviderModule,
} from '../src';
import { EmptyService, GlobalService } from './setup';

describe('AppModule', () => {
  afterEach(() => jest.clearAllMocks());

  it('should throw when creating a `ProviderModule` having its `id` set to `AppModule`', () => {
    expect(() => ProviderModule.create({ id: 'AppModule' })).toThrow(InjectionError);
  });

  it('should throw when trying to get an unbound provider', () => {
    expect(() => AppModule.get(EmptyService)).toThrow(InjectionProviderModuleMissingProviderError);
  });

  it('should have the `GlobalService` bound', () => {
    expect(AppModule.hasProvider(GlobalService)).toBe(true);
  });

  it('should throw when a module tries to import the `AppModule`', () => {
    expect(() => ProviderModule.create({ id: 'm0', imports: [AppModule] })).toThrow(InjectionProviderModuleError);
  });
});
