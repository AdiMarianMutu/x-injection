import { Injectable, InjectionScope } from '../../src';

@Injectable()
export class EmptyService {}

@Injectable()
export class LoggerService {
  log(message: string): void {
    console.log(`[Logger]: ${message}`);
  }
}

@Injectable()
export class UserService {
  firstName?: string;
  lastName?: string;
  age?: number;
  dateOfBirth?: { day: number; month: number; year: number };

  constructor(private readonly loggerService: LoggerService) {}

  logFullName(): void {
    this.loggerService.log(`${this.firstName} ${this.lastName}`);
  }
}

@Injectable()
export class RequestService {
  constructor(
    public readonly firstEmptyService: EmptyService,
    public readonly secondEmptyService: EmptyService
  ) {}
}

@Injectable()
export class PaymentService {}

@Injectable(InjectionScope.Singleton)
export class SingletonDecoratedService {}

@Injectable(InjectionScope.Transient)
export class TransientDecoratedService {}
