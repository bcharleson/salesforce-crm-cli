import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** Single source of truth — read from package.json at build/runtime. */
export const VERSION: string = require('../package.json').version;
