import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Document,NodeIO} from '@gltf-transform/core';
import {dedup,prune} from '@gltf-transform/functions';

const root=path.dirname(fileURLToPath(import.meta.url)),out=path.join(root,'output');fs.mkdirSync(out,{recursive:true});
const C={name:'منتجع الشراع',frontage:450,visualDevelopmentDepth:190,sourceArea:250000,sourceDepth:550};
const palette={white:['#f1ebdc',.9,0,1],dome:['#ddd3bd',.87,0,1],accent:['#688c96',.85,0,1],stone:['#d4c4a4',.98,0,1],sand:['#e5d2a9',1,0,1],dune:['#d4bd8e',1,0,1],wood:['#9b7954',.9,0,1],dark:['#444d4b',.85,0,1],glass:['#547e8c',.25,.1,.78],pool:['#54b6c3',.24,.08,1],sea:['#20798c',.3,.15,1],shallow:['#67b8bb',.38,.08,1],foam:['#e3e6d7',.8,0,1],green:['#687e4e',1,0,1],olive:['#8b9566',1,0,1],trunk:['#8b704e',1,0,1],garden:['#b8ad88',1,0,1],road:['#8e9285',1,0,1],buggy:['#a4b9ad',1,0,1],solar:['#34566e',.4,.3,1],linen:['#f8efd9',1,0,1],blue:['#4d8197',.8,0,1]};
const defs={},nodes=[];let buckets;
function begin(){buckets=new Map();}
function add(g,m){g.deleteAttribute('uv');if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));if(!buckets.has(m))buckets.set(m,[]);buckets.get(m).push(g);}
function box(x,y,z,w,h,d,m,rot=0){if(Math.min(w,h,d)<=0)return;const g=new T.BoxGeometry(w,h,d,Math.min(60,Math.ceil(w/4)),1,Math.min(60,Math.ceil(d/4)));g.rotateY(rot);g.translate(x,y+h/2,z);add(g,m);}
function beam(a,b,w,d,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),g=new T.BoxGeometry(w,v.length(),d);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());add(g,m);}
function cyl(x,y,z,r,h,m,segments=8){const g=new T.CylinderGeometry(r*.9,r,h,segments);g.translate(x,y+h/2,z);add(g,m);}
function sphere(x,y,z,rx,ry,rz,m){const g=new T.SphereGeometry(1,7,4);g.scale(rx,ry,rz);g.translate(x,y,z);add(g,m);}
function rect(w,d,x=0,z=0){return [[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];}
function slab(w,d,y,t,m,holes=[],x=0,z=0){const shape=new T.Shape(rect(w,d,x,z).map(([x,z])=>new T.Vector2(x,-z)));for(const points of holes)shape.holes.push(new T.Path(points.map(([x,z])=>new T.Vector2(x,-z))));const g=new T.ExtrudeGeometry(shape,{depth:t,bevelEnabled:false,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,y,0);add(g,m);}
function finish(name){const primitives=[];for(const [m,gs]of buckets){const g=mergeGeometries(gs,false);primitives.push({material:m,position:Float32Array.from(g.attributes.position.array,v=>+v.toFixed(5)),normal:Float32Array.from(g.attributes.normal.array,v=>+v.toFixed(6)),index:g.index.array.slice()});gs.forEach(g=>g.dispose());g.dispose();}defs[name]=primitives;return name;}
function node(name,definition,p=[0,0,0],usage='retail',extra={}){nodes.push({name,definition,position:p,usage,...extra});}
function place(name,def,p,angle=0,usage='architecture',extra={}){node(name,def,p,usage,{rotation:[0,Math.sin(angle/2),0,Math.cos(angle/2)],...extra});}
function poly(points,y,t,m){const shape=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z)));const g=new T.ExtrudeGeometry(shape,{depth:t,bevelEnabled:false,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,y,0);add(g,m);}
function oval(cx,cz,rx,rz,n=48){return Array.from({length:n},(_,i)=>[cx+rx*Math.cos(i/n*Math.PI*2),cz+rz*Math.sin(i/n*Math.PI*2)]);}
function ribbon(points,width,y,m,closed=false){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,y,z)),closed,'centripetal');const count=Math.max(24,points.length*10),pos=[],ind=[];for(let i=0;i<=count;i++){const p=curve.getPoint(i/count),t=curve.getTangent(i/count),normal=new T.Vector3(-t.z,0,t.x).normalize();for(const side of [-1,1])pos.push(...p.clone().addScaledVector(normal,side*width/2).toArray());if(i<count){let j=i*2;ind.push(j,j+1,j+2,j+1,j+3,j+2);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();add(g,m);}
function dome(x,y,z,r,h){const g=new T.SphereGeometry(1,40,20,0,Math.PI*2,0,Math.PI/2);g.scale(r,h,r);g.translate(x,y,z);add(g,'dome');}
function arch(x,y,z,w,h,d,angle=0){const spring=h-w/2,shape=new T.Shape();shape.moveTo(-w/2,h);shape.lineTo(-w/2,spring);shape.absarc(0,spring,w/2,Math.PI,0,true);shape.lineTo(w/2,h);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:8});g.translate(0,0,-d/2);g.rotateY(angle);g.translate(x,y,z);add(g,'white');}
function pergola(x,z,w,d,y=3){for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])box(x+dx,.2,z+dz,.18,y-.2,.18,'wood');for(const dx of [-w/2,w/2])box(x+dx,y,z,.2,.18,d+.6,'wood');for(let zz=-d/2;zz<=d/2;zz+=.65)box(x,y+.2,z+zz,w+.7,.1,.13,'wood');}
function lowwall(x,z,w,d){box(x,.18,z,w,.85,d,'white');}
function planter(x,z,r=1.3){cyl(x,.12,z,r,.5,'stone',10);sphere(x,1,z,r,.7,r,'green');}
// Prototypes use shared meshes, no external images or imported vegetation.
begin();cyl(0,0,0,.23,6.8,'trunk');for(let i=0;i<8;i++){const a=i*Math.PI/4;beam([0,6.7,0],[2.8*Math.cos(a),6.3,2.8*Math.sin(a)],.2,.27,'green');sphere(1.7*Math.cos(a),6.7,1.7*Math.sin(a),1,.14,.6,'green');}finish('Palm');
begin();cyl(0,0,0,.25,2.7,'trunk');sphere(0,3.2,0,2,1.8,1.9,'olive');sphere(-.8,3,.8,1.4,1.4,1.5,'green');finish('Olive');
begin();box(0,.3,0,.85,.15,2.1,'linen');box(0,.45,-.7,.85,.45,.1,'wood');for(const x of [-.3,.3])box(x,.05,0,.07,.25,1.7,'wood');finish('Lounger');
begin();cyl(0,0,0,.05,2.5,'wood');const ug=new T.ConeGeometry(1.7,.5,10);ug.translate(0,2.5,0);add(ug,'linen');finish('Umbrella');
begin();box(0,.1,0,1.3,.6,2,'white');box(0,1.8,0,1.6,.1,2.3,'linen');for(const x of [-.6,.6])for(const z of [-.7,.7])box(x,.7,z,.06,1.1,.06,'wood');for(const x of [-.7,.7])for(const z of [-.6,.6])cyl(x,.02,z,.19,.3,'dark');finish('Buggy');
// Terrain dimensions follow the supplied masterplan proportions, not a cadastral survey.
const shore=Array.from({length:45},(_,i)=>{const x=-260+i*520/44;return[x,-135+2.4*Math.sin(x*.03)+1.3*Math.sin(x*.087)];});
const boundary=[[-225,-33],[225,-33],[214,160],[-190,160]];
begin();poly([[-260,180],[260,180],...shore.slice().reverse()],-.18,.08,'sand');poly(boundary,-.05,.1,'garden');box(0,-.25,175,500,.18,12,'road');for(let x=-240;x<240;x+=12)box(x,-.05,175,5,.015,.16,'linen');finish('Terrain');node('SITE_AND_COASTAL_ROAD','Terrain',[0,0,0],'site');

