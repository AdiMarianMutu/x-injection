import { AppModule, ProviderModule } from '../../src';
import { GlobalService } from './services';

export const EmptyModule = new ProviderModule({ identifier: 'EmptyModule' }).toNaked();
export const GlobalModule = new ProviderModule({
  identifier: 'GlobalModule',
  markAsGlobal: true,
  providers: [GlobalService],
  exports: [GlobalService],
}).toNaked();

export const TestAppModule = AppModule.register<true>({
  imports: [GlobalModule],
  providers: [{ provide: 'CONSTANT', useValue: '22.03.2013' }],
}).toNaked();
