import {
  AppModule,
  Injectable,
  InjectionProviderModuleMissingIdentifierError,
  InjectionProviderModuleMissingProviderError,
  InjectionScope,
  ProviderModule,
} from '../src';
import { EmptyService, EmptyService2, GlobalService } from './setup';

describe('Misc', () => {
  afterEach(() => jest.clearAllMocks());

  it('should throw if no `identifier` provided during initialization', () => {
    expect(() => ProviderModule.create({} as any)).toThrow(InjectionProviderModuleMissingIdentifierError);
  });

  it('should retrieve providers as a list when multiple bounds', () => {
    const m0 = ProviderModule.create({
      id: 'm0',
      providers: [
        { provide: EmptyService, useClass: EmptyService },
        { provide: EmptyService, useClass: EmptyService2 },
      ],
    });

    expect(m0.hasProvider(EmptyService)).toBe(true);
    expect(m0.hasProvider(EmptyService2)).toBe(false);

    const resolved = m0.get(EmptyService, false, true);

    expect(resolved.length).toBe(2);
    expect(resolved[0]).toBeInstanceOf(EmptyService);
    expect(resolved[1]).toBeInstanceOf(EmptyService2);
  });

  it('should be able to use `getMany`', () => {
    const [globalService, constant, shouldBeUndefined] = AppModule.getMany(GlobalService, 'CONSTANT', {
      provider: 'NOT_EXISTING',
      isOptional: true,
    });

    const m0 = ProviderModule.create({
      id: 'm0',
      providers: [
        { provide: EmptyService, useClass: EmptyService },
        { provide: EmptyService, useClass: EmptyService2 },
      ],
    });

    const [emptyServiceList] = m0.getMany({ provider: EmptyService, asList: true });

    expect(globalService).toBeInstanceOf(GlobalService);
    expect(constant).toBe('22.03.2013');
    expect(shouldBeUndefined).toBeUndefined();

    expect(emptyServiceList.length).toBe(2);
  });

  it('should check if module is exporting a module via `ModuleIdentifier`', () => {
    const m0 = ProviderModule.create({ id: 'm0' });

    const m0_0Id = Symbol('m0_0');
    const m0_0 = ProviderModule.create({ id: m0_0Id });
    const m1 = ProviderModule.create({ id: 'm1', imports: [m0, m0_0], exports: [m0, m0_0] });

    expect(m1.isExportingModule('m0')).toBe(true);
    expect(m1.isExportingModule(m0_0Id)).toBe(true);
  });

  it('should check if module is exporting a provider via `ProviderIdentifier`', () => {
    const m0 = ProviderModule.create({ id: 'm0' });
    const m1 = ProviderModule.create({ id: 'm1', imports: [m0], exports: [m0] });

    expect(m1.isExportingModule('m0')).toBe(true);
  });

  it('should get global provider via the AppModule container', () => {
    const m0 = ProviderModule.create({ id: 'm0' });

    expect(m0.get(GlobalService)).toBeInstanceOf(GlobalService);
  });

  it('should not throw when trying to get an unbound provider with the is optional flag', () => {
    expect(() => {
      ProviderModule.create({ id: 'm0' }).get('OPTIONAL_FLAG', true);
    }).not.toThrow(InjectionProviderModuleMissingProviderError);
  });

  it('should test complex class decorator injection', () => {
    @Injectable(InjectionScope.Transient)
    class BeltSeat {}

    @Injectable(InjectionScope.Transient)
    class Seat {
      constructor(
        public readonly firstBeltSeat: BeltSeat,
        public readonly secondBeltSeat: BeltSeat
      ) {}
    }

    @Injectable(InjectionScope.Singleton)
    class CarOwner {}

    @Injectable(InjectionScope.Transient)
    class Vehicle {
      constructor(
        public readonly owner: CarOwner,
        public readonly frontSeat: Seat,
        public readonly backSeat: Seat
      ) {}
    }

    @Injectable(InjectionScope.Transient)
    class Car {
      constructor(public readonly vehicle: Vehicle) {}
    }

    const CarPartsModuleBlueprint = ProviderModule.blueprint({
      id: 'CarPartsModule',
      providers: [Seat, BeltSeat],
      exports: [Seat, BeltSeat],
    });

    const OwnerModuleBlueprint = ProviderModule.blueprint({
      id: 'OwnerModule',
      providers: [CarOwner],
      exports: [CarOwner],
    });

    const VehicleModuleBlueprint = ProviderModule.create({
      id: 'VehicleModule',
      imports: [OwnerModuleBlueprint, CarPartsModuleBlueprint],
      providers: [Vehicle],
      exports: [Vehicle],
    });

    const CarModule = ProviderModule.create({
      id: 'CarModule',
      imports: [VehicleModuleBlueprint],
      providers: [Car],
      exports: [Car],
    });

    const car0 = CarModule.get(Car);
    const car1 = CarModule.get(Car);

    expect(car0).toBeInstanceOf(Car);
    expect(car1).toBeInstanceOf(Car);
    expect(car0).not.toBe(car1);
    expect(car0.vehicle.owner).toBe(car1.vehicle.owner);

    expect(car0.vehicle.frontSeat).not.toBe(car0.vehicle.backSeat);
    expect(car0.vehicle.frontSeat.firstBeltSeat).not.toBe(car0.vehicle.frontSeat.secondBeltSeat);
    expect(car0.vehicle.backSeat.firstBeltSeat).not.toBe(car0.vehicle.backSeat.secondBeltSeat);

    expect(car0.vehicle.frontSeat).not.toBe(car1.vehicle.frontSeat);
    expect(car0.vehicle.frontSeat.firstBeltSeat).not.toBe(car1.vehicle.frontSeat.firstBeltSeat);
    expect(car0.vehicle.backSeat.firstBeltSeat).not.toBe(car1.vehicle.backSeat.firstBeltSeat);
  });
});
