import { AppModule as _AppModule, InjectionScope, ProviderModule } from '../../src';
import { CLASS_PROVIDER, COMPLEX_FACTORY_PROVIDER, FACTORY_PROVIDER, VALUE_PROVIDER } from './providers';
import { EmptyService, LoggerService, PaymentService, RequestService, UserService } from './services';

export const AppModule = _AppModule.register<true>({
  providers: [LoggerService, { provide: 'USER_SERVICE', useClass: UserService }],
});

export const EmptyModule = new ProviderModule({ identifier: Symbol('EmptyModule') }).toNaked();

export const SingletonModule_NoExports = new ProviderModule({
  identifier: Symbol('SingletonModule_NoExports'),
  defaultScope: InjectionScope.Singleton,
  providers: [EmptyService],
}).toNaked();

export const SingletonModule_WithExports = new ProviderModule({
  identifier: Symbol('SingletonModule_WithExports'),
  defaultScope: InjectionScope.Singleton,
  providers: [EmptyService],
  exports: [EmptyService],
}).toNaked();

export const TransientModule_NoExports = new ProviderModule({
  identifier: Symbol('TransientModule_NoExports'),
  defaultScope: InjectionScope.Transient,
  providers: [EmptyService],
}).toNaked();

export const TransientModule_WithExports = new ProviderModule({
  identifier: Symbol('TransientModule_WithExports'),
  defaultScope: InjectionScope.Transient,
  providers: [EmptyService],
  exports: [EmptyService],
}).toNaked();

export const TransientModule_ImportsSingletonModule_WithExports = new ProviderModule({
  identifier: Symbol('TransientModule_ImportsSingletonModule_WithExports'),
  defaultScope: InjectionScope.Transient,
  providers: [{ provide: 'TRANSIENT_EMPTY_SERVICE', useClass: EmptyService }],
  imports: [SingletonModule_WithExports],
  exports: [SingletonModule_WithExports, { provide: 'TRANSIENT_EMPTY_SERVICE', useClass: EmptyService }],
}).toNaked();

export const RequestModule_NoExports = new ProviderModule({
  identifier: Symbol('RequestModule_NoExports'),
  defaultScope: InjectionScope.Request,
  providers: [RequestService, EmptyService],
}).toNaked();

export const RequestModule_WithExports = new ProviderModule({
  identifier: Symbol('RequestModule_WithExports'),
  defaultScope: InjectionScope.Request,
  providers: [RequestService, EmptyService],
  exports: [RequestService, EmptyService],
}).toNaked();

export const ImportedModuleWithNoExports_NoExports = new ProviderModule({
  identifier: Symbol('ImportedModuleWithNoExports_NoExports'),
  imports: [SingletonModule_NoExports],
}).toNaked();

export const ImportedModuleWithExports_NoExports = new ProviderModule({
  identifier: Symbol('ImportedModuleWithExports_NoExports'),
  imports: [SingletonModule_WithExports],
}).toNaked();

export const ImportedModuleWithExports_WithExports = new ProviderModule({
  identifier: Symbol('ImportedModuleWithExports_WithExports'),
  imports: [SingletonModule_WithExports],
  exports: [SingletonModule_WithExports],
}).toNaked();

export const ImportedModuleWithNoExports_WithExports = new ProviderModule({
  identifier: Symbol('ImportedModuleWithNoExports_WithExports'),
  imports: [ImportedModuleWithNoExports_NoExports],
  exports: [ImportedModuleWithNoExports_NoExports],
}).toNaked();

export const NestedImportedModule_WithExportedModules = new ProviderModule({
  identifier: Symbol('NestedImportedModule_WithExportedModules'),
  imports: [ImportedModuleWithExports_WithExports],
  exports: [ImportedModuleWithExports_WithExports],
}).toNaked();

export const NestedImportedModuleNoExports_WithExportedModules = new ProviderModule({
  identifier: Symbol('NestedImportedModuleNoExports_WithExportedModules'),
  imports: [ImportedModuleWithExports_WithExports],
}).toNaked();

export const NestedImportedModuleNoExports_WithPrivateExportedModules = new ProviderModule({
  identifier: Symbol('NestedImportedModuleNoExports_WithPrivateExportedModules'),
  imports: [ImportedModuleWithExports_NoExports],
}).toNaked();

export const ClassProviderModule = new ProviderModule({
  identifier: Symbol('ClassProviderModule'),
  providers: [CLASS_PROVIDER],
}).toNaked();

export const ValueProviderModule = new ProviderModule({
  identifier: Symbol('ValueProviderModule'),
  providers: [VALUE_PROVIDER],
}).toNaked();

export const FactoryProviderModule = new ProviderModule({
  identifier: Symbol('FactoryProviderModule'),
  providers: [FACTORY_PROVIDER],
}).toNaked();

export const ComplexFactoryProviderModule = new ProviderModule({
  identifier: Symbol('ComplexFactoryProviderModule'),
  providers: [COMPLEX_FACTORY_PROVIDER],
}).toNaked();

export const DynamicExportsModule = new ProviderModule({
  identifier: Symbol('DynamicExportsModule'),
  providers: [EmptyService, PaymentService],
  exports: [EmptyService, PaymentService],
  dynamicExports: (importedModule, moduleExports) => {
    if (importedModule.toString() !== 'EmptyModule_ImportingModuleWithDynamicExports') return moduleExports;

    return [EmptyService];
  },
});

export const EmptyModule_ImportingModuleWithDynamicExports_NoExports = new ProviderModule({
  identifier: Symbol('EmptyModule_ImportingModuleWithDynamicExports'),
  imports: [DynamicExportsModule],
});
