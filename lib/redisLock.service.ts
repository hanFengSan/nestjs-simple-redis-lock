import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import * as debugFactory from 'debug';

const debug = debugFactory('nestjs-simple-redis-lock');
debug('booting %o', 'nestjs-simple-redis-lock');

@Injectable()
export class RedisLockService {
  public readonly uuid: string = RedisLockService.generateUuid();

  constructor(
    protected readonly redis: RedisService,
  ) {
    console.log(`RedisLock: uuid: ${this.uuid}`);
  }

  private prefix(name): string {
    return `lock:${name}`;
  }

  /**
   * Generate a uuid for identify each distributed node 
   */
  private static generateUuid(): string {
    let d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: String) => {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  /**
   * Try to lock once
   * @param {string} name lock name 
   * @param {number} [expire] milliseconds, TTL for the redis key
   * @returns {boolean} true: success, false: failed
   */
  public async lockOnce(name, expire) {
    const client = this.redis.getClient();
    const result = await client.set(this.prefix(name), this.uuid, 'PX', expire, 'NX');
    debug(`lock: ${name}, result: ${result}`);
    return result !== null;
  }

  /**
   * Get a lock, automatically retrying if failed
   * @param {string} name lock name
   * @param {number} [retryInterval] milliseconds, the interval to retry if failed
   * @param {number} [maxRetryTimes] max times to retry
   */
  public async lock(name: string, expire: number = 60000, retryInterval: number = 100, maxRetryTimes: number = 36000): Promise<void> {
    let retryTimes = 0;
    while (true) {
      if (await this.lockOnce(name, expire)) {
        break;
      } else {
        await this.sleep(retryInterval);
        if (retryTimes >= maxRetryTimes) {
          throw new Error(`RedisLockService: locking ${name} timed out`);
        }
        retryTimes++;
      }
    }
  }

  /**
   * Unlock a lock by name
   * @param {string} name lock name
   */
  public async unlock(name) {
    const client = this.redis.getClient();
    const result = await client.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      this.prefix(name),
      this.uuid,
    );
    debug(`unlock: ${name}, result: ${result}`);
  }

  /**
   * Set TTL for a lock
   * @param {string} name lock name 
   * @param {number} milliseconds TTL
   */
  public async setTTL(name, milliseconds) {
    const client = this.redis.getClient();
    const result = await client.pexpire(this.prefix(name), milliseconds);
    debug(`set TTL: ${name}, result: ${result}`);
  }

  /**
   * @param {number} ms milliseconds, the sleep interval
   */
  public sleep(ms: Number): Promise<Function> {
    return new Promise(resolve => setTimeout(resolve, Number(ms)));
  }
}
