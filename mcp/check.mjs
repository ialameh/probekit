#!/usr/bin/env node
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {fileURLToPath} from 'node:url';
const client=new Client({name:'probekit-connection-check',version:'1.0.0'});
const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],stderr:'pipe'});
const timer=setTimeout(()=>{console.error('Connection check timed out. Verify the installation and Node.js version.');process.exit(1);},20000);
try{
 await client.connect(transport);
 const {tools}=await client.listTools();
 const expected=['search_investigations','describe_investigation','build_query_plan','analyse_exports','compare_exports'];
 if(expected.some(name=>!tools.some(t=>t.name===name)))throw Error('A required tool is missing.');
 const result=await client.callTool({name:'search_investigations',arguments:{limit:1}});
 if(result.isError)throw Error('Catalogue query failed.');
 const data=result.structuredContent??JSON.parse(result.content[0].text);
 if(data.total!==61)throw Error('Unexpected catalogue count.');
 console.log('PASS: local stdio connection, five tools and 61 investigations. No org connection or query execution.');
 console.log('Next: run pnpm --dir mcp config and copy the JSON into your client’s equivalent stdio server settings.');
}catch(e){console.error('Connection check failed: '+e.message);process.exitCode=1;}
finally{clearTimeout(timer);await client.close();}
