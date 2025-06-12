<h1 align="center">
xInjection&nbsp;<a href="https://www.npmjs.com/package/@adimm/x-injection" target="__blank"><img src="https://badgen.net/npm/v/@adimm/x-injection"></a>
<img src="https://badgen.net/npm/license/@adimm/x-injection">
<a href="https://app.codecov.io/gh/AdiMarianMutu/x-injection" target="__blank"><img src="https://badgen.net/codecov/c/github/AdiMarianMutu/x-injection"></a>
</h1>

<p align="center">
<a href="https://github.com/AdiMarianMutu/x-injection/actions/workflows/ci.yml?query=branch%3Amain" target="__blank"><img src="https://github.com/AdiMarianMutu/x-injection/actions/workflows/ci.yml/badge.svg?branch=main"></a>
<a href="https://github.com/AdiMarianMutu/x-injection/actions/workflows/publish.yml" target="__blank"><img src="https://github.com/AdiMarianMutu/x-injection/actions/workflows/publish.yml/badge.svg"></a>
<br>
<img src="https://badgen.net/bundlephobia/minzip/@adimm/x-injection">
<a href="https://www.npmjs.com/package/@adimm/x-injection" target="__blank"><img src="https://badgen.net/npm/dm/@adimm/x-injection"></a>
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
- [Provider Modules](#provider-modules)
  - [ProviderModuleDefinition](#providermoduledefinition)
    - [Feed to `new ProviderModule`](#feed-to-new-providermodule)
    - [Feed to `lazyImport`](#feed-to-lazyimport)
    - [Why not just use the `ProviderModuleOptions` interface?](#why-not-just-use-the-providermoduleoptions-interface)
  - [Lazy `imports` and `exports`](#lazy-imports-and-exports)
    - [Imports](#imports)
    - [Exports](#exports)
- [Advanced Usage](#advanced-usage)
  - [ProviderModuleNaked Interface](#providermodulenaked-interface)
  - [Strict Mode](#strict-mode)
    - [Why you should not turn it off:](#why-you-should-not-turn-it-off)
      - [MarkAsGlobal](#markasglobal)
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

> **Note:** _All modules which are imported into the `AppModule` must have the [markAsGlobal](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#markasglobal) option set to `true`, otherwise the [InjectionProviderModuleGlobalMarkError](https://adimarianmutu.github.io/x-injection/classes/InjectionProviderModuleGlobalMarkError.html) exception will be thrown!_
>
> **Note2:** _An [InjectionProviderModuleGlobalMarkError](https://adimarianmutu.github.io/x-injection/classes/InjectionProviderModuleGlobalMarkError.html) exception will be thrown also when importing into the `AppModule` a module which does **not** have the [markAsGlobal](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#markasglobal) flag option!_

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

The [Transient](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#transient) injection scope means that a _new_ instance of the dependency will be used whenever a resolution occurs.

Example:

```ts
expect(MyModule.get(MyProvider)).toBe(MyModule.get(MyProvider));
// false
```

#### Request

The [Request](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#request) injection scope means that the _same_ instance will be used when a resolution happens in the _same_ request scope.

Example:

```ts
@Injectable(InjectionScope.Transient)
class Book {
  author: string;
}

@Injectable(InjectionScope.Request)
class Metro2033 extends Book {
  override author = 'Dmitry Alekseyevich Glukhovsky';
}

@Injectable(InjectionScope.Transient)
class Library {
  constructor(
    public readonly metro2033: Metro2033,
    public readonly metro2033_reference: Metro2033
  ) {}
}

const winstonLibrary = MyModule.get(Library);
const londonLibrary = MyModule.get(Library);

expect(winstonLibrary.metro2033).toBe(winstonLibrary.metro2033_reference);
expect(londonLibrary.metro2033).toBe(londonLibrary.metro2033_reference);
// true

expect(winstonLibrary.metro2033).toBe(londonLibrary.metro2033);
// false
```

## Provider Modules

You can define `modules` to encapsulate related providers and manage their scope:

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
  // or:  identifier: 'DatabaseModule',
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

**Inject multiple dependencies:**

```ts
const [serviceA, serviceB] = BigModule.getMany(ServiceA, ServiceB);
// or
const [serviceC, serviceD] = BigModule.getMany<[ServiceC, ServiceD]>(SERVICE_TOKEN, 'SERVICE_ID');
```

### ProviderModuleDefinition

When you do:

```ts
const MyModule = new ProviderModule({...});
```

The `MyModule` will be eagerly instantiated, therefore creating under-the-hood an unique container for the `MyModule` instance.

In some scenarios you may need/want to avoid that, you can achieve that by using the [ProviderModuleDefinition](https://adimarianmutu.github.io/x-injection/interfaces/IProviderModuleDefinition.html) `class`. It allows you to just define a _blueprint_ of the `ProviderModule` without all the overhead of instantiating the actual module.

```ts
const GarageModuleDefinition = new ProviderModuleDefinition({ identifier: 'GarageModuleDefinition' });

// You can always edit all the properties of the definition.

GarageModuleDefinition.imports = [...GarageModuleDefinition.imports, PorscheModule, FerrariModuleDefinition];
```

#### Feed to `new ProviderModule`

```ts
const GarageModule = new ProviderModule(GarageModuleDefinition);
```

#### Feed to `lazyImport`

```ts
ExistingModule.lazyImport(GarageModuleDefinition);
```

> **Note:** _Providing it to the `lazyImport` method will automatically instantiate a new `ProviderModule` on-the-fly!_

#### Why not just use the `ProviderModuleOptions` interface?

That's a very good question! It means that you understood that the `ProviderModuleDefinition` is actually a `class` wrapper of the `ProviderModuleOptions`.

Theoretically you _can_ use a _plain_ `object` having the `ProviderModuleOptions` interface, however, the `ProviderModuleOptions` interface purpose is solely to _expose/shape_ the options with which a module can be instantiated, while the `ProviderModuleDefinition` purpose is to _define_ the actual `ProviderModule` _blueprint_.

### Lazy `imports` and `exports`

You can also lazy import or export `providers`/`modules`, usually you don't need this feature, but there may be some advanced cases where you may want to be able to do so.

> The lazy nature defers the actual module resolution, this may help in breaking immediate circular reference chain under some circumstances.

#### Imports

You can lazily `import` a `module` by invoking the [lazyImport](https://adimarianmutu.github.io/x-injection/interfaces/IProviderModule.html#lazyimport) `method` at any time in your code.

```ts
const GarageModule = new ProviderModule({
  identifier: 'GarageModule',
  // Eager imports happen at module initialization
  imports: [FerrariModule, PorscheModule, ...]
});

// Later in your code

GarageModule.lazyImport(LamborghiniModule, BugattiModule, ...);
```

#### Exports

You can lazily `export` a `provider` or `module` by providing a `callback` _(it can also be an `async` callback)_ as shown below:

```ts
const SecureBankBranchModule = new ProviderModule({
  identifier: 'SecureBankBranchModule',
  providers: [BankBranchService],
  exports: [BankBranchService],
});

const BankModule = new ProviderModule({
  identifier: 'BankModule',
  imports: [SecureBankBranchModule],
  exports: [..., (importerModule) => {
    // When the module having the identifier `UnknownBankModule` imports the `BankModule`
    // it'll not be able to also import the `SecureBankBranchModule` as we are not returning it here.
    if (importerModule.toString() === 'UnknownBankModule') return;

    // Otherwise we safely export it
    return SecureBankBranchModule;
  }]
});
```

## Advanced Usage

### ProviderModuleNaked Interface

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

### Strict Mode

By default the `AppModule` runs in "strict mode", a built-in mode which enforces an _opinionated_ set of rules aiming to reduce common pitfalls and edge-case bugs.

When invoking the [AppModule.register](https://adimarianmutu.github.io/x-injection/interfaces/IAppModule.html#register-1) `method` you can set the [\_strict](https://adimarianmutu.github.io/x-injection/interfaces/AppModuleOptions.html#_strict) property to `false` in order to permanentely disable those set of built-in rules.

> **Note:** _Do not open an `issue` if a bug or edge-case is caused by having the `strict` property disabled!_

#### Why you should not turn it off:

##### MarkAsGlobal

The [markAsGlobal](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#markasglobal) flag property is used to make sure that `modules` which should be registered directly into the `AppModule` are indeed provided to the the `imports` array of the `AppModule` and the the other way around, if a `module` is imported into the `AppModule` without having the `markAsGlobal` flag property set, it'll throw an error.

This may look redundant, but it may save you _(and your team)_ some hours of debugging in understanding why some `providers` are able to make their way into other `modules`. As those `providers` are now acting as _global_ `providers`.

Imagine the following scenario:

```ts
const ScopedModule = new ProviderModule({
  identifier: 'ScopedModule',
  providers: [...],
  exports: [...],
});

const AnotherScopedModule = new ProviderModule({
  identifier: 'AnotherScopedModule',
  imports: [ScopedModule],
  providers: [...],
  exports: [...],
});

const GlobalModule = new ProviderModule({
  identifier: 'GlobalModule',
  markAsGlobal: true,
  imports: [AnotherScopedModule],
});

AppModule.register({
  imports: [GlobalModule],
});
```

At first glance you may not spot/understand the issue there, but because the `GlobalModule` _(which is then imported into the `AppModule`)_ is _directly_ importing the `AnotherScopedModule`, it means that _all_ the `providers` of the `AnotherScopedModule` and `ScopedModule` _(because `AnotherScopedModule` also imports `ScopedModule`)_ will become accessible through your entire app!

Disabling `strict` mode removes this safeguard, allowing any module to be imported into the `AppModule` regardless of `markAsGlobal`, increasing risk of bugs by exposing yourself to the above example.

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
