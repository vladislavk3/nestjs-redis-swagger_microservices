import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { promisify } from 'util';
import * as redis from 'redis';
import * as crypto from 'crypto';

// Using redis from limiting
@Injectable()
export class AuthLimiter implements OnModuleInit {
  private client: redis.RedisClient;
  private readonly LIMIT = 5; // No of otp's a user can send in a 15 min window
  private readonly BLOCK_SEC = 15 * 60;

  // Async functions
  private getAsync: any;
  private setAsync: any;
  private ttl: any;
  private expire: any;

  onModuleInit() {
    // config redis server
    this.client = redis.createClient({
      url: process.env.REDIS_URI,
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.ttl = promisify(this.client.ttl).bind(this.client);
    this.expire = promisify(this.client.expire).bind(this.client);
  }

  // ttl is in Sec
  private async save(key: string, ttl: number, data: any) {
    const _data = JSON.stringify(data);
    await this.setAsync(key, _data);
    await this.expire(key, ttl);
  }

  private getKey(ip: string) {
    return crypto
      .createHash('sha1')
      .update(ip)
      .digest('hex');
  }

  async check(ip: string) {
    Logger.log(`Request from otp from IP ${ip}`);
    // @Description
    // Each User can make 5 Otp calls
    // if he reached his limit of 5 otp calls from the same Ip then his will have to wait for 15 min
    // If the user hit the api at the time when he is blocked then his wait time will be increaed with 15 Min.
    // On hitting the api again and again at the block time the block time will keep inceasing 15 min.

    // Key is a hash of the current user's IP address
    const key = this.getKey(ip);

    // Now check the redis DB if the user is blocked
    const _info = await this.getAsync(key);
    if (_info) {
      const ttl = await this.ttl(key);

      // This means the user's info is in the DB
      const { hits } = JSON.parse(_info);
      // if hits are less then five then just increase the hit count and save
      if (hits < this.LIMIT) {
        this.save(key, ttl, {
          hits: hits + 1,
        });

        return {
          allowed: true,
          tryAfter: 0,
          attempt: hits + 1,
        };
      }

      // Godd stuff block user here
      const newTTL = ttl + this.BLOCK_SEC;
      this.save(key, newTTL, {
        hits: hits + 1,
      });

      return {
        allowed: false,
        tryAfter: newTTL,
        attempt: hits + 1,
      };
    }

    // A new request
    await this.save(key, this.BLOCK_SEC, {
      hits: 1,
    });

    return {
      allowed: true,
      tryAfter: 0,
      attempt: 1,
    };
  }
}
