import {readFileSync} from 'node:fs';
export const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
export function stampRelease(text,count){return text.replaceAll('__PROBEKIT_VERSION__',version).replaceAll('__PROBEKIT_COUNT__',String(count));}
