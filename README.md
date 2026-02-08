<p align="center">
<img width="260px" height="auto" alt="xInjection Logo" src="https://raw.githubusercontent.com/AdiMarianMutu/x-injection/main/assets/logo.png"><br /><a href="https://www.npmjs.com/package/@adimm/x-injection" target="__blank"><img src="https://badgen.net/npm/v/@adimm/x-injection"></a>
<a href="https://app.codecov.io/gh/AdiMarianMutu/x-injection" target="__blank"><img src="https://badgen.net/codecov/c/github/AdiMarianMutu/x-injection"></a>
<img src="https://badgen.net/npm/license/@adimm/x-injection">
</p>

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
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [ProviderModule](#providermodule)
  - [AppModule](#appmodule)
  - [Blueprints](#blueprints)
  - [Provider Tokens](#provider-tokens)
- [Injection Scopes](#injection-scopes)
  - [Singleton (Default)](#singleton-default)
  - [Transient](#transient)
  - [Request](#request)
- [Module System](#module-system)
  - [Import/Export Pattern](#importexport-pattern)
  - [Re-exporting Modules](#re-exporting-modules)
  - [Dynamic Module Updates](#dynamic-module-updates)
  - [Global Modules](#global-modules)
- [Advanced Features](#advanced-features)
  - [Events](#events)
  - [Middlewares](#middlewares)
- [Testing](#testing)
- [Resources](#resources)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

## Overview

**xInjection** is a powerful [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) library built on [InversifyJS](https://github.com/inversify/InversifyJS), inspired by [NestJS](https://github.com/nestjs/nest)'s modular architecture. It provides fine-grained control over dependency encapsulation through a module-based system where each module manages its own container with explicit import/export boundaries.

## Features

- **Modular Architecture** - NestJS-style import/export system for clean dependency boundaries
- **Isolated Containers** - Each module manages its own InversifyJS container
- **Flexible Scopes** - Singleton, Transient, and Request-scoped providers
- **Lazy Loading** - Blueprint pattern for deferred module instantiation
- **Lifecycle Hooks** - `onReady`, `onReset`, `onDispose` for module lifecycle management
- **Events & Middlewares** - Deep customization through event subscriptions and middleware chains
- **Framework Agnostic** - Works in Node.js and browser environments
- **TypeScript First** - Full type safety with decorator support

## Installation

```bash
npm install @adimm/x-injection reflect-metadata
```

**TypeScript Configuration** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Import `reflect-metadata` at your application's entry point:

```ts
import 'reflect-metadata';
```

## Quick Start

```ts
import { Injectable, ProviderModule } from '@adimm/x-injection';

@Injectable()
class UserService {
  getUser(id: string) {
    return { id, name: 'John Doe' };
  }
}

@Injectable()
class AuthService {
  constructor(private userService: UserService) {}

  login(userId: string) {
    const user = this.userService.getUser(userId);
    return `Logged in as ${user.name}`;
  }
}

const AuthModule = ProviderModule.create({
  id: 'AuthModule',
  providers: [UserService, AuthService],
  exports: [AuthService],
});

const authService = AuthModule.get(AuthService);
console.log(authService.login('123')); // "Logged in as John Doe"
```

## Core Concepts

### ProviderModule

The fundamental building block of xInjection. Similar to NestJS modules, each `ProviderModule` encapsulates related providers with explicit control over what's exposed.

```ts
const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  imports: [ConfigModule], // Modules to import
  providers: [DatabaseService], // Services to register
  exports: [DatabaseService], // What to expose to importers
});
```

**Key Methods:**

- `Module.get(token)` - Resolve a provider instance
- `Module.update.addProvider()` - Dynamically add providers
- `Module.update.addImport()` - Import other modules at runtime
- `Module.dispose()` - Clean up module resources

[Full API Documentation →](https://adimarianmutu.github.io/x-injection/classes/IProviderModule.html)

### AppModule

The global root module, automatically available in every application. Global modules are auto-imported into `AppModule`.

```ts
import { AppModule } from '@adimm/x-injection';

// Add global providers
AppModule.update.addProvider(LoggerService);

// Access from any module
const anyModule = ProviderModule.create({ id: 'AnyModule' });
const logger = anyModule.get(LoggerService);
```

### Blueprints

Blueprints allow you to define module configurations without instantiating them, enabling lazy loading and template reuse.

```ts
// Define blueprint
const DatabaseModuleBp = ProviderModule.blueprint({
  id: 'DatabaseModule',
  providers: [DatabaseService],
  exports: [DatabaseService],
});

// Import blueprint (auto-converts to module)
const AppModule = ProviderModule.create({
  id: 'AppModule',
  imports: [DatabaseModuleBp],
});

// Or create module from blueprint later
const DatabaseModule = ProviderModule.create(DatabaseModuleBp);
```

**Benefits:**

- Deferred instantiation for better startup performance
- Reusable module templates across your application
- Scoped singletons per importing module

### Provider Tokens

xInjection supports four types of provider tokens:

**1. Class Token** (simplest):

```ts
@Injectable()
class ApiService {}

providers: [ApiService];
```

**2. Class Token with Substitution**:

```ts
providers: [{ provide: ApiService, useClass: MockApiService }];
```

**3. Value Token** (constants):

```ts
providers: [{ provide: 'API_KEY', useValue: 'secret-key-123' }];
```

**4. Factory Token** (dynamic):

```ts
providers: [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (config: ConfigService) => createConnection(config.dbUrl),
    inject: [ConfigService],
  },
];
```

## Injection Scopes

Control provider lifecycle with three scope types (priority order: token > decorator > module default):

### Singleton (Default)

Cached after first resolution - same instance every time:

```ts
@Injectable() // Singleton by default
class DatabaseService {}

Module.get(DatabaseService) === Module.get(DatabaseService); // true
```

### Transient

New instance on every resolution:

```ts
@Injectable(InjectionScope.Transient)
class RequestLogger {}

Module.get(RequestLogger) === Module.get(RequestLogger); // false
```

### Request

Single instance per resolution tree (useful for request-scoped data):

```ts
@Injectable(InjectionScope.Request)
class RequestContext {}

@Injectable(InjectionScope.Transient)
class Controller {
  constructor(
    public ctx1: RequestContext,
    public ctx2: RequestContext
  ) {}
}

const controller = Module.get(Controller);
controller.ctx1 === controller.ctx2; // true (same resolution)

const controller2 = Module.get(Controller);
controller.ctx1 === controller2.ctx1; // false (different resolution)
```

**Setting Scopes:**

```ts
// 1. In provider token (highest priority)
providers: [{ provide: Service, useClass: Service, scope: InjectionScope.Transient }];

// 2. In @Injectable decorator
@Injectable(InjectionScope.Request)
class Service {}

// 3. Module default (lowest priority)
ProviderModule.create({
  id: 'MyModule',
  defaultScope: InjectionScope.Transient,
});
```

## Module System

### Import/Export Pattern

Modules explicitly control dependency boundaries through imports and exports:

```ts
const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  providers: [DatabaseService, InternalCacheService],
  exports: [DatabaseService], // Only DatabaseService is accessible
});

const ApiModule = ProviderModule.create({
  id: 'ApiModule',
  imports: [DatabaseModule], // Gets access to DatabaseService
  providers: [ApiService],
});

// ✅ Works
const dbService = ApiModule.get(DatabaseService);

// ❌ Error - InternalCacheService not exported
const cache = ApiModule.get(InternalCacheService);
```

### Re-exporting Modules

Modules can re-export imported modules to create aggregation modules:

```ts
const CoreModule = ProviderModule.create({
  id: 'CoreModule',
  imports: [DatabaseModule, ConfigModule],
  exports: [DatabaseModule, ConfigModule], // Re-export both
});

// Consumers get both DatabaseModule and ConfigModule
const AppModule = ProviderModule.create({
  imports: [CoreModule],
});
```

### Dynamic Module Updates

Modules support runtime modifications (use sparingly for performance):

```ts
const module = ProviderModule.create({ id: 'DynamicModule' });

// Add providers dynamically
module.update.addProvider(NewService);
module.update.addProvider(AnotherService, true); // true = also export

// Add imports dynamically
module.update.addImport(DatabaseModule, true); // true = also export
```

**Important:** Dynamic imports propagate automatically - if `ModuleA` imports `ModuleB`, and `ModuleB` dynamically imports `ModuleC` (with export), `ModuleA` automatically gets access to `ModuleC`'s exports.

### Global Modules

Mark modules as global to auto-import into `AppModule`:

```ts
const LoggerModule = ProviderModule.create({
  id: 'LoggerModule',
  isGlobal: true,
  providers: [LoggerService],
  exports: [LoggerService],
});

// LoggerService now available in all modules without explicit import
```

## Advanced Features

> [!WARNING]
> These features provide deep customization but can add complexity. Use them only when necessary.

### Events

Subscribe to module lifecycle events for monitoring and debugging:

```ts
import { DefinitionEventType } from '@adimm/x-injection';

const module = ProviderModule.create({
  id: 'MyModule',
  providers: [MyService],
});

const unsubscribe = module.update.subscribe(({ type, change }) => {
  if (type === DefinitionEventType.GetProvider) {
    console.log('Provider resolved:', change);
  }
  if (type === DefinitionEventType.Import) {
    console.log('Module imported:', change);
  }
});

// Clean up when done
unsubscribe();
```

**Available Events:** `GetProvider`, `Import`, `Export`, `AddProvider`, `RemoveProvider`, `ExportModule` - [Full list →](https://adimarianmutu.github.io/x-injection/enums/DefinitionEventType.html)

> [!WARNING]
> Always unsubscribe to prevent memory leaks. Events fire **after** middlewares.

### Middlewares

Intercept and transform provider resolution before values are returned:

```ts
import { MiddlewareType } from '@adimm/x-injection';

const module = ProviderModule.create({
  id: 'MyModule',
  providers: [PaymentService],
});

// Transform resolved values
module.middlewares.add(MiddlewareType.BeforeGet, (provider, token, inject) => {
  // Pass through if not interested
  if (!(provider instanceof PaymentService)) return true;

  // Use inject() to avoid infinite loops
  const logger = inject(LoggerService);
  logger.log('Payment service accessed');

  // Transform the value
  return {
    timestamp: Date.now(),
    value: provider,
  };
});

const payment = module.get(PaymentService);
// { timestamp: 1234567890, value: PaymentService }
```

**Control export access:**

```ts
module.middlewares.add(MiddlewareType.OnExportAccess, (importerModule, exportToken) => {
  // Restrict access based on importer
  if (importerModule.id === 'UntrustedModule' && exportToken === SensitiveService) {
    return false; // Deny access
  }
  return true; // Allow
});
```

**Available Middlewares:** `BeforeGet`, `BeforeAddProvider`, `BeforeAddImport`, `OnExportAccess` - [Full list →](https://adimarianmutu.github.io/x-injection/enums/MiddlewareType.html)

> [!CAUTION]
>
> - Returning `false` aborts the chain (no value returned)
> - Returning `true` passes value unchanged
> - Middlewares execute in registration order
> - Always handle errors in middleware chains

## Testing

Create mock modules easily using blueprint cloning:

```ts
// Production module
const ApiModuleBp = ProviderModule.blueprint({
  id: 'ApiModule',
  providers: [UserService, ApiService],
  exports: [ApiService],
});

// Test module - clone and override
const ApiModuleMock = ApiModuleBp.clone().updateDefinition({
  id: 'ApiModuleMock',
  providers: [
    { provide: UserService, useClass: MockUserService },
    {
      provide: ApiService,
      useValue: {
        sendRequest: jest.fn().mockResolvedValue({ data: 'test' }),
      },
    },
  ],
});

// Use in tests
const testModule = ProviderModule.create({
  imports: [ApiModuleMock],
});
```

## Resources

📚 **[Full API Documentation](https://adimarianmutu.github.io/x-injection/index.html)** - Complete TypeDoc reference

⚛️ **[React Integration](https://github.com/AdiMarianMutu/x-injection-reactjs)** - Official React hooks and providers

💡 **[GitHub Issues](https://github.com/AdiMarianMutu/x-injection/issues)** - Bug reports and feature requests

## Contributing

Contributions welcome! Please ensure code follows the project style guidelines.

## Credits

**Author:** [Adi-Marian Mutu](https://www.linkedin.com/in/mutu-adi-marian/)
**Built on:** [InversifyJS](https://github.com/inversify/monorepo)
**Logo:** [Alexandru Turica](https://www.linkedin.com/in/alexandru-turica-82215522b/)

## License

MIT © Adi-Marian Mutu
