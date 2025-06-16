import { Injectable, ProviderModule } from '../../src';

@Injectable()
export class LazyModuleService {}

export const LazyModule = ProviderModule.create({
  id: 'LazyModule',
  providers: [LazyModuleService],
  exports: [LazyModuleService],
});