begin();poly([[-260,-285],[260,-285],...shore.slice().reverse()],-.28,.05,'sea');poly([...shore,...shore.slice().reverse().map(([x,z])=>[x,z-16])],-.23,.05,'shallow');ribbon(shore,1.1,-.14,'foam');ribbon(shore.map(([x,z])=>[x,z-12]),.35,-.15,'foam');finish('Mediterranean');node('MEDITERRANEAN_AND_SHALLOW_WATER','Mediterranean',[0,0,0],'sea');
begin();for(let i=0;i<65;i++){const x=-220+(i*37%440),z=-70+(i*13%30);sphere(x,-.3,z,5+(i%4),1.1+(i%3)*.4,3.5,'dune');}for(let i=0;i<180;i++){const x=-220+(i*47%440),z=-76+(i*17%39);if(Math.abs(x+40)<46&&z<-70)continue;sphere(x,.15,z,.5+(i%3)*.3,.25,.6,'olive');}finish('Dunes');node('DUNE_BELT_NATIVE_PLANTING','Dunes',[0,0,0],'landscape');
// Continuous buggy loop and internal green guest walks echo the drawing.
begin();ribbon([[-211,-21],[-130,-21],[-84,-21],[-80,10],[-80,140],[-100,150],[-175,147],[-194,115],[-207,40]],4.3,.12,'buggy',true);
ribbon([[84,-21],[150,-21],[215,-21],[215,50],[210,145],[180,150],[83,148],[80,90],[80,0]],4.3,.12,'buggy',true);
ribbon([[-80,-21],[0,-22],[80,-21]],4.3,.12,'buggy');
ribbon([[-80,151],[0,154],[80,151]],4,.13,'buggy');ribbon([[0,154],[0,175]],6,.14,'stone');
ribbon([[-217,-20],[-165,-18],[-90,-17],[-10,-14],[65,-18],[144,-20],[214,-21]],2.2,.15,'stone');
for(const x of [-199,-158,-117,113,155,196])ribbon([[x,142],[x+3,98],[x-3,52],[x,0]],2,.14,'stone');
for(const z of [26,70,112]){ribbon([[-207,z],[-169,z+4],[-130,z-2],[-86,z]],2,.14,'stone');ribbon([[87,z],[125,z+4],[165,z-2],[210,z]],2,.14,'stone');}
finish('Routes');node('BUGGY_AND_GUEST_ROUTES','Routes',[0,0,0],'routes');
begin();for(const x of [-150,-95,-35,5,91,154]){const d=55+(Math.abs(x)%17);box(x,.22,-55-d/2+24,2.5,.16,d,'wood');for(let z=-32;z>-32-d;z-=4)for(const dx of [-1.1,1.1])box(x+dx,0,z,.12,.3,.12,'wood');}finish('Boardwalks');node('BEACH_BOARDWALKS','Boardwalks',[0,0,0],'boardwalk');
// Organic lagoon pool, four planted bays, pale coping and sun terraces.
const lagoon=[[-18,-13],[-10,-17],[8,-17],[20,-11],[22,0],[18,4],[18,18],[23,23],[22,48],[15,54],[-13,54],[-22,48],[-23,24],[-18,19],[-18,5],[-23,0],[-22,-9]];
const lc=new T.CatmullRomCurve3(lagoon.map(([x,z])=>new T.Vector3(x,0,z)),true,'centripetal');const lp=lc.getPoints(100).map(v=>[v.x,v.z]);
begin();box(0,.12,19,90,.1,93,'stone');poly(lp,.24,.08,'pool');ribbon(lp,.8,.34,'white',true);for(const x of [-19,19])for(const z of [4,33]){cyl(x,.35,z,2.3,.4,'stone',16);sphere(x,.9,z,1.8,.7,1.7,'green');}finish('Lagoon');node('CENTRAL_LAGOON_POOL_AND_DECK','Lagoon',[0,0,0],'pool');
for(const x of [-32,32])for(let z=-8;z<=50;z+=7){place('POOL_LOUNGER','Lounger',[x,.24,z],x<0?-Math.PI/2:Math.PI/2,'furniture');if(z%14===-8||z===6||z===34)node('POOL_UMBRELLA','Umbrella',[x+(x<0?-3:3),.24,z],'furniture');}
for(const x of [-26,26])for(const z of [-11,10,35,57])node('POOL_PALM','Palm',[x,.26,z],'landscape');
// Hotel room bay: shaded arched loggia, actual opening, bed and an interior partition.
begin();box(0,0,0,7.45,.16,9.5,'stone');for(const x of [-3.65,3.65])box(x,.16,0,.15,3.25,9.5,'white');box(0,.16,4.7,7.4,3.25,.12,'white');box(0,.16,-4.6,6.8,.6,.12,'white');box(0,.8,-4.65,6.8,2.3,.07,'glass');box(0,3.1,-4.65,7.4,.35,.2,'white');
box(0,.12,-5.7,7.45,.12,2.3,'stone');for(const x of [-3.65,0,3.65])box(x,.24,-6.8,.24,2.9,.24,'white');for(const x of [-1.825,1.825])arch(x,.24,-6.8,3.4,3.1,.25);for(let x=-3.3;x<3.4;x+=.6)box(x,.24,-6.85,.07,.85,.07,'wood');box(0,1.09,-6.85,7.3,.09,.1,'wood');box(0,3.38,-6.85,7.5,.15,.55,'white');box(0,.16,-6.85,7.5,.12,.4,'stone');for(const x of [-2.8,0,2.8]){box(x,.8,-4.76,.09,2.3,.15,'wood');}for(const x of [-3.2,3.2]){box(x,.75,-4.9,.42,2.2,.12,'wood');for(let y=1;y<2.8;y+=.2)box(x,y,-4.99,.44,.04,.05,'stone');}box(0,.23,-4.9,6.8,.12,.22,'accent');
box(0,.16,0,1.9,.35,2.1,'wood');box(0,.51,0,1.8,.2,2,'linen');box(0,.71,.8,1.5,.1,.35,'linen');box(0,3.45,0,7.5,.15,9.5,'white');finish('HotelRoom');
defs.HotelRoomSetback=defs.HotelRoom.map(p=>{const position=p.position.slice(),normal=p.normal.slice();for(let i=2;i<position.length;i+=3){position[i]=position[i]*.76+1.5;normal[i]/=.76;const l=Math.hypot(normal[i-2],normal[i-1],normal[i])||1;normal[i-2]/=l;normal[i-1]/=l;normal[i]/=l;}return{...p,position,normal};});
const hotelRooms=[];for(const wing of [-1,1]){

 for(let level=0;level<3;level++)for(let b=0;b<12;b++)for(const side of [-1,1]){const x=wing*62+side*6.35,z=-8+b*7.5;place('HOTEL_'+(wing<0?'WEST':'EAST')+'_ROOM_'+level+'_'+b+'_'+side,level===2&&[2,3,6,7,10].includes(b)?'HotelRoomSetback':'HotelRoom',[x,level*3.6+.4,z],side<0?Math.PI/2:-Math.PI/2,'hotel-room',{level});hotelRooms.push({block:wing<0?'west':'east',level,x,z});}
 begin();for(let level=0;level<3;level++)box(wing*62,level*3.6+.4,-8+41.25,3.2,.14,90,'stone');box(wing*62,11.2,33.25,3.2,.18,90,'white');for(const z of [-11.8,78.3])box(wing*62,11.38,z,24,.65,.16,'white');box(wing*62,.4,80,6,10.8,4,'white');finish('HotelWing'+wing);node('HOTEL_WING_'+wing+'_CIRCULATION_ROOF','HotelWing'+wing,[0,0,0],'hotel-shell');
}
// Third hotel block forms the domed reception/bazaar backdrop.
for(let level=0;level<3;level++)for(let b=0;b<13;b++)for(const side of [-1,1]){if(level===0&&b===6)continue;const x=-45+b*7.5,z=140+side*6.35;place('HOTEL_REAR_ROOM_'+level+'_'+b+'_'+side,'HotelRoom',[x,level*3.6+.4,z],side>0?Math.PI:0,'hotel-room',{level});hotelRooms.push({block:'rear',level,x,z});}
begin();for(let level=0;level<3;level++)box(0,level*3.6+.4,140,97.5,.14,3.2,'stone');box(0,11.2,140,99,.18,24,'white');for(const z of [128,152])box(0,11.38,z,99,.55,.2,'white');finish('RearHotel');node('THIRD_HOTEL_RECEPTION_BACKDROP','RearHotel',[0,0,0],'hotel-shell');
// Plaza with low bazaar arcades, restaurants and a water feature.
begin();box(0,.15,105,96,.12,57,'stone');box(0,.28,104,4,.45,4,'white');box(0,.73,104,3.5,.06,3.5,'pool');for(const side of [-1,1])for(let b=0;b<4;b++){const x=side*43,z=88+b*10.5;box(x,.28,z,13,4.1,9.5,'white');box(x,.28,z,13,.12,12,'stone');pergola(x-side*9,z,5,9.5,3.5);{cyl(x,4.38,z,3.6,.5,'white',32);dome(x,4.88,z,3.6,3.1);};}
for(const x of [-32,32]){box(x,.28,74,25,4.1,12,'white');for(let xx=-10;xx<=10;xx+=5){box(x+xx,.3,67.8,.2,3.2,.3,'white');arch(x+xx+2.5,.3,67.8,4.6,3.5,.3);}}
finish('Plaza');node('RECEPTION_PLAZA_BAZAAR_RESTAURANTS','Plaza',[0,0,0],'plaza');
begin();cyl(0,0,0,.5,.75,'wood',12);for(const x of [-1.1,1.1]){box(x,.4,0,.5,.1,.5,'linen');box(x,.5,-.2,.5,.6,.07,'wood');}finish('CafeTable');for(const x of [-25,-16,16,25])for(const z of [88,100,112]){node('PLAZA_CAFE_TABLE','CafeTable',[x,.3,z],'furniture');if(z===100)node('PLAZA_PARASOL','Umbrella',[x,.3,z],'furniture');}
// Two-storey villas with stepped roof terraces and open, shaded loggias.
function detailedWindow(x,y,z,w=2.5,h=2.1,arched=false){
 box(x,y,z,w,h,.09,'glass');for(const dx of [-w/2,w/2]){box(x+dx,y-.08,z-.08,.13,h+.2,.2,'white');box(x+dx+.22,y,z-.1,.3,h,.16,'wood');for(let yy=.12;yy<h;yy+=.2)box(x+dx+.22,y+yy,z-.2,.31,.045,.08,'stone');}
 box(x,y-.12,z-.1,w+.5,.12,.32,'stone');box(x,y+h,z-.1,w+.5,.14,.3,'white');box(x,y,z-.08,.08,h,.1,'wood');if(arched)arch(x,y,z-.12,w,h,.2);
}
function raisedPergola(x,z,w,d,base,top){for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])box(x+dx,base,z+dz,.15,top-base,.15,'wood');for(const dx of [-w/2,w/2])box(x+dx,top,z,.18,.18,d+.6,'wood');for(let zz=-d/2;zz<=d/2;zz+=.45)box(x,top+.18,z+zz,w+.6,.09,.1,'wood');}
function terraceRail(x,y,z,w){box(x,y,z,w,.55,.13,'white');box(x,y+.55,z,w,.08,.2,'wood');}
for(const type of ['VillaA','VillaB']){
 begin();const b=type==='VillaB';
 box(0,.18,0,25,.2,20,'stone');box(-2,.38,-1,20,3.25,15,'white');box(8,.38,3,5,3.25,9,'white');
 box(-2,3.63,-1,20,.2,15,'white');box(8,3.63,3,5,.2,9,'white');
 // Upper floor retreats to create a broad front terrace.
 box(b?2:-2,3.83,-2,b?15:18,3.15,10,'white');box(b?2:-2,6.98,-2,b?15:18,.2,10,'white');
 for(const y of [.95,4.35])for(const x of [-7,-1,5])detailedWindow(x,y,y<2?-8.58:-7.08,2.65,2.1,y<2&&x===-1);
 // Side return glazing and balcony on the garden elevation.
 for(const y of [.95,4.35])for(const z of [-4,1]){box(-12.05,y,z,.09,2.1,2.3,'glass');box(-12.15,y-.1,z,.3,.12,2.6,'stone');}
 for(const x of [-11,-5,1,8,11]){box(x,.38,8.5,.32,3.25,.32,'white');box(x,.38,8.5,.55,.18,.55,'stone');}
 for(const x of [-8,-2,4]){box(x,.8,6.6,4.9,2.6,.09,'glass');arch(x,.5,8.5,5.3,3.1,.25);}
 box(0,3.63,8,24,.2,4,'white');terraceRail(0,3.83,10,24);raisedPergola(-3,8,17,4,3.83,6.7);
 terraceRail(-2,7.18,-7,18);for(const x of [-11,7])box(x,7.18,-2,.14,.55,10,'white');
 if(b){cyl(5,7.18,-2,2.7,.4,'white',32);dome(5,7.58,-2,2.7,2.05);}else{raisedPergola(-5,-1,7,6,7.18,9.3);}
 // Cornices, roof scuppers, front landing and minimal terrace furniture.
 for(const z of [-8.7,6.7]){box(-2,3.45,z,20,.18,.38,'stone');box(-2,.38,z,20,.18,.25,'stone');}
 for(const x of [-9,6])box(x,7.24,-7.25,.23,.17,.6,'white');
 box(4,.35,14,8,.18,6.7,'stone');box(4,.54,14,6.2,.08,5.6,'pool');
 for(const x of [-6,0]){box(x,3.83,7.8,1.7,.43,.65,'linen');box(x,4.26,8.1,1.7,.38,.1,'wood');}
 box(-7,.38,11,2,.5,.6,'wood');lowwall(-13.5,1,.15,23);lowwall(13.5,-2,.15,17);
 finish(type);
}

