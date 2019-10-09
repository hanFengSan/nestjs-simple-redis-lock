# nestjs-agenda
Distributed lock with single redis instance, simple and easy to use for [Nestjs](https://github.com/nestjs/nest)

# Installation
```
npm install nestjs-simple-redis-lock
```

# Usage
You must install [nestjs-redis](https://github.com/kyknow/nestjs-redis), and use in Nest:
```JavaScript
// app.ts
import { RedisModule } from 'nestjs-redis';

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
    RedisLockModule, // import RedisLockModule
  ]
})
export class AppModule {}
```
## 1. Example
```TypeScript
import { RedisLockService } from 'nestjs-simple-redis-lock';

export class FooService {
  constructor(
    protected readonly lockService: RedisLockService, // inject RedisLockService 
  ) {}

  async test1() {
    /**
     * Get a lock by name
     * Automatically unlock after 1min
     * Try again after 100ms
     * The max times to retry is 36000, about 1h
     */
    await this.lockService.lock('test1');
    // Do somethings
    this.lockService.unlock('test1'); // unlock a lock
    // Or: await this.lockService.unlock('test1'); wait for the unlocking
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

## 2. Example by using decorator
```TypeScript
import { RedisLockService, RedisLock } from 'nestjs-simple-redis-lock';

export class FooService {
  constructor(
    protected readonly lockService: RedisLockService, // inject RedisLockService 
  ) {}

  // Wrap the method, starting with getting a lock, ending with unlocking
  @RedisLock('test2')
  async test1() {
    // Do somethings
    return 'some values';
  }

  /**
   * Wrap the method, starting with getting a lock, ending with unlocking
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

# DEBUG
Add a environment variable `DEBUG=nestjs-simple-redis-lock` when start application to check log:
```json
// package.json
{
  "scripts": {
    "start:dev": "DEBUG=nestjs-simple-redis-lock tsc-watch -p tsconfig.build.json --onSuccess \"node dist/main.js\"",
  }
}
```