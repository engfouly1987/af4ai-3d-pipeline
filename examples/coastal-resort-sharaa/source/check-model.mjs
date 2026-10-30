// Geometry QA and still previews only. Does not create a website or render video.
import fs from 'node:fs';
import {NodeIO,getBounds} from '@gltf-transform/core';
import {chromium} from 'playwright-core';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),file=path.join(root,'output/sharaa-coastal-resort.glb');
const doc=await new NodeIO().read(file),nodes=doc.getRoot().listNodes(),report=JSON.parse(fs.readFileSync(path.join(root,'output/model-report.json'),'utf8'));
assert.equal(nodes.filter(n=>n.getExtras().usage==='hotel-room').length,220);
assert.equal(nodes.filter(n=>n.getExtras().usage==='villa').length,18);
assert.equal(nodes.filter(n=>n.getName()==='CENTRAL_LAGOON_POOL_AND_DECK').length,1);
for(const a of doc.getRoot().listAccessors())for(const v of a.getArray())assert.ok(Number.isFinite(v));
fs.mkdirSync(path.join(root,'qa'),{recursive:true});
const script=`import * as T from 'three';import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{RoomEnvironment}from'three/addons/environments/RoomEnvironment.js';
(async()=>{const r=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});r.setSize(1440,900);r.setPixelRatio(1);r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.8;const scene=new T.Scene();scene.background=new T.Color('#e9e7df');const pm=new T.PMREMGenerator(r),room=new RoomEnvironment();scene.environment=pm.fromScene(room,.04).texture;scene.environmentIntensity=.25;room.dispose();pm.dispose();scene.add(new T.HemisphereLight(0xe6eff1,0x88785f,.7));const sun=new T.DirectionalLight(0xffe4bf,2);sun.position.set(-150,220,150);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-300,right:300,top:300,bottom:-300,near:1,far:800});sun.shadow.bias=-.0005;sun.shadow.normalBias=.3;scene.add(sun);const fill=new T.DirectionalLight(0xd1e9ed,.4);fill.position.set(180,80,-180);scene.add(fill);const bytes=Uint8Array.from(atob(window.MODEL),c=>c.charCodeAt(0));const gltf=await new GLTFLoader().parseAsync(bytes.buffer,'');gltf.scene.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});scene.add(gltf.scene);let camera=new T.PerspectiveCamera(40,1440/900,.5,2000);const ortho=new T.OrthographicCamera(-320,320,200,-200,.1,1600);
window.preview=(mode)=>{gltf.scene.children.forEach(n=>{n.visible=true;});let c=camera;camera.up.set(0,1,0);if(mode==='overview'){camera.position.set(5,225,-385);camera.lookAt(0,0,12);}else if(mode==='masterplan'){c=ortho;ortho.up.set(0,0,-1);ortho.position.set(0,650,-20);ortho.lookAt(0,0,-20);}else if(mode==='hotel-detail'){camera.position.set(8,55,-35);camera.lookAt(-52,9,20);}else if(mode==='reception-detail'){camera.position.set(56,40,67);camera.lookAt(0,6,117);}else if(mode==='villa-detail'){camera.position.set(-123,30,-38);camera.lookAt(-146,3,0);}else if(mode==='club-detail'){camera.position.set(-15,42,-156);camera.lookAt(-45,3,-94);}r.render(scene,c);return{triangles:r.info.render.triangles,drawCalls:r.info.render.calls}};window.preview('overview');const gl=r.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');window.GPU=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);window.READY=true;})().catch(e=>{window.FAIL=String(e);console.error(e)});`;
const compiled=await build({stdin:{contents:script,resolveDir:root,loader:'js'},bundle:true,format:'iife',write:false,minify:true});
let browser;try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=d3d11']});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setContent('<html><body style="margin:0"><canvas></canvas></body></html>');await page.evaluate(b64=>window.MODEL=b64,fs.readFileSync(file).toString('base64'));await page.addScriptTag({content:compiled.outputFiles[0].text});await page.waitForFunction(()=>window.READY||window.FAIL,null,{timeout:60000});assert.equal(await page.evaluate(()=>window.FAIL),undefined);
 const views={};for(const mode of ['overview','masterplan','hotel-detail','villa-detail','club-detail','reception-detail']){views[mode]=await page.evaluate(mode=>window.preview(mode),mode);await page.screenshot({path:path.join(root,'qa',mode+'.png')});}
 const verification={geometryFinite:true,hotelRoomBays:220,villaBuildings:18,gpu:await page.evaluate(()=>window.GPU),errors,views,bounds:getBounds(doc.getRoot().getDefaultScene())};
 fs.writeFileSync(path.join(root,'qa/verification.json'),JSON.stringify(verification,null,2));console.log(JSON.stringify(verification,null,2));assert.equal(errors.length,0);
}finally{await browser?.close();}
