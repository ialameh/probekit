#!/usr/bin/env node
import {fileURLToPath} from 'node:url';
console.log(JSON.stringify({mcpServers:{probekit:{command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))]}}},null,2));
