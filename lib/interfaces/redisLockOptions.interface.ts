import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export interface RedisLockOptions {
  clientName?: string;
  prefix?: string;
}

export interface RedisLockOptionsFactory {
  createRedisLockOptions(): Promise<RedisLockOptions> | RedisLockOptions;
}

export interface RedisLockAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<RedisLockOptionsFactory>;
  useClass?: Type<RedisLockOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<RedisLockOptions> | RedisLockOptions;
  inject?: any[];
}

let s: RedisLockOptions = { prefix: '12'};
