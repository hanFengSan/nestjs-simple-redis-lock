import { RedisLockService } from "./redisLock.service";

interface GetLockNameFunc {
  (target: any, ...args): string;
}

/**
 * Wrap a method, starting with getting a lock, ending with unlocking
 * @param {string} name lock name
 * @param {number} [retryInterval]  milliseconds, the interval to retry
 * @param {number} [maxRetryTimes]  max times to retry
 */
export function RedisLock(lockName: String | GetLockNameFunc, expire?: number, retryInterval?: number, maxRetryTimes?: number) {
  return function (target, key, descriptor) {
    const value = descriptor.value;
    const getLockService = (that): RedisLockService => {
      let lockService: RedisLockService;
      for (let i in that) {
        if (that[i] instanceof RedisLockService) {
          lockService = that[i];
          break;
        }
      }
      if (!lockService) {
        throw new Error('RedisLock: cannot find the instance of RedisLockService');
      }
      return lockService;
    }
    descriptor.value = async function (...args) {
      const lockService = getLockService(this);
      let name: string;
      if (typeof lockName === 'string') {
        name = lockName;
      } else if (typeof lockName === 'function') {
        name = lockName(this, ...args);
      }
      try {
        await lockService.lock(name, expire, retryInterval, maxRetryTimes);
        return await value.call(this, ...args);
      } finally {
        lockService.unlock(name);
      }
    }
    return descriptor;
  }
}