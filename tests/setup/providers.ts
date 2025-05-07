import type { ProviderClassToken, ProviderFactoryToken, ProviderValueToken } from '../../src/types';
import { EmptyService, LoggerService, UserService } from './services';

export const CLASS_PROVIDER: ProviderClassToken<EmptyService> = {
  provide: 'CLASS_PROVIDER',
  useClass: EmptyService,
};

export const VALUE_PROVIDER: ProviderValueToken<EmptyService> = {
  provide: 'VALUE_PROVIDER',
  useValue: new EmptyService(),
};

export const FACTORY_PROVIDER: ProviderFactoryToken<EmptyService> = {
  provide: 'FACTORY_PROVIDER',
  useFactory: () => new EmptyService(),
};

export const COMPLEX_FACTORY_PROVIDER: ProviderFactoryToken<{
  loggerService: LoggerService;
  userService: UserService;
  emptyService: EmptyService;
}> = {
  provide: 'COMPLEX_FACTORY_PROVIDER',
  useFactory: (loggerService: LoggerService, userService: UserService) => {
    return {
      loggerService,
      userService,
      emptyService: new EmptyService(),
    };
  },
  inject: [LoggerService, 'USER_SERVICE'],
};
