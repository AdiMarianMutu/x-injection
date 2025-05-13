<h1 align="center">
xInjection&nbsp;<a href="https://www.npmjs.com/package/@adimm/x-injection" target="__blank" alt="Release Version"><img src="https://badgen.net/npm/v/@adimm/x-injection"></a>
<img src="https://badgen.net/npm/license/@adimm/x-injection" alt="License">
<a href="https://app.codecov.io/gh/AdiMarianMutu/x-injection" target="__blank" alt="Release Version"><img src="https://badgen.net/codecov/c/github/AdiMarianMutu/x-injection"></a>
</h1>

<p align="center">
<a href="https://github.com/AdiMarianMutu/x-injection/actions/workflows/ci.yml?query=branch%3Amain" target="__blank"><img src="https://github.com/AdiMarianMutu/x-injection/actions/workflows/ci.yml/badge.svg?branch=main"></a>
<a href="https://github.com/AdiMarianMutu/x-injection/actions/workflows/publish.yml" target="__blank"><img src="https://github.com/AdiMarianMutu/x-injection/actions/workflows/publish.yml/badge.svg"></a>
<br>
<img src="https://badgen.net/bundlephobia/minzip/@adimm/x-injection">
<a href="https://www.npmjs.com/package/@adimm/x-injection" target="__blank" alt="Monthly Downloads"><img src="https://badgen.net/npm/dm/@adimm/x-injection"></a>
</p>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
  - [TypeScript Configuration](#typescript-configuration)
- [Getting Started](#getting-started)
  - [Bootstrapping the AppModule](#bootstrapping-the-appmodule)
  - [Registering Global Providers](#registering-global-providers)
  - [Registering Global Modules](#registering-global-modules)
  - [Injection Scope](#injection-scope)
    - [Singleton](#singleton)
    - [Transient](#transient)
    - [Request](#request)
- [Custom Provider Modules](#custom-provider-modules)
  - [Dynamic Exports](#dynamic-exports)
- [Advanced Usage](#advanced-usage)
- [Unit Tests](#unit-tests)
- [Documentation](#documentation)
- [ReactJS Implementation](#reactjs-implementation)
- [Contributing](#contributing)

## Overview

**xInjection** is a robust Inversion of Control [(IoC)](https://en.wikipedia.org/wiki/Inversion_of_control) library that extends [InversifyJS](https://github.com/inversify/InversifyJS) with a modular, [NestJS](https://github.com/nestjs/nest)-inspired Dependency Injection [(DI)](https://en.wikipedia.org/wiki/Dependency_injection) system. It enables you to **encapsulate** dependencies with fine-grained control using **[ProviderModule](https://adimarianmutu.github.io/x-injection/classes/ProviderModule.html)** classes, allowing for clean **separation** of concerns and **scalable** architecture.

Each `ProviderModule` manages its _own_ container, supporting easy **decoupling** and _explicit_ control over which providers are **exported** and **imported** across modules. The global **[AppModule](https://adimarianmutu.github.io/x-injection/variables/AppModule.html)** is always available, ensuring a seamless foundation for your application's DI needs.

## Features

- **NestJS-inspired module system:** Import and export providers between modules.
- **Granular dependency encapsulation:** Each module manages its own container.
- **Flexible provider scopes:** [Singleton](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#singleton), [Request](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#request), and [Transient](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#transient) lifecycles.
- **Lifecycle hooks:** [onReady](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#onready) and [onDispose](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#ondispose) for _module_ initialization and cleanup.
- **Advanced container access:** Directly interact with the underlying [InversifyJS containers](https://inversify.io/docs/api/container/) if needed.

## Installation

First, ensure you have [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata) installed:

```sh
npm i reflect-metadata
```

Then install `xInjection`:

```sh
npm i @adimm/x-injection
```

### TypeScript Configuration

Add the following options to your `tsconfig.json` to enable decorator metadata:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Getting Started

### Bootstrapping the AppModule

In your application's entry point, import and register the global `AppModule`:

```ts
import { AppModule } from '@adimm/x-injection';

AppModule.register({});
```

> **Note:** You must call `AppModule.register()` even if you have no global providers. Passing an empty object `{}` is valid.

### Registering Global Providers

To make services available throughout your application, register them as global providers:

```ts
import { AppModule, Injectable } from '@adimm/x-injection';

@Injectable()
class LoggerService {}

@Injectable()
class ConfigService {
  constructor(private readonly logger: LoggerService) {}
}

AppModule.register({
  providers: [LoggerService, ConfigService],
});
```

Now, `LoggerService` and `ConfigService` can be injected anywhere in your app, including inside all `ProviderModules`.

### Registering Global Modules

You can also import entire modules into the `AppModule` like so:

```ts
const SECRET_TOKEN_PROVIDER = { provide: 'SECRET_TOKEN', useValue: '123' };
const SECRET_TOKEN_2_PROVIDER = { provide: 'SECRET_TOKEN_2', useValue: 123 };

const ConfigModule = new ProviderModule({
  identifier: Symbol('ConfigModule'),
  markAsGlobal: true,
  providers: [SECRET_TOKEN_PROVIDER, SECRET_TOKEN_2_PROVIDER],
  exports: [SECRET_TOKEN_PROVIDER, SECRET_TOKEN_2_PROVIDER],
});

AppModule.register({
  imports: [ConfigModule],
});
```

> **Note:** _All modules which are imported into the `AppModule` must have the [markAsGlobal](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#markAsGlobal) option set to `true`, otherwise the [InjectionProviderModuleGlobalMarkError](https://adimarianmutu.github.io/x-injection/classes/InjectionProviderModuleGlobalMarkError.html) exception will be thrown!_
>
> **Note2:** _An [InjectionProviderModuleGlobalMarkError](https://adimarianmutu.github.io/x-injection/classes/InjectionProviderModuleGlobalMarkError.html) exception will be thrown also when importing into the `AppModule` a module which does **not** have the [markAsGlobal](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#markAsGlobal) flag option!_

### Injection Scope

There are mainly 3 first-class ways to set the [InjectionScope](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html) of a provider, and each one has an order priority.
The below list shows them in order of priority _(highest to lowest)_, meaning that if 2 _(or more)_ ways are used, the method with the highest priority will take precedence.

1. By providing the [scope](https://adimarianmutu.github.io/x-injection/interfaces/ProviderScopeOption.html) property to the [ProviderToken](https://adimarianmutu.github.io/x-injection/types/ProviderToken.html):
   ```ts
   const USER_PROVIDER: ProviderToken<UserService> = {
     scope: InjectionScope.Request,
     provide: UserService,
     useClass: UserService,
   };
   ```
2. Within the [@Injectable](https://adimarianmutu.github.io/x-injection/functions/Injectable.html) decorator:
   ```ts
   @Injectable(InjectionScope.Transient)
   class Transaction {}
   ```
3. By providing the [defaultScope](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#defaultscope) property when initializing a `ProviderModule`:
   ```ts
   const RainModule = new ProviderModule({
     identifier: Symbol('RainModule'),
     defaultScope: InjectionScope.Transient,
   });
   ```

> **Note:** _Imported modules/providers retain their original `InjectionScope`!_

#### Singleton

The [Singleton](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#singleton) injection scope means that once a dependency has been resolved from within a module will be cached and further resolutions will use the value from the cache.

Example:

```ts
expect(MyModule.get(MyProvider)).toBe(MyModule.get(MyProvider));
// true
```

#### Transient

The [Singleton](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#transient) injection scope means that a _new_ instance of the dependency will be used whenever a resolution occurs.

Example:

```ts
expect(MyModule.get(MyProvider)).toBe(MyModule.get(MyProvider));
// false
```

#### Request

The [Request](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#request) injection scope means that the _same_ instance will be used when a resolution happens in the _same_ request scope.

Example:

```ts
class Book {}

class Box {
  constructor(
    private readonly book0: Book,
    private readonly book1: Book
  ) {}
}

const box0 = MyModule.get(Box);
const box1 = MyModule.get(Box);

expect(box0.book0).toBe(box0.book1);
// true

expect(box0.book0).toBe(box1.book0);
// false
```

## Custom Provider Modules

You can define custom modules to encapsulate related providers and manage their scope:

```ts
import { Injectable, InjectionScope, ProviderModule } from '@adimm/x-injection';

@Injectable()
export class DatabaseService {
  // Implementation...
}

@Injectable()
export class SessionService {
  constructor(public readonly userService: UserService) {}

  // Implementation...
}

export const DatabaseModule = new ProviderModule({
  identifier: Symbol('DatabaseModule'),
  providers: [DatabaseService],
  exports: [DatabaseService],
  onReady: async (module) => {
    const databaseService = module.get(DatabaseService);

    // Additional initialization...
  },
  onDispose: async (module) => {
    const databaseService = module.get(DatabaseService);

    databaseService.closeConnection();
  },
});

export const SessionModule = new ProviderModule({
  identifier: Symbol('SessionModule'),
  defaultScope: InjectionScope.Request,
  providers: [SessionService],
  exports: [SessionService],
});
```

Register these modules in your `AppModule`:

```ts
AppModule.register({
  imports: [DatabaseModule, SessionModule],
});
```

> **Note:** The `AppModule.register` method can be invoked only _once_! _(You may re-invoke it only after the module has been disposed)_ Preferably during your application bootstrapping process.

From now on, the `AppModule` container has the references of the `DatabaseService` and the `SessionService`.
But it is important to keep in mind of some aspects:

- We know that the `DatabaseService` scope is set to `Singleton`.
- We know that the `SessionService` scope is set to `Request`.

This means that if we do:

```ts
const databaseService_a = AppModule.get(DatabaseService);
const databaseService_b = AppModule.get(DatabaseService);

expect(databaseService_a).toBe(databaseService_b);
```

Will produce `true`, but, doing:

```ts
const sessionService_a = AppModule.get(SessionService);
const sessionService_b = AppModule.get(SessionService);

expect(sessionService_a).toBe(sessionService_b);
```

Will produce `false` because Inversify's [Request](https://inversify.io/docs/fundamentals/binding/#request) scope acts as a `Singleton` scope within the same module context
and as a `Transient` scope outside the module context.

**Inject multiple dependencies:**

```ts
const [serviceA, serviceB] = BigModule.getMany(ServiceA, ServiceB);
// or
const [serviceC, serviceD] = BigModule.getMany<[ServiceC, ServiceD]>(SERVICE_TOKEN, 'SERVICE_ID');
```

### Dynamic Exports

`xInjection` allows a `ProviderModule` to also dynamically choose _what_ and _when_ to export a provider/module.

> **With great power comes great responsibility! 🥸**

This is a very powerful feature and for the most use cases, you'll not need to use it.
However, if you may ever need to use a dynamic export, here is a simple example:

```ts
class WingsService {}

class AnimalService {}

class CatService extends AnimalService {
  // This line throws an error at some point.
  constructor(public readonly wings: WingsService) {}
}

class CrowService extends AnimalService {
  constructor(public readonly wings: WingsService) {}
}

const AnimalModule = new ProviderModule({
  identifier: Symbol('AnimalModule'),
  providers: [AnimalService, { provide: WingsService, useClass: WingsService, scope: InjectionScope.Transient }],
  exports: [AnimalService, WingsService],
  dynamicExports: (importerModule, moduleExports) => {
    // If the importer module is `CrowModule`, we'll export the entire
    // `exports` list, because `moduleExports` is actually the `exports` array declared above.
    // Meaning that the `CrowModule` container will also have access to the `WingsService`
    if (importerModule.toString() === 'CrowModule') return moduleExports;

    // Otherwise it is the `CatModule` and we are not
    // exporting the `WingsService` as cats don't fly, or do they fly? 🧐
    return [AnimalService];
  },
});

const CrowModule = new ProviderModule({
  identifier: Symbol('CrowModule'),
  imports: [AnimalModule],
  providers: [CrowService],
  exports: [CrowService],
});

const CatModule = new ProviderModule({
  identifier: Symbol('CatModule'),
  imports: [AnimalModule],
  providers: [CatService],
  exports: [CatService],
});
```

Hopefully the provided example shows how powerful the `dynamicExports` property it is, but, there are some things to keep in mind in order to avoid nasty bugs!

1. You **must always** return only the providers/modules declared into the static `exports` array.
2. You **can** return _less_ providers/modules as long as they are still part of the static `exports` array.
3. You **cannot** return _more_ providers/modules than the static `exports` array!

> When point number `1` and point number `3` are triggered, the library will throw a descriptive error which should help to find the culprit module.

## Advanced Usage

Each `ProviderModule` instance implements the `IProviderModule` interface for simplicity, but can be cast to `IProviderModuleNaked` for advanced operations:

```ts
const nakedModule = ProviderModuleInstance.toNaked();
// or: nakedModule = ProviderModuleInstance as IproviderModuleNaked;
const inversifyContainer = nakedModule.container;
```

You can also access the global `InversifyJS` container directly:

```ts
import { AppModule, GlobalContainer } from '@adimm/x-injection';

const globalContainer = GlobalContainer || AppModule.toNaked().container;
```

For advanced scenarios, `IProviderModuleNaked` exposes additional methods (prefixed with `__`) that wrap InversifyJS APIs, supporting native `xInjection` provider tokens and more.

## Unit Tests

It is very easy to create mock modules so you can use them in your unit tests.

```ts
class ApiService {
  constructor(private readonly userService: UserService) {}

  async sendRequest<T>(location: LocationParams): Promise<T> {
    // Pseudo Implementation
    return this.sendToLocation(user, location);
  }

  private async sendToLocation(user: User, location: any): Promise<any> {}
}

const ApiModule = new ProviderModule({
  identifier: Symbol('ApiModule'),
  providers: [UserService, ApiService],
});

const ApiModuleMocked = new ProviderModule({
  identifier: Symbol('ApiModule_MOCK'),
  providers: [
    {
      provide: UserService,
      useClass: UserService_Mock,
    },
    {
      provide: ApiService,
      useValue: {
        sendRequest: async (location) => {
          console.log(location);
        },
      },
    },
  ],
});
```

Now what you have to do is just to provide the `ApiModuleMocked` instead of the `ApiModule` 😎

## Documentation

Comprehensive, auto-generated documentation is available at:

👉 [https://adimarianmutu.github.io/x-injection/index.html](https://adimarianmutu.github.io/x-injection/index.html)

## ReactJS Implementation

You want to use it within a [ReactJS](https://react.dev/) project? Don't worry, the library does already have an official implementation for React ⚛️

For more details check out the [GitHub Repository](https://github.com/AdiMarianMutu/x-injection-reactjs).

## Contributing

Pull requests are warmly welcomed! 😃

Please ensure your contributions adhere to the project's code style. See the repository for more details.

---

> For questions, feature requests, or bug reports, feel free to open an [issue](https://github.com/AdiMarianMutu/x-injection/issues) on GitHub!
