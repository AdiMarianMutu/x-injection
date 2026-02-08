import { Injectable, InjectionScope, ProviderModuleClass, ProviderModule } from '../src';

describe('OOP-Style Modules (Using ProviderModuleClass)', () => {
  afterEach(() => jest.clearAllMocks());

  describe('Basic OOP Module', () => {
    it('should create a module by extending ProviderModuleClass', () => {
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

      class AuthModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'AuthModule',
            providers: [UserService, AuthService],
            exports: [AuthService],
          });
        }

        authenticateUser(userId: string): string {
          const authService = this.module.get(AuthService);
          return authService.login(userId);
        }

        getUserById(userId: string) {
          const userService = this.module.get(UserService);
          return userService.getUser(userId);
        }
      }

      const authModule = new AuthModule();

      // Test custom methods
      expect(authModule.authenticateUser('123')).toBe('Logged in as John Doe');
      expect(authModule.getUserById('456')).toEqual({ id: '456', name: 'John Doe' });

      // Test module access to ProviderModule methods
      const authService = authModule.module.get(AuthService);
      expect(authService).toBeInstanceOf(AuthService);
      expect(authModule.module.hasProvider(UserService)).toBe(true);
      expect(authModule.module.hasProvider(AuthService)).toBe(true);
    });

    it('should support all ProviderModule methods through module', () => {
      @Injectable()
      class Service1 {}

      @Injectable()
      class Service2 {}

      class TestModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'TestModule',
            providers: [Service1],
          });
        }
      }

      const module = new TestModule();

      // Test dynamic provider addition
      module.module.update.addProvider(Service2);
      expect(module.module.hasProvider(Service2)).toBe(true);

      // Test provider resolution
      const service1 = module.module.get(Service1);
      const service2 = module.module.get(Service2);
      expect(service1).toBeInstanceOf(Service1);
      expect(service2).toBeInstanceOf(Service2);

      // Test module ID
      expect(module.module.id).toBe('TestModule');
    });

    it('should prevent naming conflicts with custom get method', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'service-value';
        }
      }

      class ConflictModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'ConflictModule',
            providers: [TestService],
          });
        }

        // Custom get method - doesn't conflict!
        get(): string {
          return 'custom-get-value';
        }

        // Access DI container via this.module
        getService(): TestService {
          return this.module.get(TestService);
        }
      }

      const module = new ConflictModule();

      // Custom get() method works
      expect(module.get()).toBe('custom-get-value');

      // DI container get() still works through module
      const service = module.getService();
      expect(service).toBeInstanceOf(TestService);
      expect(service.getValue()).toBe('service-value');
    });
  });

  describe('Module with Initialization Logic', () => {
    it('should support initialization logic in constructor', async () => {
      @Injectable()
      class DatabaseService {
        private connected = false;

        async connect(): Promise<void> {
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

      expect(dbModule.getConnectionStatus()).toBe(false);

      await dbModule.connect();

      expect(dbModule.getConnectionStatus()).toBe(true);
      const dbService = dbModule.module.get(DatabaseService);
      expect(dbService.isConnected()).toBe(true);
    });

    it('should support onReady lifecycle hook in OOP modules', async () => {
      const onReadyMock = jest.fn();

      @Injectable()
      class TestService {}

      class TestModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'TestModule',
            providers: [TestService],
            onReady: onReadyMock,
          });
        }
      }

      const module = new TestModule();

      // onReady is called after module creation
      expect(onReadyMock).toHaveBeenCalledTimes(1);
      expect(onReadyMock).toHaveBeenCalledWith(module.module);
    });
  });

  describe('Module with Computed Properties', () => {
    it('should support getter properties for lazy provider access', () => {
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

        get apiService(): ApiService {
          return this.module.get(ApiService);
        }

        get httpClient(): HttpClient {
          return this.module.get(HttpClient);
        }

        makeAuthenticatedRequest(url: string, token: string): string {
          return `${this.httpClient.get(url)} with token ${token}`;
        }
      }

      const apiModule = new ApiModule();

      // Test computed properties
      expect(apiModule.apiService).toBeInstanceOf(ApiService);
      expect(apiModule.httpClient).toBeInstanceOf(HttpClient);

      // Test business logic using computed properties
      const result = apiModule.makeAuthenticatedRequest('/users', 'abc123');
      expect(result).toBe('GET /users with token abc123');

      // Verify getters return same instances (singletons)
      expect(apiModule.apiService).toBe(apiModule.apiService);
    });
  });

  describe('Module Composition and Inheritance', () => {
    it('should support base class with shared functionality', () => {
      @Injectable()
      class LoggerService {
        log(message: string): string {
          return `[LOG] ${message}`;
        }
      }

      class BaseModule extends ProviderModuleClass {
        protected logAction(action: string): string {
          const logger = this.module.get(LoggerService);
          return logger.log(`[${String(this.module.id)}] ${action}`);
        }
      }

      @Injectable()
      class UserService {
        create(name: string) {
          return { id: '1', name };
        }

        delete(id: string) {
          return { id, deleted: true };
        }
      }

      class UserModule extends BaseModule {
        constructor() {
          super({
            id: 'UserModule',
            providers: [UserService, LoggerService],
            exports: [UserService],
          });
        }

        createUser(name: string) {
          const log = this.logAction(`Creating user: ${name}`);
          const userService = this.module.get(UserService);
          return { user: userService.create(name), log };
        }

        deleteUser(id: string) {
          const log = this.logAction(`Deleting user: ${id}`);
          const userService = this.module.get(UserService);
          return { result: userService.delete(id), log };
        }
      }

      const userModule = new UserModule();

      const createResult = userModule.createUser('Alice');
      expect(createResult.user).toEqual({ id: '1', name: 'Alice' });
      expect(createResult.log).toBe('[LOG] [UserModule] Creating user: Alice');

      const deleteResult = userModule.deleteUser('1');
      expect(deleteResult.result).toEqual({ id: '1', deleted: true });
      expect(deleteResult.log).toBe('[LOG] [UserModule] Deleting user: 1');
    });

    it('should support multiple levels of inheritance', () => {
      @Injectable()
      class BaseService {
        getName() {
          return 'base';
        }
      }

      class Level1Module extends ProviderModuleClass {
        getModuleType() {
          return 'Level1';
        }
      }

      class Level2Module extends Level1Module {
        getExtendedType() {
          return `${this.getModuleType()}-Extended`;
        }
      }

      class Level3Module extends Level2Module {
        constructor() {
          super({
            id: 'Level3Module',
            providers: [BaseService],
          });
        }

        getFullType() {
          return `${this.getExtendedType()}-Level3`;
        }
      }

      const module = new Level3Module();

      expect(module.getModuleType()).toBe('Level1');
      expect(module.getExtendedType()).toBe('Level1-Extended');
      expect(module.getFullType()).toBe('Level1-Extended-Level3');
      expect(module.module.get(BaseService)).toBeInstanceOf(BaseService);
    });
  });

  describe('OOP Module with Imports and Exports', () => {
    it('should support importing other modules in OOP style', () => {
      @Injectable()
      class ConfigService {
        getConfig() {
          return { apiUrl: 'https://api.example.com' };
        }
      }

      @Injectable()
      class LoggerService {
        log(message: string) {
          return message;
        }
      }

      class ConfigModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'ConfigModule',
            providers: [ConfigService],
            exports: [ConfigService],
          });
        }
      }

      class LoggerModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'LoggerModule',
            providers: [LoggerService],
            exports: [LoggerService],
          });
        }
      }

      @Injectable()
      class ApiService {
        constructor(
          private config: ConfigService,
          private logger: LoggerService
        ) {}

        makeRequest() {
          const config = this.config.getConfig();
          this.logger.log(`Making request to ${config.apiUrl}`);
          return config;
        }
      }

      class ApiModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'ApiModule',
            imports: [new ConfigModule().module, new LoggerModule().module],
            providers: [ApiService],
            exports: [ApiService],
          });
        }

        get api(): ApiService {
          return this.module.get(ApiService);
        }
      }

      const apiModule = new ApiModule();
      const result = apiModule.api.makeRequest();

      expect(result).toEqual({ apiUrl: 'https://api.example.com' });
    });

    it('should support dynamic imports in OOP modules', () => {
      @Injectable()
      class Service1 {}

      @Injectable()
      class Service2 {}

      class Module1 extends ProviderModuleClass {
        constructor() {
          super({
            id: 'Module1',
            providers: [Service1],
            exports: [Service1],
          });
        }
      }

      class Module2 extends ProviderModuleClass {
        constructor() {
          super({
            id: 'Module2',
            providers: [Service2],
          });
        }

        importDynamicModule() {
          this.module.update.addImport(new Module1().module);
        }
      }

      const module2 = new Module2();

      // Service1 not available yet
      expect(module2.module.hasProvider(Service1)).toBe(false);

      // Import Module1 dynamically
      module2.importDynamicModule();

      // Service1 now available
      expect(module2.module.hasProvider(Service1)).toBe(true);
      expect(module2.module.get(Service1)).toBeInstanceOf(Service1);
    });
  });

  describe('OOP Module with State Management', () => {
    it('should support stateful modules with private fields', () => {
      @Injectable()
      class CacheService {
        private cache = new Map<string, any>();

        set(key: string, value: any) {
          this.cache.set(key, value);
        }

        get(key: string) {
          return this.cache.get(key);
        }

        has(key: string): boolean {
          return this.cache.has(key);
        }
      }

      class CacheModule extends ProviderModuleClass {
        private requestCount = 0;
        private lastAccessTime: number | null = null;

        constructor() {
          super({
            id: 'CacheModule',
            providers: [CacheService],
            exports: [CacheService],
          });
        }

        cacheValue(key: string, value: any) {
          this.requestCount++;
          this.lastAccessTime = Date.now();
          const cache = this.module.get(CacheService);
          cache.set(key, value);
        }

        getCachedValue(key: string) {
          this.requestCount++;
          this.lastAccessTime = Date.now();
          const cache = this.module.get(CacheService);
          return cache.get(key);
        }

        getStats() {
          return {
            requestCount: this.requestCount,
            lastAccessTime: this.lastAccessTime,
          };
        }
      }

      const cacheModule = new CacheModule();

      cacheModule.cacheValue('user:1', { name: 'Alice' });
      cacheModule.cacheValue('user:2', { name: 'Bob' });

      const user1 = cacheModule.getCachedValue('user:1');
      expect(user1).toEqual({ name: 'Alice' });

      const stats = cacheModule.getStats();
      expect(stats.requestCount).toBe(3); // 2 sets + 1 get
      expect(stats.lastAccessTime).toBeGreaterThan(0);
    });
  });

  describe('OOP Module with Different Scopes', () => {
    it('should respect provider scopes in OOP modules', () => {
      @Injectable(InjectionScope.Singleton)
      class SingletonService {
        id = Math.random();
      }

      @Injectable(InjectionScope.Transient)
      class TransientService {
        id = Math.random();
      }

      class ScopedModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'ScopedModule',
            providers: [SingletonService, TransientService],
          });
        }

        getSingleton(): SingletonService {
          return this.module.get(SingletonService);
        }

        getTransient(): TransientService {
          return this.module.get(TransientService);
        }
      }

      const module = new ScopedModule();

      // Singleton returns same instance
      const singleton1 = module.getSingleton();
      const singleton2 = module.getSingleton();
      expect(singleton1).toBe(singleton2);
      expect(singleton1.id).toBe(singleton2.id);

      // Transient returns new instance
      const transient1 = module.getTransient();
      const transient2 = module.getTransient();
      expect(transient1).not.toBe(transient2);
      expect(transient1.id).not.toBe(transient2.id);
    });
  });

  describe('OOP Module Lifecycle', () => {
    it('should support dispose in OOP modules', async () => {
      const onDisposeMock = jest.fn();

      @Injectable()
      class TestService {}

      class TestModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'TestModule',
            providers: [TestService],
            onDispose: () => ({
              before: onDisposeMock,
            }),
          });
        }
      }

      const module = new TestModule();
      await module.module.dispose();

      expect(onDisposeMock).toHaveBeenCalledTimes(1);
      expect(onDisposeMock).toHaveBeenCalledWith(module.module);
    });
  });

  describe('OOP vs Functional Equivalence', () => {
    it('should behave identically to functional modules', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'test-value';
        }
      }

      // Functional style
      const functionalModule = ProviderModule.create({
        id: 'FunctionalModule',
        providers: [TestService],
        exports: [TestService],
      });

      // OOP style
      class OOPModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'OOPModule',
            providers: [TestService],
            exports: [TestService],
          });
        }
      }

      const oopModule = new OOPModule();

      // Both should resolve providers identically
      const functionalService = functionalModule.get(TestService);
      const oopService = oopModule.module.get(TestService);

      expect(functionalService).toBeInstanceOf(TestService);
      expect(oopService).toBeInstanceOf(TestService);
      expect(functionalService.getValue()).toBe(oopService.getValue());

      // Both should have same module capabilities
      expect(functionalModule.hasProvider(TestService)).toBe(true);
      expect(oopModule.module.hasProvider(TestService)).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle errors in custom methods gracefully', () => {
      @Injectable()
      class ErrorService {
        throwError() {
          throw new Error('Service error');
        }
      }

      class ErrorModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'ErrorModule',
            providers: [ErrorService],
          });
        }

        triggerError() {
          const service = this.module.get(ErrorService);
          return service.throwError();
        }
      }

      const module = new ErrorModule();

      expect(() => module.triggerError()).toThrow('Service error');
    });

    it('should support method chaining in OOP modules', () => {
      @Injectable()
      class ChainService {
        value = '';

        append(text: string) {
          this.value += text;
        }
      }

      class ChainModule extends ProviderModuleClass {
        constructor() {
          super({
            id: 'ChainModule',
            providers: [ChainService],
          });
        }

        append(text: string): this {
          const service = this.module.get(ChainService);
          service.append(text);
          return this;
        }

        getValue(): string {
          const service = this.module.get(ChainService);
          return service.value;
        }
      }

      const module = new ChainModule();

      const result = module.append('Hello').append(' ').append('World').getValue();

      expect(result).toBe('Hello World');
    });
  });
});
