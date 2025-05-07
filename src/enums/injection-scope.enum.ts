export enum InjectionScope {
  /** When the service is resolved, the same cached resolved value will be used. */
  Singleton,

  /** When the service is resolved, a new resolved value will be used each time. */
  Transient,

  /** When the service is resolved within the same container request, the same resolved value will be used. */
  Request,
}
