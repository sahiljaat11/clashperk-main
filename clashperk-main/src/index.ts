import 'reflect-metadata';

import * as Sentry from '@sentry/node';
import { DiscordjsErrorCodes, ShardingManager } from 'discord.js';
import { createServer } from 'node:http';
import { URL, fileURLToPath } from 'node:url';
import { Logger } from './util/logger.js';
import { sentryConfig } from './util/sentry.js';

if (process.env.SENTRY) {
  Sentry.init(sentryConfig);
}

class Manager extends ShardingManager {
  private _readyShards = 0;

  private logger = new Logger(null);

  public constructor() {
    super(fileURLToPath(new URL('main.js', import.meta.url)), {
      token: process.env.TOKEN!,
      execArgv: ['--enable-source-maps', '--trace-warnings']
    });
  }

  public isReady() {
    return this._readyShards > 0;
  }

  public async init() {
    try {
      await this.spawn({ timeout: 1000 * 60 });
      this._readyShards = this.shards.size;
      this.log(`All Shards (${this.shards.size}) Ready`);
    } catch (error: any) {
      this.logger.error(error, { label: ShardingManager.name.toString() });

      if (error.code === DiscordjsErrorCodes.TokenInvalid) {
        process.exit(1);
      }
    }
  }

  public log(message: string) {
    this.logger.debug(message, { label: ShardingManager.name });
  }
}

const manager = new Manager();

process.on('unhandledRejection', (error) => {
  console.error(error);
});

manager.init();

const server = createServer((_, res) => {
  const isReady = manager.isReady();
  res.writeHead(isReady ? 200 : 500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ isReady }));
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  manager.log(`Listening on http://localhost:${port}`);
});