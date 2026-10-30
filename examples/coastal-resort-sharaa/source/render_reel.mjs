// 3D segment of the Sharaa reel: 6.2 s at 24 fps, build p 0->1 while the camera settles on the Veo time-lapse framing.
import {chromium} from 'playwright-core';import http from 'http';import fs from 'fs';
const WORK=process.env.WORK||'./work';                // folder with node_modules/ and p09/site/ (video.html + model)
const CHROMIUM=process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium';
const W=1080,H=1920,FPS=24,DUR=6.2,N=Math.round(DUR*FPS);
const ABS={pos:[0,205,-335],tgt:[0,0,-5],fov:46};
const ss=t=>t*t*(3-2*t),cl=v=>Math.max(0,Math.min(1,v));
const K=[[0,{az:2.25,el:.9,d:1.9,h:.05}],[.45,{az:2.75,el:.62,d:1.55,h:.1}],[1,{az:3.1,el:.5,d:1.4,h:.12}]];
const camAt=u=>{let i=0;while(i<K.length-2&&u>K[i+1][0])i++;const [a,A]=K[i],[b,B]=K[i+1];const k=ss(cl((u-a)/(b-a)));const o={};for(const key in A)o[key]=A[key]+(B[key]-A[key])*k;return o};
const only=process.argv[2]?process.argv[2].split(',').map(Number):null;
const srv=http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);try{let d=fs.readFileSync(p.startsWith('/node_modules')?WORK+p:WORK+'/p09/site'+p);
 if(p.endsWith('video.html'))d='<script>window.__manual=true</script>'+d;s.writeHead(200,{'Content-Type':p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.js')?'text/javascript':'text/plain'});s.end(d)}catch{s.writeHead(404);s.end()}}).listen(8196);
const b=await chromium.launch({executablePath:CHROMIUM,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:W,height:H},colorScheme:'light'});pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('http://localhost:8196/video.html');await pg.waitForFunction(()=>window.__renderOnce,null,{timeout:600000});
await pg.evaluate(()=>{window.__snap=true;document.querySelectorAll('.ctl,.logo').forEach(e=>e.style.visibility='hidden');document.querySelector('#poster').style.display='none';const h=document.querySelector('#hint');if(h)h.style.display='none'});
fs.mkdirSync(WORK+'/p09/frames',{recursive:true});const t0=Date.now();let done=0;
for(let n=0;n<N;n++){if(only&&!only.includes(n))continue;const out=`${WORK}/p09/frames/${String(n).padStart(4,'0')}.jpg`;if(!only&&fs.existsSync(out))continue;
 const u=n/(N-1);const p=.06+.94*ss(cl(u/.85));const ka=ss(cl((u-.55)/.42));
 await pg.evaluate(([p,c,a])=>{window.__p=p;window.__cam=c;window.__abs=a;window.__renderOnce()},[p,camAt(u),ka>0?{...ABS,k:ka}:null]);
 await pg.screenshot({path:out,type:'jpeg',quality:93,timeout:300000});done++;}
console.log('rendered',done,((Date.now()-t0)/1000).toFixed(0)+'s');await b.close();srv.close();
