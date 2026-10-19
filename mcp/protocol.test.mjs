import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
test('stdio handshake, tool discovery, all tool calls and validation',{timeout:20000},async()=>{
 const client=new Client({name:'probekit-integration-test',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))],stderr:'pipe'});
 let stderr='';transport.stderr?.on('data',b=>stderr+=b);
 try{
  await client.connect(transport);const listed=await client.listTools();assert.equal(listed.tools.length,7);for(const t of listed.tools)assert.equal(t.annotations.readOnlyHint,true);
  const call=async(name,args)=>{const r=await client.callTool({name,arguments:args});assert.ok(!r.isError,JSON.stringify(r));return r.structuredContent??JSON.parse(r.content[0].text);};
  assert.equal((await call('search_investigations',{family:'flow'})).total,3);
  assert.equal((await call('describe_investigation',{id:'data.record'})).family,'data');
  const parameters={obj:'Account',id:'001000000000001',fields:'Id, Name'};
  const plan=await call('build_query_plan',{id:'data.record',parameters});const run={parameters,exports:{record:{query:plan.steps[0].query,text:'[{"Id":"001000000000001","Name":"Example account"}]'}}};
  assert.equal((await call('analyse_exports',{id:'data.record',...run})).steps[0].rows,1);
  assert.equal((await call('compare_exports',{id:'data.record',a:run,b:run})).comparisons[0].state,'same');
  assert.equal((await call('get_investigation_bundle',{})).bundles.length,6);
  const example=await call('get_investigation_example',{id:'ops.approval-history'});assert.equal(example.sample,true);assert.ok((await call('analyse_exports',example.analysisInput)).steps.every(s=>s.state==='complete'));
  const invalid=await client.callTool({name:'build_query_plan',arguments:{id:'data.record',parameters:{obj:'Account WHERE Id != null'}}});assert.equal(invalid.isError,true);
  const extra=await client.callTool({name:'search_investigations',arguments:{path:'/tmp/private'}});assert.equal(extra.isError,true);
 }finally{await client.close();}
 assert.equal(stderr,'');
});

test('setup commands produce usable config and a successful connection check',{timeout:25000},async()=>{
 const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const exec=promisify(execFile);
 const config=JSON.parse((await exec(process.execPath,[fileURLToPath(new URL('./config.mjs',import.meta.url))])).stdout);
 assert.equal(config.mcpServers.probekit.command,process.execPath);
 assert.equal(config.mcpServers.probekit.args[0],fileURLToPath(new URL('./server.mjs',import.meta.url)));
 const check=await exec(process.execPath,[fileURLToPath(new URL('./check.mjs',import.meta.url))],{timeout:22000});
 assert.match(check.stdout,/PASS: local stdio connection, 7 tools and 73 investigations/);assert.equal(check.stderr,'');
});
