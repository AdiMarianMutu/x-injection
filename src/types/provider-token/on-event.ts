import type { BindingActivation, BindingDeactivation } from 'inversify';

export interface OnEvent<T> {
  /**
   * Sets a binding activation handler. The activation handler is invoked after a dependency has been resolved
   * and before it is added to a scope cache. The activation handler will not be
   * invoked if the dependency is taken from a scope cache.
   */
  activation?: BindingActivation<T>;

  /**
   * Sets a binding deactivation handler on a singleton scope binding.
   * The deactivation handler is called when the binding is unbound from a container.
   */
  deactivation?: BindingDeactivation<T>;
}
