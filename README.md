<h1 align="center">
xInjection&nbsp;<a href="https://www.npmjs.com/package/@adimm/x-injection" target="__blank"><img src="https://badgen.net/npm/v/@adimm/x-injection"></a>
<a href="https://app.codecov.io/gh/AdiMarianMutu/x-injection" target="__blank"><img src="https://badgen.net/codecov/c/github/AdiMarianMutu/x-injection"></a>
<img src="https://badgen.net/npm/license/@adimm/x-injection">
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
  - [Quick Start](#quick-start)
  - [Glossary](#glossary)
    - [ProviderModule](#providermodule)
    - [AppModule](#appmodule)
    - [Blueprint](#blueprint)
    - [Definition](#definition)
  - [Conventions](#conventions)
    - [ProviderModule](#providermodule-1)
    - [Blueprints](#blueprints)
    - [ProviderToken](#providertoken)
  - [AppModule](#appmodule-1)
- [ProviderModule API](#providermodule-api)
- [Injection Scope](#injection-scope)
  - [Singleton](#singleton)
  - [Transient](#transient)
  - [Request](#request)
- [Provider Tokens](#provider-tokens)
- [Provider Modules](#provider-modules)
- [Blueprints](#blueprints-1)
  - [Import Behavior](#import-behavior)
  - [isGlobal](#isglobal)
- [Advanced Usage](#advanced-usage)
  - [Events](#events)
  - [Middlewares](#middlewares)
  - [Internals](#internals)
    - [ProviderModule](#providermodule-2)
    - [MiddlewaresManager](#middlewaresmanager)
    - [ModuleContainer](#modulecontainer)
    - [ImportedModuleContainer](#importedmodulecontainer)
    - [DynamicModuleDefinition](#dynamicmoduledefinition)
    - [ProviderModuleBlueprint](#providermoduleblueprint)
    - [Set of Helpers](#set-of-helpers)
- [Unit Tests](#unit-tests)
- [Documentation](#documentation)
- [ReactJS Implementation](#reactjs-implementation)
- [Contributing](#contributing)
- [Credits](#credits)

## Overview

**xInjection** is a robust Inversion of Control [(IoC)](https://en.wikipedia.org/wiki/Inversion_of_control) library that extends [InversifyJS](https://github.com/inversify/InversifyJS) with a modular, [NestJS](https://github.com/nestjs/nest)-inspired Dependency Injection [(DI)](https://en.wikipedia.org/wiki/Dependency_injection) system. It enables you to **encapsulate** dependencies with fine-grained control using **[ProviderModule](https://adimarianmutu.github.io/x-injection/classes/IProviderModule.html)** classes, allowing for clean **separation** of concerns and **scalable** architecture.

Each `ProviderModule` manages its _own_ container, supporting easy **decoupling** and _explicit_ control over which providers are **exported** and **imported** across modules. The global **[AppModule](https://adimarianmutu.github.io/x-injection/variables/AppModule.html)** is always available, ensuring a seamless foundation for your application's DI needs.

## Features

- **NestJS-inspired module system:** Import and export providers between modules.
- **Granular dependency encapsulation:** Each module manages its own container.
- **Flexible provider scopes:** [Singleton](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#singleton), [Request](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#request), and [Transient](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#transient) lifecycles.
- **Lifecycle hooks:** [onReady](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#onready), [onReset](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#onreset) and [onDispose](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#ondispose) for _module_ initialization and cleanup.
- **Middlewares:** Tap into the low-level implementation without any effort by just adding new `middlewares`.
- **Events:** Subscribe to internal events for maximum control.
- **Blueprints:** Plan ahead your `modules` without eagerly instantiating them.
- **Fully Agnostic:** It doesn't rely on any framework, just on [InversifyJS](https://inversify.io/) as it uses it under-the-hood to build the containers. It works the same both client side and server side.

## Installation

First, ensure you have [`reflect-metadata`](https://www.npmjs.com/package/reflect-metadata) installed:

```sh
npm i reflect-metadata
```

> [!NOTE]
>
> You may have to add `import 'reflect-metadata'` at the entry point of your application.

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

### Quick Start

```ts
import { Injectable, ProviderModule } from '@adimm/x-injection';

@Injectable()
class HelloService {
  sayHello() {
    return 'Hello, world!';
  }
}

const HelloModule = ProviderModule.create({
  id: 'HelloModule',
  providers: [HelloService],
  exports: [HelloService],
});

const helloService = HelloModule.get(HelloService);

console.log(helloService.sayHello());
// => 'Hello, world!'
```

### Glossary

#### ProviderModule

The core class of `xInjection`, if you ever worked with [NestJS](https://nestjs.com/) _(or [Angular](https://angular.dev/))_, you'll find it very familiar.

```ts
const GarageModule = ProviderModule.create({ id: 'GarageModule', imports: [], providers: [], exports: [] });
```

#### AppModule

It is a special instance of the `ProviderModule` class which acts as the `root` of your `modules` graph, all _global_ modules will be automatically imported into the `AppModule` and shared across all your modules.

#### Blueprint

Another core class which most probably you'll end using a lot too, to keep it short, it allows you to plan ahead the `modules` without instantiating them.

```ts
const CarModuleBlueprint = ProviderModule.blueprint({ id: 'CarModule', imports: [], providers: [], exports: [] });
```

#### Definition

It is used to refer to the three main blocks of a module:

- [imports](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#imports)
- [providers](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#providers)
- [exports](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#exports)

### Conventions

The library has some opinionated _naming_ conventions which you should adopt too

#### ProviderModule

All variables holding an _instance_ of a `ProviderModule` should be written in [PascalCase](https://www.wikidata.org/wiki/Q9761807) and _suffixed_ with `Module`, like this:

```ts
const DatabaseModule = ProviderModule.create({...});
const UserModule = ProviderModule.create({...});
const CarPartsModule = ProviderModule.create({...});
```

The `id` property of the `ProviderModule.options` should be the same as the `module` variable name.

```ts
const DatabaseModule = ProviderModule.create({ id: 'DatabaseModule' });
const UserModule = ProviderModule.create({ id: 'UserModule' });
const CarPartsModule = ProviderModule.create({ id: 'CarPartsModule' });
```

If you are exporting a `module` from a designated file, then you should name that file as following:

```
database.module.ts
user.module.ts
car-parts.module.ts
```

> [!TIP]
>
> If you install/use the [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme) VS Code extension, you'll see the `*.module.ts` files with a specific icon.

#### Blueprints

All variables holding an _instance_ of a `ProviderModuleBlueprint` should be written in [PascalCase](https://www.wikidata.org/wiki/Q9761807) too and _suffixed_ with `ModuleBp`, like this:

```ts
const DatabaseModuleBp = ProviderModule.blueprint({...});
const UserModuleBp = ProviderModule.blueprint({...});
const CarPartsModuleBp = ProviderModule.blueprint({...});
```

The `id` property of the `ProviderModuleBlueprint.options` should **not** end with `Bp` because when you'll import that `blueprint` into a `module`, the exact provided `id` will be used!

```ts
const DatabaseModuleBp = ProviderModule.create({ id: 'DatabaseModule' });
const UserModuleBp = ProviderModule.create({ id: 'UserModule' });
const CarPartsModuleBp = ProviderModule.create({ id: 'CarPartsModule' });
```

If you are exporting a `blueprint` from a designated file, then you should name that file as following:

```
database.module.bp.ts
user.module.bp.ts
car-parts.module.bp.ts
```

#### ProviderToken

All variables holding an _object_ representing a [ProviderToken](https://adimarianmutu.github.io/x-injection/types/ProviderToken.html) should be written in [SCREAMING_SNAKE_CASE](https://en.wikipedia.org/wiki/Snake_case) and _suffixed_ with `_PROVIDER`, like this:

```ts
const USER_SERVICE_PROVIDER = UserService;
```

If you are exporting a `provider token` from a designated file, then you should name that file as following:

```
user-service.provider.ts
```

### AppModule

As explained above, it is the `root` module of your application, it is always available and eagerly bootstrapped.

Usually you'll not interact much with it as any `module` which is defined as _global_ will be automatically imported into it, therefore having its `exports` definition available across all your modules _out-of-the-box_. However, you can use it like any `ProviderModule` instance.

> [!WARNING]
>
> Importing the `AppModule` into any `module` will throw an error!

You have 2 options to access it:

```ts
import { AppModule } from '@adimm/x-injection';
```

or

```ts
import { ProviderModule } from '@adimm/x-injection';

ProviderModule.APP_MODULE_REF;

// This option is mostly used internally, but you can 100% safely use it as well.
```

Providing global services to the `AppModule`:

```ts
@Injectable()
class UserService {}

AppModule.update.addProvider(UserService);
```

> [!NOTE]
>
> All `providers` scope is set to [Singleton](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#singleton) by default if not provided.

Yes, that's it, now you have access to the `UserService` anywhere in your app across your `modules`, meaning that you can now do:

```ts
const UnrelatedModule = ProviderModule.create({ id: 'UnrelatedModule' });

const userService = UnrelatedModule.get(UserService);
// returns the `userService` singleton instance.
```

## ProviderModule API

You can see all the available `properties` and `methods` of the `ProviderModule` [here](https://adimarianmutu.github.io/x-injection/classes/IProviderModule.html).

## Injection Scope

There are mainly 3 first-class ways to set the [InjectionScope](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html) of a `provider`, and each one has an order priority.
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
   const RainModuleDef = new ProviderModuleDef({
     identifier: 'RainModule',
     defaultScope: InjectionScope.Transient,
   });
   ```

> [!NOTE]
>
> _Imported modules/providers retain their original `InjectionScope`!_

### Singleton

The [Singleton](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#singleton) injection scope means that once a dependency has been resolved from within a module will be cached and further resolutions will use the value from the cache.

Example:

```ts
expect(MyModule.get(MyProvider)).toBe(MyModule.get(MyProvider));
// true
```

### Transient

The [Transient](https://adimarianmutu.github.io/x-injection/enums/InjectionScope.html#transient) injection scope means that a _new_ instance of the dependency will be used whenever a resolution occurs.

Example:

```ts
expect(MyModule.get(MyProvider)).toBe(MyModule.get(MyProvider));
// false
```

### Request

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

## Provider Tokens

A [ProviderToken](https://adimarianmutu.github.io/x-injection/types/ProviderToken.html) is another core block of `xInjection` _(and also many other IoC/DI libs)_ which is used to define a `token` which can then be used to resolve a `provider`.

`xInjection` offers _4_ types of tokens:

- [ProviderIdentifier](https://adimarianmutu.github.io/x-injection/types/ProviderIdentifier.html)
  - It allows you to bind a `value` to a specific _transparent_ token, like a `Class`, `Function`, `symbol` or `string`:
  ```ts
  const API_SERVICE_PROVIDER = ApiService;
  // or
  const CONSTANT_SECRET_PROVIDER = 'Shh';
  ```
- [ProviderClassToken](https://adimarianmutu.github.io/x-injection/types/ProviderClassToken.html)

  - It can be used define the token _and_ the provider:

  ```ts
  const HUMAN_SERVICE_PROVIDER = { provide: HumanService, useClass: FemaleService };

  // This will bind `HumanService` as the `token` and will resolve `FemaleService` from the container.
  ```

- [ProviderValueToken](https://adimarianmutu.github.io/x-injection/types/ProviderValueToken.html)

  - It can be used to easily bind _constant_ values, it can be anything, but once resolved it'll be cached and re-used upon further resolutions

  ```ts
  const THEY_DONT_KNOW_PROVIDER = { provide: CONSTANT_SECRET_PROVIDER, useValue: `They'll never know` };
  const THEY_MAY_KNOW_PROVIDER = { provide: CONSTANT_SECRET_PROVIDER, useValue: 'Maybe they know?' };

  // As you can see we now have 2 different ProviderTokens which use the same `provide` key.
  ```

- [ProviderFactoryToken](https://adimarianmutu.github.io/x-injection/types/ProviderFactoryToken.html)

  - It can be used to bind a `factory` which is intended for more complex scenarios:

  ```ts
  const MAKE_PIZZA_PROVIDER = {
    provide: 'MAKE_PIZZA',
    useFactory: async (apiService: ApiService, pizzaService: PizzaService) => {
      const typeOfPizza = await apiService.getTypeOfPizza();

      if (typeOfPizza === 'margherita') return pizzaService.make.margherita;
      if (typeOfPizza === 'quattro_stagioni') return pizzaService.make.quattroStagioni;
      // and so on
    },
    // optional
    inject: [API_SERVICE_PROVIDER, PizzaService],
  };
  ```

These are all the available `ProviderToken` you can use.

> [!NOTE]
>
> In `NestJS` and `Angular` you can't use a `ProviderToken` to _get_ a value, `xInjection` allows this pattern, but you must understand that what it actually does, is to use the _value_ from the `provide` property.

## Provider Modules

As you already saw till here, everything relies around the `ProviderModule` class, so let's dive a little more deep into understanding it.

The most straight forward way to _create/instantiate_ a new `module` is:

```ts
const MyModule = ProviderModule.create({
  id: 'MyModule',
  imports: [AnotherModule, SecondModule, ThirdModule],
  providers: [
    { provide: CONSTANT_SECRET_PROVIDER, useValue: 'ultra secret' },
    PizzaService,
    { provide: HumanService, useClass: FemaleService },
  ],
  exports: [SecondModule, ThirdModule, PizzaService],
});
```

From what we can see, the `MyModule` is importing into it 3 more modules, each of them may export one or more _(maybe nothing, that's valid too)_ providers, or even other `modules`.
Because we imported them into the `MyModule`, now we have access to any providers they may have chosen to export, and the same is true also for _their exported_ modules.

Then, we've chosen to _re-export_ from the `MyModule` the `SecondModule` and `ThirdModule`, meaning that if a different `module` imports `MyModule`, it'll automatically get access to those 2 modules as well. And in the end we also exported our own `PizzaService`, while the remaining other 2 providers, `CONSTANT_SECRET_PROVIDER` and `HumanService` can't be accessed when importing `MyModule`.

This is the _core_ feature of `xInjection` _(and `Angular`/`NestJS` DI system)_, being able to encapsulate the providers, so nothing can spill out without our explicit consent.

---

We could also achieve the above by using the `ProviderModule` API like this:

```ts
MyModule.update.addImport(AnotherModule);
MyModule.update.addImport(SecondModule, true); // `true` means "also add to the `exports` definition"
MyModule.update.addImport(ThirdModule, true);

MyModule.update.addProvider({ provide: CONSTANT_SECRET_PROVIDER, useValue: 'ultra secret' });
MyModule.update.addProvider(PizzaService, true);
MyModule.update.addProvider({ provide: HumanService, useClass: FemaleService });
```

Sometimes you may actually want to _lazy_ import a `module` from a _file_, this can be done very easily with `xInjection`:

```ts
(async () => {
  await MyModule.update.addImportLazy(async () => (await import('./lazy.module')).LazyModule);

  MyModule.isImportingModule('LazyModule');
  // => true
})();
```

> [!TIP]
>
> This design pattern is _extremely_ powerful and useful when you may have a lot of `modules` initializing during the app bootstrap process as you can defer their initialization, or even never load them if the user never needs those specific `modules` _(this is mostly applicable on the client-side rather than the server-side)_

Keep reading to understand how you can defer initialization of the modules _both_ `client-side` and `server-side`.

## Blueprints

The [ProviderModuleBlueprint](https://adimarianmutu.github.io/x-injection/classes/ProviderModuleBlueprint.html) `class` main purpose is to encapsulate the `definitions` of a `Module`, when you do `ProviderModule.blueprint({...})` you are _not_ actually creating an instance of the `ProviderModule` class, but an instance of the `ProviderModuleBlueprint` class.

Before diving into some examples, let's first clarify some important aspects about the behavior of the `blueprint` class.

### Import Behavior

Whenever you _import_ a `blueprint` into a `module`, it'll automatically be "transformed" to a `ProviderModule` instance by the engine, this step is crucial as a `blueprint` per se does not contain a _container_, just its _definitions_.

This has a "gotcha", because the conversion happens internally, you'll "not" be able to get a reference to that imported module, not directly at least _(I may change this in a future patch)_, this means that if you don't have the reference of the `ProviderModule`, you can't remove it from the _imported_ module _(if you'll ever need to remove it)_.

> [!NOTE]
>
> There's currently an workaround for this, you can `subscribe` to the `Import` event and get from there the `ProviderModule` instance, just make sure to check the `id` of the module via `module.toString()` when doing so.

It is also important, to understand the _injection_ `scope` of an imported `blueprint`; we previously learned that when we import a `blueprint` into a `module` it automatically creates an instance of the `ProviderModule` from it, this means that all the `singleton` providers of the `blueprint` definition are now _scoped singleton_, where _scoped_ means _singleton in relation to their imported module_.

### isGlobal

When you initialize a `blueprint` with the [isGlobal](https://adimarianmutu.github.io/x-injection/interfaces/ProviderModuleOptions.html#isglobal) property set to `true`, the out-of-the-box behavior is to _automatically_ import the `blueprint` into the `AppModule`. You can disable this behavior by setting the [autoImportIntoAppModuleWhenGlobal](https://adimarianmutu.github.io/x-injectioninterfaces/ModuleBlueprintOptions.html#autoimportintoappmodulewhenglobal) property to `false`

```ts
const GlobalModuleBp = ProviderModule.blueprint({..., isGlobal: true }, { autoImportIntoAppModuleWhenGlobal: false });
```

Now you can decide when to import it into the `AppModule` by doing `AppModule.addImport(GlobalModuleBp)`.

---

I highly recommend to take advantage of the `blueprints` nature in order to plan-ahead your `modules` and import them wherever you have to import only when needed;

Why?

- To _define module configurations upfront_ without incurring the cost of immediate initialization _(even if negligible)_.
- To reuse module _definitions across_ different parts of your application while maintaining isolated instances. _(when possible/applicable)_
- To _compose modules flexibly_, allowing you to adjust module dependencies dynamically before instantiation.

## Advanced Usage

> [!WARNING]
>
> This section covers advanced features which may add additional complexity _(or even bugs)_ to your application if you misuse them, use these features only if truly needed and after evaluating the _pros_ and _cons_ of each.

### Events

Each `module` will emit specific events through its life-cycle and you can intercept them by using the `Module.update.subscribe` method.

> [!TIP]
>
> [Here](https://adimarianmutu.github.io/x-injection/enums/DefinitionEventType.html) you can see all the available `events`

If you'd need to intercept a `get` request, you can achieve that by doing:

```ts
const CarModule = ProviderModule.create({
  id: 'CarModule',
  providers: [CarService],
});

CarModule.update.subscribe(({ type, change }) => {
  // We are interested only in the `GetProvider` event.
  if (type !== DefinitionEventType.GetProvider) return;

  // As our `CarModule` has only one provider, it is safe to assume
  // that the `change` will always be the `CarService` instance.
  const carService = change as CarService;

  console.log('CarService: ', carService);
});

const carService = CarModule.get(CarService);
// logs => CarService: <instance_of_car_service_here>
```

> [!WARNING]
>
> After subscribing to a `ProviderModule` signal emission, you should make sure to also `unsubscribe` if you don't need anymore to intercept the changes, not doing
> so may cause memory leaks if you have lots of `subscriptions` which do heavy computations!

The `subscribe` method will _always_ return a `method` having the signature `() => void`, when you invoke it, it'll close the pipe which intercepts the signal emitted by the `module`:

```ts
const unsubscribe = CarModule.update.subscribe(({ type, change }) => {
  /* heavy computation here */
});

// later in your code

unsubscribe();
```

> [!NOTE]
>
> Events are _always_ invoked _after_ middlewares

### Middlewares

Using middlewares is not encouraged as it allows you to tap into very deep low-level code which can cause unexpected bugs if not implemented carefully, however, `middlewares` are the perfect choice if you want to extend/alter the standard behavior of `module` as it allows you to decide what should happen with a resolved value _before_ it is returned to the `consumer`.

> [!TIP]
>
> [Here](https://adimarianmutu.github.io/x-injection/enums/MiddlewareType.html) you can see all the available `middlewares`

Let's say that you want to wrap all the returned values of a specific `module` within an object having this signature `{ timestamp: number; value: any }`. By using the `GetProvider` event will not do the trick because it _doesn't_ allow you to alter/change the actual returned value to the `consumer`, you can indeed alter the _content_ via reference, but not the _actual_ result.

So the easiest way to achieve that is by using the `BeforeGet` middleware as shown below:

```ts
const TransactionModule = ProviderModule.create(TransactionModuleBp);

TransactionModule.middlewares.add(MiddlewareType.BeforeGet, (provider, providerToken, inject) => {
  // We are interested only in the `providers` instances which are from the `Payment` class
  if (!(provider instanceof Payment)) return true;
  // or
  if (providerToken !== 'LAST_TRANSACTION') return true;

  // DON'T do this as you'll encounter an infinite loop
  const transactionService = TransactionModule.get(TransactionService);
  // If you have to inject into the middleware `context` from the `module`
  // use the `inject` parameter
  const transactionService = inject(TransactionService);

  return {
    timestamp: transactionService.getTimestamp(),
    value: provider,
  };
});

const transaction = TransactionModule.get('LAST_TRANSACTION');
// transaction => { timestamp: 1363952948, value: <Payment_instance> }
```

One more example is to add a `middleware` in order to _dynamically_ control which `modules` can import a specific `module` by using the [OnExportAccess](https://adimarianmutu.github.io/x-injection/enums/MiddlewareType.html#onexportaccess) flag.

```ts
const UnauthorizedBranchBankModule = ProviderModule.create({ id: 'UnauthorizedBranchBankModule' });
const SensitiveBankDataModule = ProviderModule.create({
  id: 'SensitiveBankDataModule',
  providers: [SensitiveBankDataService, NonSensitiveBankDataService],
  exports: [SensitiveBankDataService, NonSensitiveBankDataService],
});

SensitiveBankDataModule.middlewares.add(MiddlewareType.OnExportAccess, (importerModule, currentExport) => {
  // We want to deny access to our `SensitiveBankDataService` from the `exports` definition if the importer module is `UnauthorizedBranchBankModule`
  if (importerModule.toString() === 'UnauthorizedBranchBankModule' && currentExport === SensitiveBankDataService)
    return false;

  // Remaining module are able to import all our `export` definition
  // The `UnauthorizedBranchBankModule` is unable to import the `SensitiveBankDataService`
  return true;
});
```

> [!CAUTION]
>
> Returning `false` in a `middleware` will abort the chain, meaning that for the above example, no value would be returned.
> If you have to explicitly return a `false` boolean value, you may have to wrap your provider value as an workaround. _(`null` is accepted as a return value)_
>
> Meanwhile returning `true` means _"return the value without changing it"_.
>
> In the future this behavior may change, so if your business logic relies a lot on `middlewares` make sure to stay up-to-date with the latest changes.

It is also worth mentioning that you can apply _multiple_ middlewares by just invoking the `middlewares.add` method multiple times, they are executed in the same exact order as you applied them, meaning that the first invokation to `middlewares.add` will actually be the `root` of the chain.

If no error is thrown down the chain, all the registered middleware `callback` will be supplied with the necessary values.

> [!WARNING]
>
> It is the _developer_ responsability to catch any error down the `chain`!

### Internals

If you are not interested in understanding how `xInjection` works under the hood, you can skip this section 😌

#### ProviderModule

It is the head of everything, a `ProviderModule` is actually composed by several classes, each with its own purpose.

> [!TIP]
>
> You can get access to _all_ the internal instances by doing `new ProviderModule({...})` instead of `ProviderModule.create({...})`

#### MiddlewaresManager

It is the `class` which takes care of managing the registered `middlewares`, check it out [here](https://adimarianmutu.github.io/x-injection/classes/MiddlewaresManager.html).

Not much to say about it as its main role is to _register_ and _build_ the `middleware` chain.

#### ModuleContainer

It is the `class` which takes care of managing the `inversify` container, check it out [here](https://adimarianmutu.github.io/x-injection/classes/ModuleContainer.html).

Its main purpose is to initialize the module raw _([InversifyJS Container](https://inversify.io/docs/api/container/))_ `class` and to _bind_ the providers to it.

#### ImportedModuleContainer

It is the `class` which takes care of managing the _imported_ modules, check it out [here](https://adimarianmutu.github.io/x-injection/classes/ImportedModuleContainer.html).

Because `modules` can be imported into other modules, therefore creating a _complex_ `graph` of modules, the purpose of this class is to keep track and sync the changes of the `exports` definition of the _imported_ module.

The `ProviderModule` API is simple yet very powerful, you may not realize that doing `addImport` will cause _(based on how deep is the imported module)_ a chain reaction which the `ImportedModuleContainer` must keep track of in order to make sure that the _consumer_ `module` which imported the _consumed_ `module` has access only to the `providers`/`modules` explicitly exported by the _consumed_ `module`.

Therefore it is encouraged to keep things mostly static, as each `addProvider`, `addImport`, `removeImport` and so on have a penality cost on your application performance. This cost in most cases is negligible, however it highly depends on how the _developer_ uses the feature `xInjection` offers.

> "With great power comes great responsibility."

#### DynamicModuleDefinition

It is the `class` which takes care of managing the _updates_ and _event_ emissions of the `module`, check it out [here](https://adimarianmutu.github.io/x-injection/classes/DynamicModuleDefinition.html).

This class is actually the "parent" of the `ImportedModuleContainer` instances, its purpose is to _build_ the _initial_ definition graph, and while doing so it also instantiate _for each_ imported module a new `ImportedModuleContainer`.

It also take care of managing the `events` bubbling by checking cirular references and so on.

#### ProviderModuleBlueprint

It's the "metadata" counterpart of the `ProviderModule` class, as its only purpose is to carry the definitions. Check it out [here](https://adimarianmutu.github.io/x-injection/classes/ProviderModuleBlueprint.html).

#### Set of Helpers

The library does also export a set of useful helpers in the case you may need it:

```ts
import { ProviderModuleHelpers, ProviderTokenHelpers } from '@adimm/x-injection';
```

---

This covers pretty much everything about how `xInjection` is built and how it works.

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

const ApiModuleBp = new ProviderModule.blueprint({
  id: 'ApiModule',
  providers: [UserService, ApiService],
});

// Clone returns a `deep` clone and wraps all the `methods` to break their reference!
const ApiModuleBpMocked = ApiModuleBp.clone().updateDefinition({
  identifier: 'ApiModuleMocked',
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

Now what you have to do is just to provide the `ApiModuleBpMocked` instead of the `ApiModuleBp` 😎

## Documentation

Comprehensive, auto-generated documentation is available at:

👉 [https://adimarianmutu.github.io/x-injection/index.html](https://adimarianmutu.github.io/x-injection/index.html)

## ReactJS Implementation

You want to use it within a [ReactJS](https://react.dev/) project? Don't worry, the library does already have an official implementation for React ⚛️

For more details check out the [GitHub Repository](https://github.com/AdiMarianMutu/x-injection-reactjs).

## Contributing

Pull requests are warmly welcomed! 😃

Please ensure your contributions adhere to the project's code style. See the repository for more details.

## Credits

- [Adi-Marian Mutu](https://www.linkedin.com/in/mutu-adi-marian/) - Author of `xInjection`
- [InversifyJS](https://github.com/inversify/monorepo) - Base lib

---

> [!NOTE]
>
> **For questions, feature requests, or bug reports, feel free to open an [issue](https://github.com/AdiMarianMutu/x-injection/issues) on GitHub.**