const villas=[];for(const x of [-185,-145,-105])for(const z of [0,42,84,126]){if(x===-105&&z===126)continue;villas.push([x,z]);}for(const x of [112,155,197])for(const z of [0,45,90]){if(x===155&&z>0)continue;villas.push([x,z]);}
for(let i=0;i<villas.length;i++){const [x,z]=villas[i];place('VILLA_'+String(i+1).padStart(2,'0'),i%3===0?'VillaB':'VillaA',[x,.1,z],0,'villa');for(const dx of [-12,13])node('VILLA_OLIVE','Olive',[x+dx,.1,z+10],'landscape');}
// Gardens contain native planting and sandy gravel rather than lawn.
begin();for(const [x,z]of villas){poly(oval(x,z+1,17,18,20),.1,.02,'sand');ribbon(oval(x,z+1,17,18,18),1.3,.14,'stone',true);}finish('VillaLandscape');node('VILLA_CLUSTER_COURTYARDS','VillaLandscape',[0,0,0],'garden');
begin();box(155,.2,44,27,.2,25,'stone');for(const x of [146,164]){box(x,.4,42,8,3.6,17,'white');{cyl(x,4,41,3.5,.5,'white',32);dome(x,4.5,41,3.5,3.2);};}pergola(155,43,8,18,3.3);poly(oval(155,88,20,21),.14,.05,'sand');ribbon(oval(155,88,17,18,30),1.8,.24,'stone',true);box(155,.22,88,4,.12,12,'pool');for(const z of [77,99])planter(155,z,2.1);finish('Spa');node('EAST_SPA_AND_QUIET_GARDEN','Spa',[0,0,0],'spa');for(const x of [141,168])for(const z of [76,98])node('SPA_OLIVE','Olive',[x,0,z],'landscape');
// Rear east utilities as shown in the masterplan, with separate service access.
begin();box(155,.1,136,123,.15,33,'stone');box(155,.3,119.5,123,1.4,.2,'white');box(155,.3,152.5,123,1.4,.2,'white');ribbon([[218,172],[218,136],[208,136],[108,136]],5,.35,'road');
for(const [x,w,d]of [[142,21,17],[169,21,17],[194,16,17]]){box(x,.3,138,w,3.5,d,'white');box(x,3.8,138,w,.2,d,'stone');}for(const x of [136,146,166,175])cyl(x,4,138,2,2,'white',16);for(let col=0;col<4;col++)for(let row=0;row<4;row++){const x=101+col*6.5,z=125+row*6.5;box(x,.7,z,5.8,.12,5.5,'solar');for(let dz=-2;dz<=2;dz+=1.3)box(x,.83,z+dz,5.8,.02,.035,'linen');}finish('Utilities');node('REAR_EAST_SOLAR_DESALINATION_WASTEWATER','Utilities',[0,0,0],'utilities');
// Curved beach club and seawater pool, modelled as an indicative beachfront facility.
const clubX=-45,clubZ=-100;
begin();poly(oval(clubX,clubZ,42,23),.18,.14,'wood');const kidney=new T.CatmullRomCurve3([[-23,-4],[-15,-12],[3,-12],[22,-7],[23,1],[12,4],[0,1],[-10,6],[-22,4]].map(([x,z])=>new T.Vector3(clubX+x,0,clubZ-8+z)),true,'centripetal').getPoints(80).map(p=>[p.x,p.z]);poly(kidney,.34,.08,'pool');ribbon(kidney,.8,.44,'white',true);
finish('BeachClub');node('CURVED_BEACH_CLUB_AND_SEAWATER_POOL','BeachClub',[0,0,0],'beach-club');
for(const x of [-82,-12])node('CLUB_PALM','Palm',[x,.2,-94],'landscape');
for(let i=0;i<36;i++){const x=-200+i*11.5,z=-115+(i%2)*7;if(Math.abs(x+45)<44)continue;node('BEACH_UMBRELLA','Umbrella',[x,0,z],'furniture');place('BEACH_LOUNGER','Lounger',[x-2,0,z],0,'furniture');place('BEACH_LOUNGER','Lounger',[x+2,0,z],0,'furniture');}
// Boundary hedges, palms and low plantings are deterministic and light.
begin();for(const [x,z]of boundary){sphere(x,1,z,1.5,1.5,1.5,'green');}ribbon([[-223,-30],[-215,20],[-200,95],[-187,158],[-8,159]],1.6,.5,'green');ribbon([[8,159],[212,159],[220,80],[224,-30]],1.6,.5,'green');for(let i=0;i<100;i++){const x=-205+(i*41%410),z=-14+(i*29%156);if(Math.abs(x)<89||x>95&&z>113)continue;sphere(x,.3,z,1.1,.6,1.1,'olive');}finish('NativeBorders');node('NATIVE_BORDERS_AND_LOW_SHRUBS','NativeBorders',[0,0,0],'landscape');
for(let i=0;i<45;i++){const x=-205+i*9.3;node('BOUNDARY_OLIVE','Olive',[x,0,158],'landscape');}
for(const x of [-88,88])for(let z=-15;z<=120;z+=22)node('PROMENADE_PALM','Palm',[x,0,z],'landscape');
for(const [x,z]of [[-80,87],[80,55],[0,153]])place('ELECTRIC_BUGGY','Buggy',[x,.2,z],0,'context');

