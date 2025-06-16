export class Signal<T> {
  private value: T;

  private readonly subscribers = new Set<SignalCallback<T>>();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  /** Can be used to `emit` a _new_ value and notify the _subscribers_. */
  emit(newValue: T): void {
    this.value = newValue;

    this.subscribers.forEach((cb) => cb(this.value));
  }

  /** Can be used to retrieve the _current_ value of the {@link Signal} imperatively. */
  get(): T {
    return this.value;
  }

  /**
   * Can be used to `subscribe` to the emitted values of this {@link Signal}.
   *
   * @param callback The `callback` which will be invoked when a _new_ value is emitted.
   * @param invokeImmediately When set to `true` it'll invoke the provided {@link callback} immediately with the latest value available. _(defaults to `false`)_
   */
  subscribe(callback: SignalCallback<T>, invokeImmediately?: boolean): () => void {
    this.subscribers.add(callback);

    if (invokeImmediately) callback(this.value);

    return () => this.subscribers.delete(callback);
  }

  /** Disposes of the internal references. */
  dispose(): void {
    //@ts-expect-error Read-only property.
    this.subscribers = null;
    this.value = null as any;
  }
}

type SignalCallback<T> = (value: T) => void | Promise<void>;
