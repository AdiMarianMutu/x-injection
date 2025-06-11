import { Injectable } from '../../src';

@Injectable()
export class GlobalService {}

@Injectable()
export class EmptyService {}

@Injectable()
export class EmptyService2 {}

@Injectable()
export class EmptyService3 {}

@Injectable()
export class FilledService {
  constructor(
    public readonly emptyBox: EmptyService,
    public readonly emptyCan: EmptyService
  ) {}
}
