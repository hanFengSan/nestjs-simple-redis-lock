# nestjs-simple-redis-lock
Distributed lock with single redis instance, simple and easy to use for [Nestjs](https://github.com/nestjs/nest)

## Installation
```
npm install nestjs-simple-redis-lock
```

## Usage
You must install [nestjs-redis](https://github.com/kyknow/nestjs-redis), and use in Nest. This package use it to access redis:
```JavaScript
// app.ts
import { RedisModule } from 'nestjs-redis';
import { RedisLockModule } from 'nestjs-simple-redis-lock';

@Module({
  imports: [
    ...
    RedisModule.forRootAsync({ // import RedisModule before RedisLockModule
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
        db: parseInt(config.get('REDIS_DB'), 10),
        password: config.get('REDIS_PASSWORD'),
        keyPrefix: config.get('REDIS_KEY_PREFIX'),
      }),
      inject: [ConfigService],
    }),
    RedisLockModule.register({}), // import RedisLockModule, use default configuration
  ]
})
export class AppModule {}
```
### 1. Simple example
```TypeScript
import { RedisLockService } from 'nestjs-simple-redis-lock';

export class FooService {
  constructor(
    protected readonly lockService: RedisLockService, // inject RedisLockService 
  ) {}

  async test1() {
    try {
      /**
       * Get a lock by name
       * Automatically unlock after 1min
       * Try again after 100ms
       * The max times to retry is 600, about 1min
       */
      await this.lockService.lock('test1');
      // Do somethings
    } finally { // use 'finally' to ensure unlocking
      this.lockService.unlock('test1'); // unlock
      // Or: await this.lockService.unlock('test1'); wait for the unlocking
    }
  }
  
  async test2() {
    /**
     * Automatically unlock after 2min
     * Try again after 50ms if failed
     * The max times to retry is 100
     */
    await this.lockService.lock('test1', 2 * 60 * 1000, 50, 100);
    // Do somethings
    await this.lockService.setTTL('test1', 60000); // Renewal the lock when the program is very time consuming, avoiding automatically unlock
    this.lockService.unlock('test1');
  }
}
```

### 2. Example by using decorator
Using `nestjs-simple-redis-lock` by decorator, the locking and unlocking will be very easy.
Simple example with constant lock name:
```TypeScript
import { RedisLockService, RedisLock } from 'nestjs-simple-redis-lock';

export class FooService {
  constructor(
    protected readonly lockService: RedisLockService, // inject RedisLockService 
  ) {}

  /**
   * Wrap the method, starting with getting a lock, ending with unlocking
   * The first parameter is lock name
   * By default, automatically unlock after 1min.
   * By default, try again after 100ms if failed
   * By default, the max times to retry is 600, about 1min
   */
  @RedisLock('test2')
  async test1() {
    // Do somethings
    return 'some values';
  }

  /**
   * Automatically unlock after 2min
   * Try again after 50ms if failed
   * The max times to retry is 100
   */ 
  @RedisLock('test2', 2 * 60 * 1000, 50, 100)
  async test2() {
    // Do somethings
    return 'some values';
  }
}
```

The first parameter of this decorator is a powerful function. It can use to determinate lock name by many ways. 
Simple example with dynamic lock name:
```TypeScript
import { RedisLockService, RedisLock } from 'nestjs-simple-redis-lock';

export class FooService {
  lockName = 'test3';

  constructor(
    protected readonly lockService: RedisLockService, // inject RedisLockService 
  ) {}

  /**
   * Determinate lock name from 'this'
   * The first parameter is 'this', so you can access any member in 'this' for create a dynamic lock name.
   */
  @RedisLock((target) => target.lockName)
  async test1() {
    // Do somethings
    return 'some values';
  }

  /**
   * Determinate lock name from the parameters of the method
   * The original parameters also pass to the function, so you can determinate the lock name by the parameters.
   */
  @RedisLock((target, param1, param2) => param1 + param2)
  async test2(param1, param2) {
    // Do somethings
    return 'some values';
  }
}
```

## Configuration
* Register:*
```TypeScript
@Module({
  imports: [
    RedisLockModule.register({
      clientName: 'client_name', // the Redis client name in nestjs-redis, to use specific Redis client. Default to use default client
      prefix: 'my_lock:', // By default, the prefix is 'lock:'
    })
  ]
})
```
*Async register:*
```TypeScript
@Module({
  imports: [
    RedisLockModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (config: ConfigService) => ({
            clientName: config.get('REDIS_LOCK_CLIENT_NAME')
          }),
          inject: [ConfigService],
        }),
  ]
})
```

## Debug
Add a environment variable `DEBUG=nestjs-simple-redis-lock` when start application to check log:
```json
// package.json
{
  "scripts": {
    "start:dev": "DEBUG=nestjs-simple-redis-lock tsc-watch -p tsconfig.build.json --onSuccess \"node dist/main.js\"",
  }
}
```
