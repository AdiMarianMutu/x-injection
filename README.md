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

**A powerful, modular dependency injection library for TypeScript** — Built on [InversifyJS](https://github.com/inversify/InversifyJS), inspired by [NestJS](https://github.com/nestjs/nest)'s elegant module architecture.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [What Problems Does This Solve?](#what-problems-does-this-solve)
  - [Problem 1: Manual Dependency Wiring](#problem-1-manual-dependency-wiring)
  - [Problem 2: Tight Coupling and Testing Difficulty](#problem-2-tight-coupling-and-testing-difficulty)
  - [Problem 3: Lack of Encapsulation](#problem-3-lack-of-encapsulation)
  - [Problem 4: Lifecycle Management Complexity](#problem-4-lifecycle-management-complexity)
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Services with @Injectable](#services-with-injectable)
  - [Modules](#modules)
  - [Blueprints](#blueprints)
  - [AppModule](#appmodule)
- [OOP-Style Modules with ProviderModuleClass](#oop-style-modules-with-providermoduleclass)
  - [Basic OOP Module](#basic-oop-module)
  - [Advanced OOP Patterns](#advanced-oop-patterns)
  - [When to Use OOP vs Functional](#when-to-use-oop-vs-functional)
- [Provider Tokens](#provider-tokens)
  - [1. Class Token](#1-class-token)
  - [2. Class Token with Substitution](#2-class-token-with-substitution)
  - [3. Value Token](#3-value-token)
  - [4. Factory Token](#4-factory-token)
- [Injection Scopes](#injection-scopes)
  - [Singleton (Default)](#singleton-default)
  - [Transient](#transient)
  - [Request](#request)
  - [Scope Priority Order](#scope-priority-order)
- [Module System](#module-system)
  - [Import/Export Pattern](#importexport-pattern)
  - [Re-exporting Modules](#re-exporting-modules)
  - [Dynamic Module Updates](#dynamic-module-updates)
  - [Global Modules](#global-modules)
- [Dependency Injection](#dependency-injection)
  - [Constructor Injection](#constructor-injection)
  - [@Inject Decorator](#inject-decorator)
  - [@MultiInject Decorator](#multiinject-decorator)
  - [Optional Dependencies](#optional-dependencies)
- [Lifecycle Hooks](#lifecycle-hooks)
  - [onReady Hook](#onready-hook)
  - [onReset Hook](#onreset-hook)
  - [onDispose Hook](#ondispose-hook)
- [Events System](#events-system)
  - [Subscribing to Events](#subscribing-to-events)
  - [Available Event Types](#available-event-types)
  - [Event Use Cases](#event-use-cases)
- [Middlewares](#middlewares)
  - [BeforeGet Middleware](#beforeget-middleware)
  - [BeforeAddProvider Middleware](#beforeaddprovider-middleware)
  - [BeforeAddImport Middleware](#beforeaddimport-middleware)
  - [OnExportAccess Middleware](#onexportaccess-middleware)
  - [BeforeRemoveImport Middleware](#beforeremoveimport-middleware)
  - [BeforeRemoveProvider Middleware](#beforeremoveprovider-middleware)
  - [BeforeRemoveExport Middleware](#beforeremoveexport-middleware)
  - [All Available Middleware Types](#all-available-middleware-types)
- [Testing](#testing)
  - [Blueprint Cloning](#blueprint-cloning)
  - [Provider Substitution](#provider-substitution)
  - [Mocking Services](#mocking-services)
- [Advanced Module API](#advanced-module-api)
  - [Query Methods](#query-methods)
  - [Multiple Provider Binding](#multiple-provider-binding)
  - [Batch Resolution with getMany()](#batch-resolution-with-getmany)
- [Resources](#resources)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

## What Problems Does This Solve?

Modern applications face several dependency management challenges. Let's examine these problems and how xInjection solves them.

### Problem 1: Manual Dependency Wiring

**Without xInjection:**

```ts
// Manually creating and wiring dependencies
class DatabaseService {
  constructor(private config: ConfigService) {}
}

class UserRepository {
  constructor(private db: DatabaseService) {}
}

class AuthService {
  constructor(private userRepo: UserRepository) {}
}

// Manual instantiation nightmare
const config = new ConfigService();
const database = new DatabaseService(config);
const userRepo = new UserRepository(database);
const authService = new AuthService(userRepo);

// Every file needs to repeat this setup
// Changes to constructors require updating all instantiation sites
```

**With xInjection:**

```ts
@Injectable()
class DatabaseService {
  constructor(private config: ConfigService) {}
}

@Injectable()
class UserRepository {
  constructor(private db: DatabaseService) {}
}

@Injectable()
class AuthService {
  constructor(private userRepo: UserRepository) {}
}

const AuthModule = ProviderModule.create({
  id: 'AuthModule',
  providers: [ConfigService, DatabaseService, UserRepository, AuthService],
});

// Automatic dependency resolution
const authService = AuthModule.get(AuthService);
// All dependencies automatically injected!
```

### Problem 2: Tight Coupling and Testing Difficulty

**Without xInjection:**

```ts
class PaymentService {
  // Hardcoded dependency - impossible to mock
  private stripe = new StripeClient('api-key');

  async charge(amount: number) {
    return this.stripe.charge(amount);
  }
}

// Testing requires hitting the real Stripe API
// No way to inject a mock without changing production code
```

**With xInjection:**

```ts
@Injectable()
class PaymentService {
  constructor(private paymentGateway: PaymentGateway) {}

  async charge(amount: number) {
    return this.paymentGateway.charge(amount);
  }
}

// Production: Use real Stripe
const ProductionModule = ProviderModule.create({
  providers: [{ provide: PaymentGateway, useClass: StripePaymentGateway }, PaymentService],
});

// Testing: Use mock (no production code changes needed!)
const TestModule = ProviderModule.create({
  providers: [{ provide: PaymentGateway, useClass: MockPaymentGateway }, PaymentService],
});
```

### Problem 3: Lack of Encapsulation

**Without xInjection:**

```ts
// Internal implementation details exposed
class CacheService {
  // Should be private but other modules need access
  public internalCache = new Map();
}

class DatabaseModule {
  // Everything is public - no control over what gets used
  public connection = createConnection();
  public cache = new CacheService();
  public queryBuilder = new QueryBuilder();
}

// Other modules can access internals they shouldn't
const cache = databaseModule.internalCache; // Bad!
```

**With xInjection:**

```ts
const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  providers: [ConnectionPool, CacheService, QueryBuilder],
  exports: [QueryBuilder], // Only expose public API
});

// Other modules can only access QueryBuilder
// ConnectionPool and CacheService remain internal
const ApiModule = ProviderModule.create({
  imports: [DatabaseModule],
});

// ✅ Works - QueryBuilder is exported
const queryBuilder = ApiModule.get(QueryBuilder);

// ❌ Error - CacheService not exported (properly encapsulated!)
const cache = ApiModule.get(CacheService);
```

### Problem 4: Lifecycle Management Complexity

**Without xInjection:**

```ts
class AppServices {
  database: DatabaseService;
  cache: CacheService;

  async initialize() {
    this.database = new DatabaseService();
    await this.database.connect();

    this.cache = new CacheService();
    await this.cache.initialize();

    // Manually track initialization order and cleanup
  }

  async cleanup() {
    // Must remember to clean up in reverse order
    await this.cache.dispose();
    await this.database.disconnect();
  }
}

// Easy to forget cleanup, leading to resource leaks
```

**With xInjection:**

```ts
const AppModule = ProviderModule.create({
  id: 'AppModule',
  providers: [DatabaseService, CacheService],
  onReady: async (module) => {
    // Initialization logic - called immediately after module creation
    const db = module.get(DatabaseService);
    await db.connect();
  },
  onDispose: () => {
    return {
      before: async (mod) => {
        // Automatic cleanup in proper order
        const db = mod.get(DatabaseService);
        await db.disconnect();
      },
    };
  },
});

// Lifecycle automatically managed
await AppModule.dispose(); // Everything cleaned up properly
```

xInjection transforms these pain points into elegant, maintainable code through:

- **Automatic dependency resolution** - No manual wiring
- **Inversion of Control** - Easy testing and flexibility
- **Encapsulation** - Fine-grained control over module boundaries
- **Lifecycle hooks** - Proper initialization and cleanup
- **Modular architecture** - Scalable application structure

## Overview

**xInjection** is a powerful [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) library built on [InversifyJS](https://github.com/inversify/InversifyJS), inspired by [NestJS](https://github.com/nestjs/nest)'s modular architecture. It provides fine-grained control over dependency encapsulation through a module-based system where each module manages its own container with explicit import/export boundaries.

## Features

- **Modular Architecture** - NestJS-style import/export system for clean dependency boundaries
- **Isolated Containers** - Each module manages its own InversifyJS container
- **Flexible Scopes** - Singleton, Transient, and Request-scoped providers
- **Lazy Loading** - Blueprint pattern for deferred module instantiation
- **Lifecycle Hooks** - `onReady`, `onReset`, `onDispose` for module lifecycle management
- **Events & Middlewares** - Deep customization through event subscriptions and middleware chains
- **OOP Support** - `ProviderModuleClass` for class-based module architecture
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

### Services with @Injectable

The `@Injectable()` decorator marks a class as available for dependency injection. It enables automatic constructor parameter resolution.

```ts
import { Injectable, InjectionScope } from '@adimm/x-injection';

// Basic injectable service (Singleton by default)
@Injectable()
class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

// Injectable with scope specification
@Injectable(InjectionScope.Request)
class RequestContext {
  requestId = Math.random();
}

// Complex service with dependencies
@Injectable()
class ApiService {
  constructor(
    private logger: LoggerService,
    private context: RequestContext
  ) {}

  async fetchData() {
    this.logger.log(`Fetching data for request ${this.context.requestId}`);
    return { data: 'example' };
  }
}
```

> [!IMPORTANT]
> The `@Injectable()` decorator is **required** for any class that:
>
> - Has constructor dependencies
> - Needs to be resolved from a module container
> - Should be managed by the dependency injection system

### Modules

Modules are the fundamental building blocks of xInjection. Each module encapsulates providers with explicit control over imports and exports.

```ts
import { ProviderModule } from '@adimm/x-injection';

// Define services
@Injectable()
class DatabaseService {
  query(sql: string) {
    return [{ id: 1, name: 'Result' }];
  }
}

@Injectable()
class InternalCacheService {
  // Internal-only service
  private cache = new Map();
}

@Injectable()
class UserRepository {
  constructor(
    private db: DatabaseService,
    private cache: InternalCacheService
  ) {}

  findById(id: string) {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// Create module with encapsulation
const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  providers: [DatabaseService, InternalCacheService, UserRepository],
  exports: [UserRepository], // Only UserRepository accessible to importers
});

// Use the module
const ApiModule = ProviderModule.create({
  id: 'ApiModule',
  imports: [DatabaseModule],
});

// ✅ Works - UserRepository is exported
const userRepo = ApiModule.get(UserRepository);

// ❌ Throws error - InternalCacheService not exported
// const cache = ApiModule.get(InternalCacheService);
```

**Key Module Methods:**

```ts
const MyModule = ProviderModule.create({ id: 'MyModule' });

// Resolution
MyModule.get(ServiceClass); // Get provider instance
MyModule.getMany(Service1, Service2); // Get multiple providers

// Queries
MyModule.hasProvider(ServiceClass); // Check if provider exists
MyModule.isImportingModule('ModuleId'); // Check if importing module
MyModule.isExportingProvider(ServiceClass); // Check if exporting provider
MyModule.isExportingModule('ModuleId'); // Check if exporting module

// Dynamic updates
MyModule.update.addProvider(NewService); // Add provider
MyModule.update.addImport(OtherModule); // Add import
MyModule.update.removeProvider(ServiceClass); // Remove provider
MyModule.update.removeImport(OtherModule); // Remove import
MyModule.update.removeFromExports(Service); // Remove from exports

// Lifecycle
await MyModule.reset(); // Reset module state
await MyModule.dispose(); // Clean up and dispose
MyModule.isDisposed; // Check disposal state
```

### Blueprints

Blueprints allow you to define module configurations without instantiating them, enabling lazy loading and template reuse.

```ts
import { ProviderModule } from '@adimm/x-injection';

@Injectable()
class ConfigService {
  getConfig() {
    return { apiUrl: 'https://api.example.com' };
  }
}

// Define blueprint (not instantiated yet)
const ConfigModuleBp = ProviderModule.blueprint({
  id: 'ConfigModule',
  providers: [ConfigService],
  exports: [ConfigService],
});

// Use blueprint in imports (auto-converts to module)
const ApiModule = ProviderModule.create({
  id: 'ApiModule',
  imports: [ConfigModuleBp], // Instantiated automatically when needed
});

// Or create module from blueprint explicitly
const ConfigModule = ProviderModule.create(ConfigModuleBp);

// Clone blueprints for testing
const ConfigModuleMock = ConfigModuleBp.clone().updateDefinition({
  id: 'ConfigModuleMock',
  providers: [{ provide: ConfigService, useValue: { getConfig: () => ({ apiUrl: 'mock' }) } }],
});
```

**Benefits of Blueprints:**

- **Deferred Instantiation** - Only create modules when needed
- **Reusable Templates** - Define once, use in multiple places
- **Testing** - Clone and modify for test scenarios
- **Scoped Singletons** - Each importing module gets its own independent module instance converted from the blueprint

> [!TIP]
> Use blueprints when you need the same module configuration in multiple places, or when you want to delay module creation until runtime.

> [!IMPORTANT]
> When a blueprint is imported into multiple modules, each importing module receives its **own separate instance** of that blueprint — converted to a full module independently. This means that providers declared as `Singleton` inside a blueprint are only singletons **relative to the module that imported them**, not globally. If `ModuleA` and `ModuleB` both import `ConfigModuleBp`, they each get their own `ConfigService` singleton — the two instances are completely independent of each other.

### AppModule

The `AppModule` is a special global root module that's automatically available throughout your application. Global modules are auto-imported into `AppModule`.

```ts
import { AppModule, ProviderModule } from '@adimm/x-injection';

@Injectable()
class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

// Add global providers to AppModule
AppModule.update.addProvider(LoggerService);

// Access from any module without explicit import
const FeatureModule = ProviderModule.create({
  id: 'FeatureModule',
  // No need to import AppModule
});

const logger = FeatureModule.get(LoggerService);
logger.log('Hello from FeatureModule!');
```

**Global Module Pattern:**

```ts
// Create a global module (auto-imports into AppModule)
const LoggerModule = ProviderModule.create({
  id: 'LoggerModule',
  isGlobal: true,
  providers: [LoggerService],
  exports: [LoggerService],
});

// Now all modules have access to LoggerService
const AnyModule = ProviderModule.create({
  id: 'AnyModule',
});

const logger = AnyModule.get(LoggerService); // Works!
```

> [!WARNING]
>
> - Cannot create a module with `id: 'AppModule'` - this is reserved
> - Cannot import `AppModule` into other modules
> - Use global modules sparingly to avoid implicit dependencies

## OOP-Style Modules with ProviderModuleClass

For developers who prefer class-based architecture, xInjection provides `ProviderModuleClass` - a composition-based wrapper that prevents naming conflicts between your custom methods and the DI container methods.

### Basic OOP Module

```ts
import { Injectable, ProviderModuleClass } from '@adimm/x-injection';

@Injectable()
class UserService {
  get(id: string) {
    return { id, name: 'John Doe' };
  }
}

@Injectable()
class AuthService {
  constructor(private userService: UserService) {}

  login(userId: string) {
    const user = this.userService.get(userId);
    return `Logged in as ${user.name}`;
  }
}

// OOP-style module extending ProviderModuleClass
class AuthModule extends ProviderModuleClass {
  constructor() {
    super({
      id: 'AuthModule',
      providers: [UserService, AuthService],
      exports: [AuthService],
    });
  }

  // Custom business logic methods
  authenticateUser(userId: string): string {
    const authService = this.module.get(AuthService);
    return authService.login(userId);
  }

  getUserById(userId: string) {
    const userService = this.module.get(UserService);
    return userService.get(userId);
  }

  // Custom method named 'get' - no conflict!
  get(): string {
    return 'custom-get-value';
  }
}

// Instantiate and use
const authModule = new AuthModule();

// Use custom methods
console.log(authModule.authenticateUser('123')); // "Logged in as John Doe"
console.log(authModule.get()); // "custom-get-value"

// Access DI container through .module property
const authService = authModule.module.get(AuthService);
authModule.module.update.addProvider(NewService);
```

> [!IMPORTANT]
> All `ProviderModule` methods are available through the `.module` property to prevent naming conflicts with your custom methods.

### Advanced OOP Patterns

**Module with Initialization Logic:**

```ts
@Injectable()
class DatabaseService {
  private connected = false;

  async connect(): Promise<void> {
    // Connection logic
    this.connected = true;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

class DatabaseModule extends ProviderModuleClass {
  private isModuleConnected = false;

  constructor() {
    super({
      id: 'DatabaseModule',
      providers: [DatabaseService],
      exports: [DatabaseService],
      onReady: async (module) => {
        console.log('DatabaseModule ready!');
      },
    });
  }

  async connect(): Promise<void> {
    const dbService = this.module.get(DatabaseService);
    await dbService.connect();
    this.isModuleConnected = true;
  }

  getConnectionStatus(): boolean {
    return this.isModuleConnected;
  }
}

const dbModule = new DatabaseModule();
await dbModule.connect();
console.log(dbModule.getConnectionStatus()); // true
```

**Module with Computed Properties:**

```ts
@Injectable()
class ApiService {
  makeRequest() {
    return 'response';
  }
}

@Injectable()
class HttpClient {
  get(url: string) {
    return `GET ${url}`;
  }
}

class ApiModule extends ProviderModuleClass {
  constructor() {
    super({
      id: 'ApiModule',
      providers: [ApiService, HttpClient],
      exports: [ApiService],
    });
  }

  // Computed properties - lazy evaluation
  get apiService(): ApiService {
    return this.module.get(ApiService);
  }

  get httpClient(): HttpClient {
    return this.module.get(HttpClient);
  }

  // Business logic using multiple services
  async makeAuthenticatedRequest(url: string, token: string) {
    const client = this.httpClient;
    return client.get(url) + ` with token ${token}`;
  }
}

const apiModule = new ApiModule();
const response = await apiModule.makeAuthenticatedRequest('/users', 'token123');
```

### When to Use OOP vs Functional

**Use OOP-style (`extends ProviderModuleClass`) when:**

- You need custom business logic methods on the module itself
- You prefer class-based architecture and inheritance patterns
- You want computed properties or getters for providers
- You need initialization logic or state management in the module
- You're building a complex module with multiple related operations
- You want to prevent naming conflicts (e.g., custom `get()` method)

**Use Functional-style (`ProviderModule.create()`) when:**

- You only need dependency injection without custom logic
- You prefer functional composition and simplicity
- You want more concise code
- You're creating straightforward provider containers
- You don't need module-level state or behavior

**Key Point:** Both styles are fully compatible and can be mixed within the same application. `ProviderModuleClass` uses composition (contains a `ProviderModule` as `this.module`), providing identical DI functionality while preventing method name conflicts.

## Provider Tokens

xInjection supports four types of provider tokens, each serving different use cases.

### 1. Class Token

The simplest form - just provide the class directly.

```ts
@Injectable()
class UserService {
  getUsers() {
    return [{ id: '1', name: 'Alice' }];
  }
}

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [UserService], // Class token
});

const userService = MyModule.get(UserService);
```

### 2. Class Token with Substitution

Use one class as the token but instantiate a different class. Perfect for polymorphism and testing.

```ts
@Injectable()
abstract class PaymentGateway {
  abstract charge(amount: number): Promise<void>;
}

@Injectable()
class StripePaymentGateway extends PaymentGateway {
  async charge(amount: number) {
    console.log(`Charging $${amount} via Stripe`);
  }
}

@Injectable()
class MockPaymentGateway extends PaymentGateway {
  async charge(amount: number) {
    console.log(`Mock charge: $${amount}`);
  }
}

// Production
const ProductionModule = ProviderModule.create({
  id: 'ProductionModule',
  providers: [{ provide: PaymentGateway, useClass: StripePaymentGateway }],
});

// Testing
const TestModule = ProviderModule.create({
  id: 'TestModule',
  providers: [{ provide: PaymentGateway, useClass: MockPaymentGateway }],
});

const prodGateway = ProductionModule.get(PaymentGateway); // StripePaymentGateway
const testGateway = TestModule.get(PaymentGateway); // MockPaymentGateway
```

### 3. Value Token

Provide constant values or pre-instantiated objects.

```ts
// Configuration values
const ConfigModule = ProviderModule.create({
  id: 'ConfigModule',
  providers: [
    { provide: 'API_KEY', useValue: 'secret-key-123' },
    { provide: 'API_URL', useValue: 'https://api.example.com' },
    { provide: 'MAX_RETRIES', useValue: 3 },
  ],
  exports: ['API_KEY', 'API_URL', 'MAX_RETRIES'],
});

const apiKey = ConfigModule.get('API_KEY'); // 'secret-key-123'
const apiUrl = ConfigModule.get('API_URL'); // 'https://api.example.com'
const maxRetries = ConfigModule.get('MAX_RETRIES'); // 3

// Pre-instantiated objects
const existingLogger = new Logger();
const LoggerModule = ProviderModule.create({
  id: 'LoggerModule',
  providers: [{ provide: Logger, useValue: existingLogger }],
});
```

### 4. Factory Token

Use a factory function to create providers dynamically. The `inject` parameter specifies dependencies.

```ts
@Injectable()
class ConfigService {
  dbUrl = 'postgres://localhost:5432/mydb';
  dbPort = 5432;
}

interface DatabaseConnection {
  url: string;
  port: number;
  connected: boolean;
}

const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  providers: [
    ConfigService,
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (config: ConfigService) => {
        // Factory receives injected dependencies
        return {
          url: config.dbUrl,
          port: config.dbPort,
          connected: true,
        };
      },
      inject: [ConfigService], // Dependencies to inject into factory
    },
  ],
  exports: ['DATABASE_CONNECTION'],
});

const connection = DatabaseModule.get<DatabaseConnection>('DATABASE_CONNECTION');
console.log(connection.url); // 'postgres://localhost:5432/mydb'
```

**Complex Factory Example with Multiple Dependencies:**

```ts
@Injectable()
class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

@Injectable()
class MetricsService {
  track(event: string) {
    console.log(`Tracking: ${event}`);
  }
}

interface ApiClient {
  logger: LoggerService;
  metrics: MetricsService;
  baseUrl: string;
  makeRequest(endpoint: string): void;
}

const ApiModule = ProviderModule.create({
  id: 'ApiModule',
  providers: [
    LoggerService,
    MetricsService,
    { provide: 'BASE_URL', useValue: 'https://api.example.com' },
    {
      provide: 'API_CLIENT',
      useFactory: (logger: LoggerService, metrics: MetricsService, baseUrl: string): ApiClient => {
        return {
          logger,
          metrics,
          baseUrl,
          makeRequest(endpoint: string) {
            this.logger.log(`Making request to ${this.baseUrl}${endpoint}`);
            this.metrics.track('api_request');
          },
        };
      },
      inject: [LoggerService, MetricsService, 'BASE_URL'],
    },
  ],
});

const apiClient = ApiModule.get<ApiClient>('API_CLIENT');
apiClient.makeRequest('/users');
```

> [!TIP]
> Use factory tokens when:
>
> - Provider creation requires complex logic
> - You need to inject dependencies into the factory
> - You're creating providers that depend on runtime configuration
> - You need to create multiple instances with different configurations

## Injection Scopes

Control provider lifecycle with three scope types. Scope priority order: **token scope > decorator scope > module default scope**.

### Singleton (Default)

Cached after first resolution - same instance returned every time.

```ts
@Injectable() // Singleton by default
class DatabaseService {
  connectionId = Math.random();
}

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [DatabaseService],
});

const db1 = MyModule.get(DatabaseService);
const db2 = MyModule.get(DatabaseService);

console.log(db1 === db2); // true
console.log(db1.connectionId === db2.connectionId); // true
```

### Transient

New instance created on every resolution.

```ts
@Injectable(InjectionScope.Transient)
class RequestLogger {
  requestId = Math.random();
}

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [RequestLogger],
});

const logger1 = MyModule.get(RequestLogger);
const logger2 = MyModule.get(RequestLogger);

console.log(logger1 === logger2); // false
console.log(logger1.requestId === logger2.requestId); // false
```

### Request

Single instance per resolution tree. All dependencies resolved in the same `get()` call share the same instance.

```ts
@Injectable(InjectionScope.Request)
class RequestContext {
  requestId = Math.random();
}

@Injectable(InjectionScope.Transient)
class ServiceA {
  constructor(public ctx: RequestContext) {}
}

@Injectable(InjectionScope.Transient)
class ServiceB {
  constructor(public ctx: RequestContext) {}
}

@Injectable(InjectionScope.Transient)
class Controller {
  constructor(
    public serviceA: ServiceA,
    public serviceB: ServiceB
  ) {}
}

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [RequestContext, ServiceA, ServiceB, Controller],
});

// First resolution tree
const controller1 = MyModule.get(Controller);
console.log(controller1.serviceA.ctx === controller1.serviceB.ctx); // true
// ServiceA and ServiceB share the same RequestContext

// Second resolution tree
const controller2 = MyModule.get(Controller);
console.log(controller2.serviceA.ctx === controller2.serviceB.ctx); // true
// New resolution, both services get a new shared RequestContext

// Different resolution trees get different contexts
console.log(controller1.serviceA.ctx === controller2.serviceA.ctx); // false
```

**Visual Representation:**

```
First module.get(Controller):
  Controller (new) ──┬──> ServiceA (new) ──┐
                     │                      ├──> RequestContext (SAME instance)
                     └──> ServiceB (new) ──┘

Second module.get(Controller):
  Controller (new) ──┬──> ServiceA (new) ──┐
                     │                      ├──> RequestContext (NEW instance)
                     └──> ServiceB (new) ──┘
```

### Scope Priority Order

Scopes are resolved in the following priority order (highest to lowest):

1. **Token scope** (highest priority)
2. **Decorator scope**
3. **Module default scope** (lowest priority)

```ts
@Injectable(InjectionScope.Singleton) // Priority 2
class MyService {}

const MyModule = ProviderModule.create({
  id: 'MyModule',
  defaultScope: InjectionScope.Singleton, // Priority 3 (lowest)
  providers: [
    {
      provide: MyService,
      useClass: MyService,
      scope: InjectionScope.Transient, // Priority 1 (highest) - WINS!
    },
  ],
});

// Token scope wins: new instance every time
const s1 = MyModule.get(MyService);
const s2 = MyModule.get(MyService);
console.log(s1 === s2); // false
```

**Examples of Each Priority:**

```ts
// Priority 1: Token scope
const Module1 = ProviderModule.create({
  id: 'Module1',
  defaultScope: InjectionScope.Singleton,
  providers: [
    {
      provide: MyService,
      useClass: MyService,
      scope: InjectionScope.Transient, // Token wins
    },
  ],
});

// Priority 2: Decorator scope (no token scope)
@Injectable(InjectionScope.Request)
class DecoratedService {}

const Module2 = ProviderModule.create({
  id: 'Module2',
  defaultScope: InjectionScope.Singleton,
  providers: [DecoratedService], // Decorator wins
});

// Priority 3: Module default (no token or decorator scope)
@Injectable() // No scope specified
class PlainService {}

const Module3 = ProviderModule.create({
  id: 'Module3',
  defaultScope: InjectionScope.Transient, // Module default wins
  providers: [PlainService],
});
```

> [!IMPORTANT]
> Request scope is useful for scenarios like:
>
> - HTTP request tracking (same request ID across all services in one request)
> - Transaction contexts (same database transaction across all repositories)
> - User context (same user data across all services in one operation)

## Module System

### Import/Export Pattern

Modules explicitly control dependency boundaries through imports and exports, providing encapsulation and clear interfaces.

```ts
@Injectable()
class DatabaseService {
  query(sql: string) {
    return [{ result: 'data' }];
  }
}

@Injectable()
class InternalCacheService {
  // Private to DatabaseModule
  cache = new Map();
}

const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  providers: [DatabaseService, InternalCacheService],
  exports: [DatabaseService], // Only DatabaseService is accessible
});

const ApiModule = ProviderModule.create({
  id: 'ApiModule',
  imports: [DatabaseModule],
  providers: [ApiService],
});

// ✅ Works - DatabaseService is exported
const dbService = ApiModule.get(DatabaseService);

// ❌ Error - InternalCacheService not exported
// const cache = ApiModule.get(InternalCacheService);
```

**Nested Imports:**

```ts
const LayerA = ProviderModule.create({
  id: 'LayerA',
  providers: [ServiceA],
  exports: [ServiceA],
});

const LayerB = ProviderModule.create({
  id: 'LayerB',
  imports: [LayerA],
  providers: [ServiceB],
  exports: [ServiceB, LayerA], // Re-export LayerA
});

const LayerC = ProviderModule.create({
  id: 'LayerC',
  imports: [LayerB],
});

// ✅ Works - ServiceA accessible through LayerB's re-export
const serviceA = LayerC.get(ServiceA);

// ✅ Works - ServiceB exported by LayerB
const serviceB = LayerC.get(ServiceB);
```

### Re-exporting Modules

Modules can re-export imported modules to create aggregation modules.

```ts
const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  providers: [DatabaseService],
  exports: [DatabaseService],
});

const ConfigModule = ProviderModule.create({
  id: 'ConfigModule',
  providers: [ConfigService],
  exports: [ConfigService],
});

const LoggerModule = ProviderModule.create({
  id: 'LoggerModule',
  providers: [LoggerService],
  exports: [LoggerService],
});

// CoreModule aggregates common modules
const CoreModule = ProviderModule.create({
  id: 'CoreModule',
  imports: [DatabaseModule, ConfigModule, LoggerModule],
  exports: [DatabaseModule, ConfigModule, LoggerModule], // Re-export all
});

// Consumers import CoreModule and get all three modules
const FeatureModule = ProviderModule.create({
  id: 'FeatureModule',
  imports: [CoreModule], // Just import one module
});

// Access all re-exported providers
const db = FeatureModule.get(DatabaseService);
const config = FeatureModule.get(ConfigService);
const logger = FeatureModule.get(LoggerService);
```

> [!TIP]
> Create "barrel" or "core" modules that re-export commonly used modules to simplify imports throughout your application.

### Dynamic Module Updates

Modules support runtime modifications for flexibility. Use sparingly as it can impact performance.

```ts
const DynamicModule = ProviderModule.create({
  id: 'DynamicModule',
  providers: [ServiceA],
});

// Add providers dynamically
DynamicModule.update.addProvider(ServiceB);
DynamicModule.update.addProvider(ServiceC, true); // true = also export

// Add imports dynamically
const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  providers: [DatabaseService],
  exports: [DatabaseService],
});

DynamicModule.update.addImport(DatabaseModule, true); // true = also export

// Check what's available
console.log(DynamicModule.hasProvider(ServiceB)); // true
console.log(DynamicModule.isImportingModule('DatabaseModule')); // true
console.log(DynamicModule.isExportingProvider(ServiceC)); // true

// Remove providers and imports
DynamicModule.update.removeProvider(ServiceB);
DynamicModule.update.removeImport(DatabaseModule);
DynamicModule.update.removeFromExports(ServiceC);
```

**Dynamic Import Propagation:**

```ts
const ModuleA = ProviderModule.create({
  id: 'ModuleA',
  providers: [ServiceA],
  exports: [ServiceA],
});

const ModuleB = ProviderModule.create({
  id: 'ModuleB',
  imports: [ModuleA],
  exports: [ModuleA],
});

const ModuleC = ProviderModule.create({
  id: 'ModuleC',
  providers: [ServiceC],
  exports: [ServiceC],
});

// Initially, ModuleB doesn't have ServiceC
console.log(ModuleB.hasProvider(ServiceC)); // false

// Dynamically import ModuleC into ModuleA and export it
ModuleA.update.addImport(ModuleC, true);

// Now ModuleB automatically has ServiceC (import propagation!)
console.log(ModuleB.hasProvider(ServiceC)); // true
```

> [!WARNING]
> Dynamic module updates:
>
> - Can impact performance if used frequently
> - Should be used primarily for testing or plugin systems
> - May make dependency graphs harder to understand
> - Are propagated automatically to importing modules

### Global Modules

Mark modules as global to auto-import into `AppModule`, making them available everywhere.

```ts
@Injectable()
class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

// Create global module
const LoggerModule = ProviderModule.create({
  id: 'LoggerModule',
  isGlobal: true, // Auto-imports into AppModule
  providers: [LoggerService],
  exports: [LoggerService],
});

// Now any module can access LoggerService without explicit import
const FeatureModule = ProviderModule.create({
  id: 'FeatureModule',
  // No imports needed!
});

const logger = FeatureModule.get(LoggerService); // Works!
logger.log('Hello from FeatureModule');
```

**Global Module with Blueprint:**

```ts
@Injectable()
class ConfigService {
  apiUrl = 'https://api.example.com';
}

// Blueprint with global flag
const ConfigModuleBp = ProviderModule.blueprint({
  id: 'ConfigModule',
  isGlobal: true,
  providers: [ConfigService],
  exports: [ConfigService],
});

// Automatically imports into AppModule
console.log(AppModule.isImportingModule('ConfigModule')); // true
console.log(AppModule.hasProvider(ConfigService)); // true

// Available in all modules
const AnyModule = ProviderModule.create({ id: 'AnyModule' });
const config = AnyModule.get(ConfigService); // Works!
```

> [!CAUTION]
> Use global modules sparingly:
>
> - They create implicit dependencies that can make code harder to understand
> - They reduce encapsulation and explicit dependency graphs
> - Best used for true cross-cutting concerns (logging, configuration, telemetry)
> - Prefer explicit imports when possible for better maintainability

## Dependency Injection

### Constructor Injection

The primary way to inject dependencies. TypeScript metadata handles it automatically with `@Injectable()`.

```ts
@Injectable()
class DatabaseService {
  query(sql: string) {
    return [{ data: 'result' }];
  }
}

@Injectable()
class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

@Injectable()
class UserRepository {
  // Dependencies automatically injected via constructor
  constructor(
    private db: DatabaseService,
    private logger: LoggerService
  ) {}

  findAll() {
    this.logger.log('Finding all users');
    return this.db.query('SELECT * FROM users');
  }
}

const UserModule = ProviderModule.create({
  id: 'UserModule',
  providers: [DatabaseService, LoggerService, UserRepository],
});

// UserRepository automatically receives DatabaseService and LoggerService
const userRepo = UserModule.get(UserRepository);
```

### @Inject Decorator

Use `@Inject` for explicit injection when automatic resolution doesn't work (e.g., string tokens, interfaces).

```ts
import { Inject, Injectable } from '@adimm/x-injection';

@Injectable()
class ApiService {
  constructor(
    @Inject('API_KEY') private apiKey: string,
    @Inject('API_URL') private apiUrl: string,
    @Inject('MAX_RETRIES') private maxRetries: number
  ) {}

  makeRequest() {
    console.log(`Calling ${this.apiUrl} with key ${this.apiKey}`);
    console.log(`Max retries: ${this.maxRetries}`);
  }
}

const ApiModule = ProviderModule.create({
  id: 'ApiModule',
  providers: [
    { provide: 'API_KEY', useValue: 'secret-123' },
    { provide: 'API_URL', useValue: 'https://api.example.com' },
    { provide: 'MAX_RETRIES', useValue: 3 },
    ApiService,
  ],
});

const apiService = ApiModule.get(ApiService);
apiService.makeRequest();
```

**Injecting Abstract Classes:**

```ts
@Injectable()
abstract class PaymentGateway {
  abstract charge(amount: number): Promise<void>;
}

@Injectable()
class StripePaymentGateway extends PaymentGateway {
  async charge(amount: number) {
    console.log(`Stripe: Charging $${amount}`);
  }
}

@Injectable()
class PaymentService {
  constructor(@Inject(PaymentGateway) private gateway: PaymentGateway) {}

  async processPayment(amount: number) {
    await this.gateway.charge(amount);
  }
}

const PaymentModule = ProviderModule.create({
  id: 'PaymentModule',
  providers: [{ provide: PaymentGateway, useClass: StripePaymentGateway }, PaymentService],
});
```

### @MultiInject Decorator

Inject multiple providers bound to the same token as an array.

```ts
import { Injectable, MultiInject } from '@adimm/x-injection';

@Injectable()
class EmailNotifier {
  notify() {
    console.log('Email notification sent');
  }
}

@Injectable()
class SmsNotifier {
  notify() {
    console.log('SMS notification sent');
  }
}

@Injectable()
class PushNotifier {
  notify() {
    console.log('Push notification sent');
  }
}

abstract class Notifier {
  abstract notify(): void;
}

@Injectable()
class NotificationService {
  constructor(@MultiInject(Notifier) private notifiers: Notifier[]) {}

  notifyAll() {
    this.notifiers.forEach((notifier) => notifier.notify());
  }
}

const NotificationModule = ProviderModule.create({
  id: 'NotificationModule',
  providers: [
    { provide: Notifier, useClass: EmailNotifier },
    { provide: Notifier, useClass: SmsNotifier },
    { provide: Notifier, useClass: PushNotifier },
    NotificationService,
  ],
});

const service = NotificationModule.get(NotificationService);
service.notifyAll();
// Output:
// Email notification sent
// SMS notification sent
// Push notification sent
```

**Alternative with module.get():**

```ts
const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [
    { provide: 'Handler', useValue: 'Handler1' },
    { provide: 'Handler', useValue: 'Handler2' },
    { provide: 'Handler', useValue: 'Handler3' },
  ],
});

// Get all providers bound to 'Handler'
const handlers = MyModule.get('Handler', false, true); // Third param = asList
console.log(handlers); // ['Handler1', 'Handler2', 'Handler3']
```

### Optional Dependencies

Use the `isOptional` flag to handle missing dependencies gracefully.

```ts
@Injectable()
class ServiceA {
  value = 'A';
}

@Injectable()
class ServiceB {
  constructor(
    private serviceA: ServiceA,
    @Inject('OPTIONAL_CONFIG') private config?: any
  ) {}
}

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [ServiceA, ServiceB],
});

// Get with optional flag
const optionalService = MyModule.get('NOT_EXISTS', true); // isOptional = true
console.log(optionalService); // undefined (no error thrown)

// Without optional flag (throws error)
try {
  const service = MyModule.get('NOT_EXISTS'); // Throws!
} catch (error) {
  console.error('Provider not found');
}
```

> [!TIP]
> Use `@Inject` when:
>
> - Injecting string tokens or symbols
> - Injecting abstract classes
> - TypeScript's automatic injection doesn't work (interfaces, etc.)
>
> Use `@MultiInject` when:
>
> - You want to collect all providers bound to a single token
> - Implementing plugin systems
> - Working with strategy patterns

## Lifecycle Hooks

Lifecycle hooks allow you to execute code at specific points in a module's lifecycle.

### onReady Hook

Invoked immediately after module creation. Perfect for initialization logic.

```ts
@Injectable()
class DatabaseService {
  connected = false;

  async connect() {
    console.log('Connecting to database...');
    this.connected = true;
  }
}

const DatabaseModule = ProviderModule.create({
  id: 'DatabaseModule',
  providers: [DatabaseService],
  onReady: async (module) => {
    console.log('DatabaseModule is ready!');

    // Initialize services
    const db = module.get(DatabaseService);
    await db.connect();

    console.log('Database connected:', db.connected);
  },
});

// Output:
// DatabaseModule is ready!
// Connecting to database...
// Database connected: true
```

### onReset Hook

Invoked when `module.reset()` is called. Provides `before` and `after` callbacks for cleanup and reinitialization.

```ts
@Injectable()
class CacheService {
  cache = new Map();

  clear() {
    this.cache.clear();
  }
}

const CacheModule = ProviderModule.create({
  id: 'CacheModule',
  providers: [CacheService],
  onReset: () => {
    return {
      before: async (mod) => {
        console.log('Before reset - clearing cache');
        const cache = mod.get(CacheService);
        cache.clear();
      },
      after: async () => {
        console.log('After reset - cache reinitialized');
      },
    };
  },
});

// Trigger reset
await CacheModule.reset();
// Output:
// Before reset - clearing cache
// After reset - cache reinitialized
```

### onDispose Hook

Invoked when `module.dispose()` is called. Perfect for cleanup tasks like closing connections.

```ts
@Injectable()
class DatabaseService {
  connected = true;

  async disconnect() {
    console.log('Disconnecting from database...');
    this.connected = false;
  }
}

@Injectable()
class FileService {
  async closeFiles() {
    console.log('Closing open files...');
  }
}

const AppModule = ProviderModule.create({
  id: 'AppModule',
  providers: [DatabaseService, FileService],
  onDispose: () => {
    return {
      before: async (mod) => {
        console.log('Cleanup started');
        const db = mod.get(DatabaseService);
        const files = mod.get(FileService);

        await db.disconnect();
        await files.closeFiles();
      },
      after: async () => {
        console.log('Cleanup completed');
      },
    };
  },
});

// Dispose module
await AppModule.dispose();
// Output:
// Cleanup started
// Disconnecting from database...
// Closing open files...
// Cleanup completed

// Module is now disposed
console.log(AppModule.isDisposed); // true

// Subsequent operations throw error
try {
  AppModule.get(DatabaseService);
} catch (error) {
  console.error('Cannot access disposed module');
}
```

**Complete Lifecycle Example:**

```ts
@Injectable()
class ResourceService {
  initialized = false;

  async initialize() {
    console.log('Initializing resource...');
    this.initialized = true;
  }

  async cleanup() {
    console.log('Cleaning up resource...');
    this.initialized = false;
  }
}

const ResourceModule = ProviderModule.create({
  id: 'ResourceModule',
  providers: [ResourceService],

  onReady: async (module) => {
    console.log('[READY] Module created');
    const service = module.get(ResourceService);
    await service.initialize();
  },

  onReset: () => {
    console.log('[RESET] Resetting module');
    return {
      before: async (mod) => {
        console.log('[RESET:BEFORE] Cleaning up before reset');
        const service = mod.get(ResourceService);
        await service.cleanup();
      },
      after: async () => {
        console.log('[RESET:AFTER] Reinitializing after reset');
        const service = mod.get(ResourceService);
        await service.initialize();
      },
    };
  },

  onDispose: () => {
    console.log('[DISPOSE] Disposing module');
    return {
      before: async (mod) => {
        console.log('[DISPOSE:BEFORE] Final cleanup');
        const service = mod.get(ResourceService);
        await service.cleanup();
      },
      after: async () => {
        console.log('[DISPOSE:AFTER] Module fully disposed');
      },
    };
  },
});

// Usage
await ResourceModule.reset();
await ResourceModule.dispose();
```

> [!IMPORTANT]
> Lifecycle hook execution order:
>
> 1. **onReady** - Immediately after module creation
> 2. **onReset** (before) → module reset → **onReset** (after)
> 3. **onDispose** (before) → module disposal → **onDispose** (after)

> [!WARNING]
> After calling `dispose()`:
>
> - All module operations will throw errors
> - The module cannot be reused
> - Internal resources are cleaned up
> - Use for application shutdown or when modules are truly finished

## Events System

The events system allows you to observe and react to module changes in real-time.

### Subscribing to Events

```ts
import { DefinitionEventType } from '@adimm/x-injection';

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [ServiceA],
});

// Subscribe to all events
const unsubscribe = MyModule.update.subscribe(({ type, change }) => {
  console.log(`Event: ${DefinitionEventType[type]}`, change);
});

// Trigger events
MyModule.update.addProvider(ServiceB); // Event: Provider
MyModule.update.addImport(OtherModule); // Event: Import
const service = MyModule.get(ServiceA); // Event: GetProvider

// Clean up
unsubscribe();
```

### Available Event Types

```ts
enum DefinitionEventType {
  Noop, // No operation
  Import, // Module/blueprint added
  Provider, // Provider added
  GetProvider, // Provider resolved
  Export, // Export added
  ExportModule, // Module added to exports
  ExportProvider, // Provider added to exports
  ImportRemoved, // Module removed
  ProviderRemoved, // Provider removed
  ExportRemoved, // Export removed
  ExportModuleRemoved, // Module removed from exports
  ExportProviderRemoved, // Provider removed from exports
}
```

### Event Use Cases

**Monitoring Provider Resolution:**

```ts
const MonitoredModule = ProviderModule.create({
  id: 'MonitoredModule',
  providers: [DatabaseService, CacheService],
});

MonitoredModule.update.subscribe(({ type, change }) => {
  if (type === DefinitionEventType.GetProvider) {
    console.log('Provider accessed:', change.constructor.name);
    console.log('Access time:', new Date().toISOString());
  }
});

// Logs access
const db = MonitoredModule.get(DatabaseService);
// Output: Provider accessed: DatabaseService
//         Access time: 2024-01-15T10:30:00.000Z
```

**Tracking Module Composition:**

```ts
const RootModule = ProviderModule.create({
  id: 'RootModule',
});

const compositionLog: string[] = [];

RootModule.update.subscribe(({ type, change }) => {
  switch (type) {
    case DefinitionEventType.Import:
      compositionLog.push(`Imported: ${change.id}`);
      break;
    case DefinitionEventType.Provider:
      const providerName = typeof change === 'function' ? change.name : change.provide;
      compositionLog.push(`Added provider: ${providerName}`);
      break;
    case DefinitionEventType.Export:
      compositionLog.push(`Exported: ${JSON.stringify(change)}`);
      break;
  }
});

RootModule.update.addImport(DatabaseModule);
RootModule.update.addProvider(ServiceA);
RootModule.update.addProvider(ServiceB, true);

console.log(compositionLog);
// [
//   'Imported: DatabaseModule',
//   'Added provider: ServiceA',
//   'Added provider: ServiceB',
//   'Exported: ServiceB'
// ]
```

**Debugging Dynamic Changes:**

```ts
const DebugModule = ProviderModule.create({
  id: 'DebugModule',
});

DebugModule.update.subscribe(({ type, change }) => {
  const eventName = DefinitionEventType[type];

  if (type === DefinitionEventType.ImportRemoved) {
    console.warn(`⚠️ Module removed: ${change.id}`);
  } else if (type === DefinitionEventType.ProviderRemoved) {
    console.warn(`⚠️ Provider removed:`, change);
  } else {
    console.log(`✅ ${eventName}:`, change);
  }
});

DebugModule.update.addProvider(ServiceA);
DebugModule.update.removeProvider(ServiceA);
```

**Building a Module Activity Logger:**

```ts
class ModuleActivityLogger {
  private events: Array<{ timestamp: number; type: string; change: any }> = [];

  constructor(module: ProviderModule) {
    module.update.subscribe(({ type, change }) => {
      this.events.push({
        timestamp: Date.now(),
        type: DefinitionEventType[type],
        change,
      });
    });
  }

  getReport() {
    return {
      totalEvents: this.events.length,
      events: this.events,
      summary: this.events.reduce(
        (acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}

const TrackedModule = ProviderModule.create({ id: 'TrackedModule' });
const logger = new ModuleActivityLogger(TrackedModule);

TrackedModule.update.addProvider(ServiceA);
TrackedModule.update.addProvider(ServiceB);
TrackedModule.get(ServiceA);
TrackedModule.get(ServiceB);

console.log(logger.getReport());
// {
//   totalEvents: 4,
//   events: [...],
//   summary: { Provider: 2, GetProvider: 2 }
// }
```

> [!WARNING]
>
> - Always call `unsubscribe()` to prevent memory leaks
> - Events fire **after** middlewares have executed
> - Event handlers are synchronous - avoid heavy operations
> - High-frequency events (like `GetProvider`) can impact performance

## Middlewares

Middlewares intercept and transform module operations before they complete. They provide powerful customization capabilities.

### BeforeGet Middleware

Transform provider values before they're returned to consumers.

```ts
import { MiddlewareType } from '@adimm/x-injection';

@Injectable()
class UserService {
  getUser() {
    return { id: 1, name: 'Alice' };
  }
}

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [UserService],
});

// Wrap resolved providers with metadata
MyModule.middlewares.add(MiddlewareType.BeforeGet, (provider, token, inject) => {
  // Return true to pass through unchanged
  if (!(provider instanceof UserService)) return true;

  // Transform the value
  return {
    timestamp: Date.now(),
    instance: provider,
    metadata: { cached: false },
  };
});

const result = MyModule.get(UserService);
console.log(result);
// {
//   timestamp: 1705320000000,
//   instance: UserService { ... },
//   metadata: { cached: false }
// }
```

**Conditional Transformation:**

```ts
@Injectable()
class ServiceA {}

@Injectable()
class ServiceB {}

MyModule.middlewares.add(MiddlewareType.BeforeGet, (provider, token) => {
  // Only transform ServiceA
  if (provider instanceof ServiceA) {
    return { wrapped: provider, type: 'A' };
  }

  // Pass through everything else unchanged
  return true;
});

const serviceA = MyModule.get(ServiceA); // { wrapped: ServiceA, type: 'A' }
const serviceB = MyModule.get(ServiceB); // ServiceB (unchanged)
```

**Using inject() to avoid infinite loops:**

```ts
@Injectable()
class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

@Injectable()
class PaymentService {}

MyModule.middlewares.add(MiddlewareType.BeforeGet, (provider, token, inject) => {
  if (!(provider instanceof PaymentService)) return true;

  // Use inject() instead of module.get() to avoid infinite loop
  const logger = inject(LoggerService);
  logger.log('Payment service accessed');

  return provider; // Or transform it
});
```

### BeforeAddProvider Middleware

Block specific providers:

```ts
MyModule.middlewares.add(MiddlewareType.BeforeAddProvider, (provider) => {
  // Block ServiceB from being added
  if ((provider as any).name === 'ServiceB') {
    return false; // Abort
  }
  return true; // Allow
});

MyModule.update.addProvider(ServiceA);
MyModule.update.addProvider(ServiceB); // Silently rejected
MyModule.update.addProvider(ServiceC);

console.log(MyModule.hasProvider(ServiceA)); // true
console.log(MyModule.hasProvider(ServiceB)); // false
console.log(MyModule.hasProvider(ServiceC)); // true
```

### BeforeAddImport Middleware

Intercept modules before they're imported.

```ts
const Module1 = ProviderModule.create({ id: 'Module1' });
const Module2 = ProviderModule.create({ id: 'Module2' });
const RestrictedModule = ProviderModule.create({ id: 'RestrictedModule' });

const MainModule = ProviderModule.create({ id: 'MainModule' });

// Block specific modules
MainModule.middlewares.add(MiddlewareType.BeforeAddImport, (module) => {
  if (module.id === 'RestrictedModule') {
    console.warn(`❌ Cannot import ${module.id}`);
    return false; // Block
  }
  return true; // Allow
});

MainModule.update.addImport(Module1); // ✅ Allowed
MainModule.update.addImport(Module2); // ✅ Allowed
MainModule.update.addImport(RestrictedModule); // ❌ Blocked

console.log(MainModule.isImportingModule('Module1')); // true
console.log(MainModule.isImportingModule('RestrictedModule')); // false
```

**Auto-add providers to imported modules:**

```ts
MyModule.middlewares.add(MiddlewareType.BeforeAddImport, (importedModule) => {
  // Add logger to every imported module
  importedModule.update.addProvider(LoggerService, true);
  return importedModule; // Return modified module
});

MyModule.update.addImport(FeatureModule);
// FeatureModule now has LoggerService
```

### OnExportAccess Middleware

Control which importing modules can access exports.

```ts
@Injectable()
class SensitiveService {}

@Injectable()
class PublicService {}

const SecureModule = ProviderModule.create({
  id: 'SecureModule',
  providers: [SensitiveService, PublicService],
  exports: [SensitiveService, PublicService],
});

// Restrict access based on importer
SecureModule.middlewares.add(MiddlewareType.OnExportAccess, (importerModule, exportToken) => {
  // Block untrusted modules from accessing SensitiveService
  if (importerModule.id === 'UntrustedModule' && exportToken === SensitiveService) {
    console.warn(`❌ ${importerModule.id} denied access to SensitiveService`);
    return false; // Deny
  }
  return true; // Allow
});

const TrustedModule = ProviderModule.create({
  id: 'TrustedModule',
  imports: [SecureModule],
});

const UntrustedModule = ProviderModule.create({
  id: 'UntrustedModule',
  imports: [SecureModule],
});

// Trusted module can access both
console.log(TrustedModule.hasProvider(SensitiveService)); // true
console.log(TrustedModule.hasProvider(PublicService)); // true

// Untrusted module blocked from SensitiveService
console.log(UntrustedModule.hasProvider(SensitiveService)); // false
console.log(UntrustedModule.hasProvider(PublicService)); // true
```

**Complete access control:**

```ts
SecureModule.middlewares.add(MiddlewareType.OnExportAccess, (importer, exportToken) => {
  const allowlist = ['TrustedModule1', 'TrustedModule2'];

  if (!allowlist.includes(String(importer.id))) {
    console.warn(`Access denied for ${importer.id}`);
    return false;
  }

  return true;
});
```

### BeforeRemoveImport Middleware

Prevent specific modules from being removed.

```ts
const PermanentModule = ProviderModule.create({ id: 'PermanentModule' });
const TemporaryModule = ProviderModule.create({ id: 'TemporaryModule' });

const MainModule = ProviderModule.create({ id: 'MainModule' });

// Protect PermanentModule
MainModule.middlewares.add(MiddlewareType.BeforeRemoveImport, (module) => {
  if (module.id === 'PermanentModule') {
    console.warn(`⚠️ Cannot remove ${module.id}`);
    return false; // Block removal
  }
  return true; // Allow removal
});

MainModule.update.addImport(PermanentModule);
MainModule.update.addImport(TemporaryModule);

// Try to remove
MainModule.update.removeImport(PermanentModule); // ❌ Blocked
MainModule.update.removeImport(TemporaryModule); // ✅ Removed

console.log(MainModule.isImportingModule('PermanentModule')); // true
console.log(MainModule.isImportingModule('TemporaryModule')); // false
```

### BeforeRemoveProvider Middleware

Prevent specific providers from being removed.

```ts
MyModule.middlewares.add(MiddlewareType.BeforeRemoveProvider, (provider) => {
  // Block removal of critical services
  if (provider === DatabaseService) {
    console.warn('⚠️ Cannot remove DatabaseService');
    return false;
  }
  return true;
});

MyModule.update.addProvider(DatabaseService);
MyModule.update.addProvider(CacheService);

MyModule.update.removeProvider(DatabaseService); // ❌ Blocked
MyModule.update.removeProvider(CacheService); // ✅ Removed

console.log(MyModule.hasProvider(DatabaseService)); // true
console.log(MyModule.hasProvider(CacheService)); // false
```

### BeforeRemoveExport Middleware

Prevent specific exports from being removed.

```ts
import { ProviderModuleHelpers } from '@adimm/x-injection';

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [ServiceA, ServiceB],
  exports: [ServiceA, ServiceB],
});

MyModule.middlewares.add(MiddlewareType.BeforeRemoveExport, (exportDef) => {
  // Check if it's a module or provider
  if (ProviderModuleHelpers.isModule(exportDef)) {
    // Block module removal
    return exportDef.id !== 'ProtectedModule';
  } else {
    // Block ServiceA removal
    return exportDef !== ServiceA;
  }
});

MyModule.update.removeFromExports(ServiceA); // ❌ Blocked
MyModule.update.removeFromExports(ServiceB); // ✅ Removed

console.log(MyModule.isExportingProvider(ServiceA)); // true
console.log(MyModule.isExportingProvider(ServiceB)); // false
```

### All Available Middleware Types

```ts
enum MiddlewareType {
  BeforeAddImport, // Before importing a module
  BeforeAddProvider, // Before adding a provider
  BeforeGet, // Before returning provider to consumer
  BeforeRemoveImport, // Before removing an import
  BeforeRemoveProvider, // Before removing a provider
  BeforeRemoveExport, // Before removing an export
  OnExportAccess, // When importer accesses exports
}
```

**Middleware Return Values:**

- `false` - Abort the operation (block it)
- `true` - Pass through unchanged
- Modified value - Transform and continue
- For `BeforeGet`: Can return any value (transformation)

> [!CAUTION]
> Middleware best practices:
>
> - Returning `false` aborts the chain (no value returned)
> - Middlewares execute in registration order
> - Always handle errors in middleware chains
> - Use `inject()` parameter in BeforeGet to avoid infinite loops
> - Be careful with performance - middlewares run on every operation
> - Events fire **after** middlewares complete

## Testing

xInjection makes testing easy through blueprint cloning and provider substitution.

### Blueprint Cloning

Clone blueprints to create test-specific configurations without affecting production code.

```ts
// Production blueprint
const DatabaseModuleBp = ProviderModule.blueprint({
  id: 'DatabaseModule',
  providers: [DatabaseService, ConnectionPool],
  exports: [DatabaseService],
});

// Test blueprint - clone and modify
const DatabaseModuleMock = DatabaseModuleBp.clone().updateDefinition({
  id: 'DatabaseModuleMock',
  providers: [
    { provide: DatabaseService, useClass: MockDatabaseService },
    { provide: ConnectionPool, useClass: MockConnectionPool },
  ],
});

// Use in tests
const TestModule = ProviderModule.create({
  id: 'TestModule',
  imports: [DatabaseModuleMock],
});

const db = TestModule.get(DatabaseService); // MockDatabaseService
```

**Deep Blueprint Cloning:**

```ts
const OriginalBp = ProviderModule.blueprint({
  id: 'Original',
  providers: [ServiceA, ServiceB, ServiceC],
  exports: [ServiceA, ServiceB],
  onReady: (module) => console.log('Original ready'),
});

// Clone and completely override
const ClonedBp = OriginalBp.clone().updateDefinition({
  id: 'Cloned',
  providers: [MockServiceA, MockServiceB], // Different providers
  exports: [MockServiceA], // Different exports
  onReady: undefined, // Remove lifecycle hooks
});

// Original blueprint unchanged
console.log(OriginalBp.providers?.length); // 3
console.log(ClonedBp.providers?.length); // 2
```

### Provider Substitution

Replace real services with mocks for testing.

```ts
// Production services
@Injectable()
class ApiService {
  async fetchData() {
    return fetch('https://api.example.com/data').then((r) => r.json());
  }
}

@Injectable()
class UserService {
  constructor(private api: ApiService) {}

  async getUsers() {
    return this.api.fetchData();
  }
}

// Mock service
class MockApiService {
  async fetchData() {
    return { users: [{ id: 1, name: 'Mock User' }] };
  }
}

// Production module
const ProductionModule = ProviderModule.create({
  id: 'ProductionModule',
  providers: [ApiService, UserService],
});

// Test module with substitution
const TestModule = ProviderModule.create({
  id: 'TestModule',
  providers: [
    { provide: ApiService, useClass: MockApiService },
    UserService, // Uses MockApiService automatically
  ],
});

const userService = TestModule.get(UserService);
const users = await userService.getUsers();
console.log(users); // Mock data
```

### Mocking Services

**Using useValue for simple mocks:**

```ts
const mockPaymentGateway = {
  charge: jest.fn().mockResolvedValue({ success: true }),
  refund: jest.fn().mockResolvedValue({ success: true }),
};

const TestModule = ProviderModule.create({
  id: 'TestModule',
  providers: [{ provide: PaymentGateway, useValue: mockPaymentGateway }, PaymentService],
});

const paymentService = TestModule.get(PaymentService);
await paymentService.processPayment(100);

expect(mockPaymentGateway.charge).toHaveBeenCalledWith(100);
```

**Using useFactory for complex mocks:**

```ts
const TestModule = ProviderModule.create({
  id: 'TestModule',
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        return {
          query: jest.fn().mockResolvedValue([{ id: 1, name: 'Test' }]),
          connect: jest.fn().mockResolvedValue(true),
          disconnect: jest.fn().mockResolvedValue(true),
        };
      },
    },
  ],
});

const db = TestModule.get('DATABASE_CONNECTION');
const results = await db.query('SELECT * FROM users');
expect(results).toEqual([{ id: 1, name: 'Test' }]);
```

**Complete Testing Example:**

```ts
// Production code
@Injectable()
class EmailService {
  async sendEmail(to: string, subject: string, body: string) {
    // Real email sending logic
    console.log(`Sending email to ${to}`);
  }
}

@Injectable()
class UserNotificationService {
  constructor(private emailService: EmailService) {}

  async notifyUser(userId: string, message: string) {
    await this.emailService.sendEmail(`user${userId}@example.com`, 'Notification', message);
  }
}

// Test code
describe('UserNotificationService', () => {
  it('should send email notification', async () => {
    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const TestModule = ProviderModule.create({
      id: 'TestModule',
      providers: [{ provide: EmailService, useValue: mockEmailService }, UserNotificationService],
    });

    const notificationService = TestModule.get(UserNotificationService);
    await notificationService.notifyUser('123', 'Test message');

    expect(mockEmailService.sendEmail).toHaveBeenCalledWith('user123@example.com', 'Notification', 'Test message');
  });
});
```

**Testing with Multiple Module Layers:**

```ts
// Create mock blueprint
const MockDataModuleBp = ProviderModule.blueprint({
  id: 'MockDataModule',
  providers: [
    { provide: DatabaseService, useClass: MockDatabaseService },
    { provide: CacheService, useClass: MockCacheService },
  ],
  exports: [DatabaseService, CacheService],
});

// Use mock in feature module tests
const FeatureModuleTest = ProviderModule.create({
  id: 'FeatureModuleTest',
  imports: [MockDataModuleBp],
  providers: [FeatureService],
});

const featureService = FeatureModuleTest.get(FeatureService);
// FeatureService receives mock dependencies
```

> [!TIP]
> Testing strategies:
>
> - Use `blueprint.clone()` to create test variations without modifying originals
> - Use `useValue` for simple mocks with jest.fn()
> - Use `useClass` for class-based mocks with behavior
> - Use `useFactory` for complex mock setup
> - Test module isolation by mocking all external dependencies
> - Verify mock calls with jest expectations

## Advanced Module API

### Query Methods

Check module state and relationships.

```ts
const MyModule = ProviderModule.create({
  id: 'MyModule',
  imports: [DatabaseModule, ConfigModule],
  providers: [ServiceA, ServiceB],
  exports: [ServiceA, DatabaseModule],
});

// Provider queries
MyModule.hasProvider(ServiceA); // true
MyModule.hasProvider(ServiceC); // false
MyModule.hasProvider(DatabaseService); // true (from import)

// Import queries
MyModule.isImportingModule('DatabaseModule'); // true
MyModule.isImportingModule(ConfigModule); // true (by reference)
MyModule.isImportingModule('NonExistent'); // false

// Export queries
MyModule.isExportingProvider(ServiceA); // true
MyModule.isExportingProvider(ServiceB); // false
MyModule.isExportingModule('DatabaseModule'); // true
MyModule.isExportingModule(ConfigModule); // false

// State queries
MyModule.isDisposed; // false
MyModule.id; // 'MyModule'
```

**Using Symbol Identifiers:**

```ts
const MODULE_ID = Symbol('FeatureModule');

const FeatureModule = ProviderModule.create({
  id: MODULE_ID,
  providers: [FeatureService],
  exports: [FeatureService],
});

const AppModule = ProviderModule.create({
  id: 'AppModule',
  imports: [FeatureModule],
});

// Query using Symbol
console.log(AppModule.isImportingModule(MODULE_ID)); // true
```

### Multiple Provider Binding

Bind multiple providers to the same token and retrieve them as a list.

```ts
@Injectable()
abstract class Plugin {
  abstract execute(): void;
}

@Injectable()
class PluginA extends Plugin {
  execute() {
    console.log('Plugin A executing');
  }
}

@Injectable()
class PluginB extends Plugin {
  execute() {
    console.log('Plugin B executing');
  }
}

@Injectable()
class PluginC extends Plugin {
  execute() {
    console.log('Plugin C executing');
  }
}

const PluginModule = ProviderModule.create({
  id: 'PluginModule',
  providers: [
    { provide: Plugin, useClass: PluginA },
    { provide: Plugin, useClass: PluginB },
    { provide: Plugin, useClass: PluginC },
  ],
});

// Get all plugins as array (third parameter = asList)
const plugins = PluginModule.get(Plugin, false, true);
console.log(plugins.length); // 3

// Execute all plugins
plugins.forEach((plugin) => plugin.execute());
// Output:
// Plugin A executing
// Plugin B executing
// Plugin C executing
```

**String Token Example:**

```ts
const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [
    { provide: 'Handler', useValue: 'Handler1' },
    { provide: 'Handler', useValue: 'Handler2' },
    { provide: 'Handler', useValue: 'Handler3' },
  ],
});

const handlers = MyModule.get('Handler', false, true);
console.log(handlers); // ['Handler1', 'Handler2', 'Handler3']
```

### Batch Resolution with getMany()

Resolve multiple providers in a single call.

```ts
@Injectable()
class ServiceA {
  name = 'A';
}

@Injectable()
class ServiceB {
  name = 'B';
}

@Injectable()
class ServiceC {
  name = 'C';
}

const MyModule = ProviderModule.create({
  id: 'MyModule',
  providers: [
    ServiceA,
    ServiceB,
    ServiceC,
    { provide: 'CONFIG_A', useValue: 'config-a' },
    { provide: 'CONFIG_B', useValue: 'config-b' },
  ],
});

// Simple getMany
const [serviceA, serviceB, configA] = MyModule.getMany(ServiceA, ServiceB, 'CONFIG_A');

console.log(serviceA.name); // 'A'
console.log(serviceB.name); // 'B'
console.log(configA); // 'config-a'
```

**With Options:**

```ts
// Optional providers
const [serviceA, missing, serviceC] = MyModule.getMany(
  ServiceA,
  { provider: 'NON_EXISTENT', isOptional: true },
  ServiceC
);

console.log(serviceA); // ServiceA instance
console.log(missing); // undefined (no error)
console.log(serviceC); // ServiceC instance

// Get as list (multiple bindings)
const HandlerModule = ProviderModule.create({
  id: 'HandlerModule',
  providers: [
    { provide: 'Handler', useValue: 'H1' },
    { provide: 'Handler', useValue: 'H2' },
    { provide: 'Handler', useValue: 'H3' },
  ],
});

const [handlers] = HandlerModule.getMany({
  provider: 'Handler',
  asList: true,
});

console.log(handlers); // ['H1', 'H2', 'H3']
```

**Complex Example:**

```ts
const [database, cache, optionalLogger, allPlugins, config] = MyModule.getMany(
  DatabaseService,
  CacheService,
  { provider: LoggerService, isOptional: true },
  { provider: Plugin, asList: true },
  'APP_CONFIG'
);

// All providers resolved in one call
// optionalLogger is undefined if not available
// allPlugins is an array of all Plugin bindings
```

> [!IMPORTANT] > `getMany()` parameter types:
>
> - **Simple**: Just pass the token directly
> - **With options**: Use object with `provider`, `isOptional`, and/or `asList`

## Resources

📚 **[Full API Documentation](https://adimarianmutu.github.io/x-injection/index.html)** - Complete TypeDoc reference

⚛️ **[React Integration](https://github.com/AdiMarianMutu/x-injection-reactjs)** - Official React hooks and providers

💡 **[GitHub Issues](https://github.com/AdiMarianMutu/x-injection/issues)** - Bug reports and feature requests

🌟 **[GitHub Repository](https://github.com/AdiMarianMutu/x-injection)** - Source code and examples

## Contributing

Contributions are welcome! Please ensure code follows the project style guidelines and includes appropriate tests.

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Credits

**Author:** [Adi-Marian Mutu](https://www.linkedin.com/in/mutu-adi-marian/)

**Built on:** [InversifyJS](https://github.com/inversify/monorepo)

**Logo:** [Alexandru Turica](https://www.linkedin.com/in/alexandru-turica-82215522b/)

## License

MIT © Adi-Marian Mutu
