import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.env.PROBEKIT_PREVIEW_PORT??4794);
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
const policy="default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const server=createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);res.end();return;}
  if(!extname(file))file+='.html';
  if(!(await stat(file)).isFile())throw Error('Not found');
  const headers={'content-type':types[extname(file)]??'application/octet-stream','cache-control':'no-store','x-content-type-options':'nosniff'};
  if(['/investigations','/investigations.html','/field-access','/field-access.html'].includes(path))headers['content-security-policy']=policy;
  res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:await readFile(file));
 }catch{res.writeHead(404,{'content-type':'text/plain'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`ProbeKit preview: http://127.0.0.1:${port}/investigations.html (Ctrl+C to stop)`));
