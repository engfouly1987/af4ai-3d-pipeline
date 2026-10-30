import {chromium} from 'playwright-core';import http from 'http';import fs from 'fs';import path from 'path';
// node shots.mjs [shot names]  — run from the project folder (needs view.html + the model next to it; node_modules beside or above)
const ROOT=process.env.KIT_ROOT||process.cwd();const PROJ=process.env.PROJ||'';
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);let f=p.startsWith('/node_modules')?ROOT+p:ROOT+PROJ+p;
 try{const d=fs.readFileSync(f);const t=f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/octet-stream';s.writeHead(200,{'Content-Type':t});s.end(d)}catch{s.writeHead(404);s.end()}}).listen(8191);
export const SHOTS={
 'aerial': {w:1920,h:1080,q:'pos=0,250,-250&tgt=0,0,40&fov=42&sh=300&st=0,0,0&sun=-120,90,-60'},
 't1': {w:1920,h:1080,q:'pos=0,210,-290&tgt=0,0,20&fov=40&sh=300&st=0,0,0&sun=-120,90,-60'},
 't2': {w:1920,h:1080,q:'pos=0,175,-300&tgt=0,0,10&fov=44&sh=300&st=0,0,0&sun=-120,90,-60'},
 'threeq': {w:1920,h:1080,q:'pos=-260,95,-250&tgt=10,0,40&fov=40&sh=300&st=0,0,0&sun=-120,90,-60'},
 'villas': {w:1920,h:1080,q:'pos=-90,30,-40&tgt=-150,2,60&fov=50&sh=300&st=0,0,0&sun=-120,90,-60'},
 'lagoon': {w:1920,h:1080,q:'pos=0,22,-60&tgt=0,4,40&fov=55&sh=300&st=0,0,0&sun=-120,90,-60'},
 'club':   {w:1920,h:1080,q:'pos=-10,18,-150&tgt=-45,1,-100&fov=50&sh=300&st=0,0,0&sun=-120,90,-60'},
 'corner': {w:1080,h:1920,q:'pos=0,20,-62&tgt=0,3,30&fov=70&sh=300&st=0,0,0&sun=-120,90,-60'},
 'clay':   {w:1920,h:1080,q:'pos=260,160,-300&tgt=0,0,40&fov=40&sh=300&st=0,0,0&mode=clay'},
};
const only=process.argv.slice(2);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync(ROOT+PROJ+'/shots',{recursive:true});
for(const [n,s] of Object.entries(SHOTS)){if(only.length&&!only.includes(n))continue;
 const pg=await b.newPage({viewport:{width:s.w,height:s.h}});pg.on('console',m=>console.log('>',m.text()));pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('http://localhost:8191/view.html?glb=sharaa-desktop.glb&'+s.q);await pg.waitForFunction(()=>document.body.classList.contains('done'),null,{timeout:300000});
 await pg.screenshot({path:ROOT+PROJ+`/shots/${n}.png`,timeout:200000});await pg.close();console.log(n);}
await b.close();srv.close();