// Extra native trees frame clusters while keeping buildings and service areas clear.
for(const x of [-213,-166,-125,-87,90,132,178,215])for(let z=-15;z<145;z+=18){if(x>95&&z>115)continue;if(villas.some(([vx,vz])=>Math.abs(x-vx)<14&&Math.abs(z-vz)<19))continue;if(Math.abs(x-155)<25&&z>20&&z<110)continue;node('CLUSTER_NATIVE_TREE','Olive',[x,.1,z],'landscape');}
for(let x=-205;x<=205;x+=24)node('FRONT_PALM','Palm',[x,.1,-25],'landscape');

// Curved building geometry, including rooms, arcades and roof slabs.
// The inverse-transpose normal transform keeps the curvature correctly lit.
const bendCache=new Map();
function bendParts(parts,n,block){
 const q=new T.Quaternion(...(n.rotation??[0,0,0,1])),inv=q.clone().invert(),offset=new T.Vector3(...n.position);
 return parts.map(part=>{const position=new Float32Array(part.position.length),normal=new Float32Array(part.normal.length);
  for(let i=0;i<position.length;i+=3){const p=new T.Vector3(...part.position.slice(i,i+3)).applyQuaternion(q).add(offset),v=new T.Vector3(...part.normal.slice(i,i+3)).applyQuaternion(q);
   if(block==='rear'){const derivative=12*p.x/(52*52);p.z-=6*(1-(p.x/52)**2);v.x-=derivative*v.z;}
   else{const wing=block==='west'?-1:1,t=(p.z+11.75)/90,derivative=-wing*7.5*Math.PI/90*Math.cos(Math.PI*t);p.x-=wing*7.5*Math.sin(Math.PI*t);v.z-=derivative*v.x;}
   p.sub(offset).applyQuaternion(inv);v.normalize().applyQuaternion(inv);position.set(p.toArray(),i);normal.set(v.toArray(),i);
  }return{...part,position,normal};});
}
for(const n of nodes){let block=null;if(n.usage==='hotel-room')block=n.name.includes('WEST')?'west':n.name.includes('EAST')?'east':'rear';if(n.definition==='HotelWing-1')block='west';if(n.definition==='HotelWing1')block='east';if(n.definition==='RearHotel')block='rear';if(!block)continue;
 const key=n.definition+'_'+n.position[0]+'_'+n.position[2]+'_'+(n.rotation??[]).join('_');
 if(!bendCache.has(key)){const name='CURVED_'+bendCache.size;defs[name]=bendParts(defs[n.definition],n,block);bendCache.set(key,name);}n.definition=bendCache.get(key);
}
for(const r of hotelRooms){if(r.block==='rear')r.z-=6*(1-(r.x/52)**2);else r.x-=(r.block==='west'?-1:1)*7.5*Math.sin(Math.PI*(r.z+11.75)/90);}
// Reference-specific features: broadened hotel end pavilions and rooftop terraces.
begin();for(const side of [-1,1]){
 const cx=side*62;
 for(let level=0;level<3;level++){
  const y=.4+level*3.6;box(cx,y,-15,32,.16,12,'stone');
  for(const x of [-14.5,-8.7,-2.9,2.9,8.7,14.5]){box(cx+x,y,-21,.3,3.4,.4,'white');}
  for(const x of [-11.6,-5.8,0,5.8,11.6]){detailedWindow(cx+x,y+.5,-20.7,4.55,2.6,true);arch(cx+x,y+.16,-21,5.3,3.15,.35);}
  box(cx,y+3.34,-21,32,.18,.5,'white');box(cx,y,-21,32,.15,.5,'stone');
  for(const dx of [-16,16]){box(cx+dx,y,-15,.18,3.35,12,'white');for(const z of [-18,-13])box(cx+dx*1.007,y+.7,z,.1,2.1,2.6,'glass');}
 }
 box(cx,11.2,-15,32,.2,12,'white');terraceRail(cx,11.4,-21,32);raisedPergola(cx,-17,29,6,11.4,13.8);
 // Staggered shade structures along the wing roof, instead of repeated large domes.
 for(const [i,z]of [5,24,43,62].entries()){
  const axis=cx-side*7.5*Math.sin(Math.PI*(z+11.75)/90);raisedPergola(axis-side*5,z,7,6,11.25,13.35);
  if(i%2===0){box(axis+side*5,11.25,z,5,.5,4,'white');box(axis+side*5,11.75,z,4.6,.15,3.6,'stone');}
 }
}
finish('HotelEndPavilions');node('HOTEL_BROAD_ENDS_AND_SHADED_ROOF_TERRACES','HotelEndPavilions',[0,0,0],'architecture-detail');
// Barrel vault: true curved roof with a solid arched gable at either end.
function barrelVault(x,y,z,w,d,rise){
 const pos=[],ind=[],n=30;for(let j=0;j<=n;j++){const a=j/n*Math.PI;for(const zz of [-d/2,d/2])pos.push(x-w/2*Math.cos(a),y+rise*Math.sin(a),z+zz);if(j<n){let k=j*2;ind.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();add(g,'white');
 for(const zz of [-d/2,d/2]){const p=[x,y,z+zz],a=[];for(let j=0;j<=n;j++){const t=j/n*Math.PI;a.push(x-w/2*Math.cos(t),y+rise*Math.sin(t),z+zz);}const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute([...p,...a],3));const ii=[];for(let j=1;j<=n;j++)ii.push(...(zz<0?[0,j,j+1]:[0,j+1,j]));gg.setIndex(ii);gg.computeVertexNormals();add(gg,'white');}
}
begin();for(const side of [-1,1])for(let row=0;row<3;row++){
 const x=side*(22+row%2*11),z=84+row*14,h=row===2?7.6:5.2;
 box(x,.3,z,9,h,12,'white');barrelVault(x,h+.3,z,9,12,3);
 for(const dx of [-2.2,2.2]){detailedWindow(x+dx,1,z-6.1,1.9,2.3,true);if(h>6)detailedWindow(x+dx,4.5,z-6.1,1.8,2,true);}
 box(x,h+1,z-6.08,1,1.15,.08,'glass');raisedPergola(x-side*8,z,5,9,.3,3.5);
}
// The backdrop becomes a varied roofscape of shallow vaults and a central gateway dome.
for(const x of [-38,-24,-10,10,24,38]){
 const z=140-6*(1-(x/52)**2);box(x,11.25,z,9,.5,13,'white');barrelVault(x,11.75,z,9,13,3.1);box(x,12.2,z-6.6,1.2,1.2,.08,'glass');
}
box(0,.3,123,13,8.3,12,'white');for(const x of [-4,0,4]){detailedWindow(x,1,116.85,2.7,4,true);arch(x,1,116.7,2.9,4,.2);}cyl(0,8.6,123,3.6,.35,'white',32);dome(0,8.95,123,3.6,2.7);
finish('VaultedVillage');node('RECEPTION_VILLAGE_BARREL_VAULTS_AND_GATEWAY','VaultedVillage',[0,0,0],'architecture-detail');
// Three staggered beach pavilions around a gently curved deck, as in the image sequence.
begin();box(0,.4,0,21,.18,10,'stone');for(const x of [-10.4,10.4])box(x,.58,0,.2,3.8,10,'white');box(0,.58,4.9,21,3.8,.2,'white');box(0,.58,-4.8,20,3,.1,'glass');for(const x of [-10,-5,0,5,10])box(x,.58,-5,.24,3.8,.24,'white');box(0,4.38,0,22,.25,11,'white');terraceRail(0,4.63,-5.5,22);raisedPergola(0,-8,21,6,.58,3.65);for(const x of [-7,0,7])box(x,.58,-7,3.5,.85,1.1,'wood');finish('BeachPavilion');
for(const [i,dx,angle]of [[0,-27,-.3],[1,0,0],[2,27,.3]])place('BEACH_RESTAURANT_PAVILION_'+i,'BeachPavilion',[clubX+dx,.1,clubZ+17-(Math.abs(dx)>0?2:0)],angle,'beach-club');
// Additional planted courts provide the enclosure visible in the completed reference.
begin();for(const [x,z]of villas){for(let i=0;i<10;i++){const a=i/10*Math.PI*2,px=x+17*Math.cos(a),pz=z+18*Math.sin(a);if(pz>151)continue;sphere(px,.45,pz,1.5,.9,1.5,'green');sphere(px+.8,.7,pz,1,.8,1,'olive');}}
finish('PlantedCourtyards');node('VILLA_COURT_PLANTING','PlantedCourtyards',[0,0,0],'landscape');

const report={version:3,curvedHotelBlocks:3,architecturalDetail:"Reference-sequence reconstruction: two-storey terraced villas, broad three-storey hotel ends, barrel-vaulted village, three staggered beach pavilions, shutters, arcades and pergolas",project:C.name,units:'metres',priority:'Visual arrangement of the attached PLAN-01 masterplan; architectural language of EXT-01.',sourceArea:250000,sourceDepth:550,visualDevelopedParcelArea:Math.abs(boundary.reduce((s,p,i)=>s+p[0]*boundary[(i+1)%boundary.length][1]-boundary[(i+1)%boundary.length][0]*p[1],0))/2,frontageApprox:450,hotelBlocks:3,hotelRoomBays:hotelRooms.length,hotelStoreys:3,villaBuildings:villas.length,privateVillaPools:villas.length,centralLagoonPools:1,beachClubPools:1,spaGardens:1,notes:['Conceptual model derived from two image references plus the supplied PDF/JSON, not a surveyed or approved site plan.','The wide proportions of PLAN-01 take priority. The developed parcel is approximately 450 x 190 m, not the 250000 m2 / 550 m depth in the written brief.','The model contains 220 furnished hotel room bays across three blocks, not a verified hotel key/area schedule or complete interior fit-out.','The image-like villa cluster contains 18 villa buildings with private pools; the written target of 150 chalet/villa units is not achieved.','Hotel room bays are schematic. Circulation cores, lifts, stairs, services, egress and accessible rooms require a coordinated plan.','The beachfront club follows the drawing but its location relative to the legal coastal setback is unresolved. No valid setback distance is known or claimed.','Dunes, shoreline, elevations and sea levels are illustrative. Flood, wave run-up, marine structures and coastal approvals have not been assessed.','Services are placed at the rear east as in the masterplan. The brief contains inconsistent north/south wording; no prevailing wind or utility capacities are established.','Guest paths, buggy loop and rear service lane are visually differentiated but not traffic-engineered.','All vegetation consists of lightweight shared mesh components; no external textures are needed.'],hotelRoomPositions:hotelRooms};
fs.writeFileSync(path.join(out,'model-report.json'),JSON.stringify(report,null,2));

const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene(C.name);doc.getRoot().setDefaultScene(scene);const mats={};
for(const [name,[hex,rough,metal,alpha]]of Object.entries(palette)){const color=new T.Color(hex),mat=doc.createMaterial(name).setBaseColorFactor([color.r,color.g,color.b,alpha]).setRoughnessFactor(rough).setMetallicFactor(metal);if(alpha<1)mat.setAlphaMode('BLEND').setDoubleSided(true);mats[name]=mat;}
const meshes={};for(const [name,parts]of Object.entries(defs)){const mesh=doc.createMesh(name);for(const p of parts){const acc=(type,array)=>doc.createAccessor().setBuffer(buffer).setType(type).setArray(array);const index=p.position.length/3>65535?new Uint32Array(p.index):new Uint16Array(p.index);mesh.addPrimitive(doc.createPrimitive().setMaterial(mats[p.material]).setAttribute('POSITION',acc('VEC3',p.position)).setAttribute('NORMAL',acc('VEC3',p.normal)).setIndices(acc('SCALAR',index)));}meshes[name]=mesh;}
for(const n of nodes)scene.addChild(doc.createNode(n.name).setMesh(meshes[n.definition]).setTranslation(n.position).setRotation(n.rotation??[0,0,0,1]).setExtras({usage:n.usage,level:n.level??null}));
doc.getRoot().setExtras({generator:'AF4AI Sharaa reference-based conceptual geometry',report});await doc.transform(dedup(),prune());await new NodeIO().write(path.join(out,'sharaa-coastal-resort.glb'),doc);

console.log(JSON.stringify({bytes:fs.statSync(path.join(out,"sharaa-coastal-resort.glb")).size,hotelRooms:hotelRooms.length,villas:villas.length,meshPrototypes:Object.keys(defs).length,nodes:nodes.length},null,2));