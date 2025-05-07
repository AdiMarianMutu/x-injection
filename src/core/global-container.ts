import { Container } from 'inversify';

/**
 * The low-level App Container.
 *
 * **Internally used, please use the `AppModule` to interact with it.**
 */
export const GlobalContainer = new Container({
  defaultScope: 'Singleton',
});
