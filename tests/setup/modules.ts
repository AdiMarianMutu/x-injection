import { ProviderModule } from '../../src';
import { GlobalService } from './services';

export const EmptyModule = ProviderModule.create({ id: 'EmptyModule' });

export const GlobalModule = new ProviderModule({
  id: 'GlobalModule',
  isGlobal: true,
  providers: [GlobalService, { provide: 'CONSTANT', useValue: '22.03.2013' }],
  exports: [GlobalService, 'CONSTANT'],
});
