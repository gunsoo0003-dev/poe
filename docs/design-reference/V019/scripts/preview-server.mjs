/**
 * Temporary local HTTP preview for YouTube embeds (prevents file:// referrer issue).
 * Node 20+. Runs on loopback only and never starts in production.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, sep } from 'node:path';
import { spawn } from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const server=createServer(async(req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.writeHead(405);res.end();return;
  }
  let name;
  try { name=decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch { res.writeHead(400);res.end();return; }
  const file=resolve(root,'.'+(name==='/'?'/index.html':name));
  if(file!==root&&!file.startsWith(root+sep)){
    res.writeHead(403);res.end();return;
  }
  try {
    const info=await stat(file);
    if(!info.isFile()) throw new Error('Not a file');
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','Referrer-Policy':'strict-origin-when-cross-origin'});
    if(req.method==='HEAD') res.end(); else res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.listen(0,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${server.address().port}/index.html`;
  process.stdout.write(`FIXLGS POE2 임시 미리보기: ${url}\n이 창을 닫으면 서버도 종료됩니다. 운영 서버는 실행되지 않습니다.\n`);
  if(process.platform==='win32'){
    try{spawn('cmd.exe',['/c','start','',url],{detached:true,stdio:'ignore',windowsHide:true}).unref();}
    catch{ /* Print URL above if browser cannot open automatically. */ }
  }
});
server.on('error',e=>{console.error('임시 미리보기 서버 오류:',e.message);process.exitCode=1;});
