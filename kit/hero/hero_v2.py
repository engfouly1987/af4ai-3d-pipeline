"""Hero v2: lighter desktop rendering + clickable stage bar + exit button.
python3 hero_v2.py pXX   (reads pXX/site/index.v1.html, writes pXX/site/index.html)"""
import sys
p = sys.argv[1]
s = open(f'{p}/site/index.v1.html', encoding='utf-8').read()

def rep(a, b, n=1):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b, n)

# ---------- CSS: stage bar becomes clickable chips; exit button ----------
rep('''.phases{position:absolute;bottom:max(18px,env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);display:flex;gap:6px;pointer-events:none}
.phases i{display:block;width:26px;height:3px;border-radius:2px;background:var(--line);overflow:hidden;position:relative}''',
'''.phases{position:absolute;z-index:4;bottom:max(14px,env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);display:flex;gap:4px;padding:4px;border-radius:12px;background:var(--scrim);border:1px solid var(--line);backdrop-filter:blur(6px);max-width:calc(100% - 32px)}
.phases button{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;padding:7px 10px 6px;border:0;border-radius:9px;background:transparent;color:var(--muted);font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap}
.phases button:hover{color:var(--ink);background:color-mix(in srgb,var(--line) 45%,transparent)}
.phases button[aria-current="step"]{color:var(--ink);font-weight:600}
.phases button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.phases i{display:block;width:100%;min-width:26px;height:3px;border-radius:2px;background:var(--line);overflow:hidden;position:relative}''')
rep('.stage.exploring .caps,.stage.exploring .rule,.stage.exploring .phases,.stage.exploring .labels{display:none}',
    '.stage.exploring .caps,.stage.exploring .rule,.stage.exploring .labels{display:none}\n.ctl .exit{width:auto;padding:0 12px;gap:6px;display:flex;font:inherit;font-size:13.5px;font-weight:600}')
rep('''  .ctl .explore span{display:none}''', '''  .ctl .explore span{display:none}
  .phases{gap:2px;padding:3px}
  .phases button{padding:9px 6px 7px;font-size:0;gap:0}
  .phases i{min-width:22px}''')

# ---------- HTML ----------
labels = ['الموقع', 'الهيكل', 'الأدوار', 'الفتحات', 'التشطيب', 'الاكتمال']
rep('<div class="phases" id="phases" aria-hidden="true" hidden><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div>',
    '<nav class="phases" id="phases" dir="rtl" aria-label="مراحل البناء" hidden>' + ''.join(f'<button type="button" data-k="{i}" aria-label="{l}"><i><b></b></i>{l}</button>' for i, l in enumerate(labels)) + '</nav>')
rep('<div class="ctl" id="ctl" hidden>',
    '<div class="ctl" id="ctl" hidden>\n      <button type="button" class="exit" id="exit" title="إنهاء المعاينة"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg><span>إنهاء المعاينة</span></button>')

# ---------- stage navigation (works before 3D loads) ----------
rep("addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();",
"""addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();
/* stage bar: click a stage, arrows / horizontal swipe step through stages */
const phasesNav=$('#phases'),stageBtns=[...phasesNav.querySelectorAll('button')];
const stageP=k=>k>=5?1:WIN[k]+(WIN[k+1]-WIN[k])*.92;
function curStage(){const p=window.__p??P;let k=WIN.findIndex((w,i)=>p<WIN[i+1]);return k<0?5:k}
function goStage(k){k=clamp(k,0,5);const p=stageP(k);
  if(window.__exploring){window.__p=p;window.__kick&&window.__kick();markStage(k);return}
  const top=build.getBoundingClientRect().top+scrollY+p*(build.offsetHeight-innerHeight);scrollTo({top,behavior:reduce?'auto':'smooth'})}
function markStage(k){stageBtns.forEach((b,i)=>b.toggleAttribute('aria-current',i===k)&&b.setAttribute('aria-current','step'))}
stageBtns.forEach(b=>b.onclick=()=>goStage(+b.dataset.k));phasesNav.hidden=false;
addEventListener('scroll',()=>markStage(curStage()),{passive:true});markStage(curStage());
addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea,select'))return;
  if(e.key==='ArrowLeft'){e.preventDefault();goStage(curStage()+1)}else if(e.key==='ArrowRight'){e.preventDefault();goStage(curStage()-1)}});
let hx=0,hxT=0;$('#stage').addEventListener('wheel',e=>{if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||e.ctrlKey)return;e.preventDefault();
  const now=performance.now();if(now-hxT>400)hx=0;hxT=now;hx+=e.deltaX;if(Math.abs(hx)>90){goStage(curStage()+(hx<0?1:-1));hx=0;hxT=now+500}},{passive:false});
$('#exit').onclick=()=>{if(window.__exploring){window.__setExplore(false);return}
  let same=false;try{same=!!document.referrer&&new URL(document.referrer).origin===location.origin}catch(e){}
  if(same&&history.length>1)history.back();else location.href='/'};""")
rep('<div class="phases" ', '<div class="phases" ') if '<div class="phases" ' in s else None

# ---------- renderer: no forced discrete GPU, lower pixel ratio on desktop ----------
rep("const renderer=new THREE.WebGLRenderer({canvas,antialias:!small,alpha:true,powerPreference:'high-performance'});",
    "const renderer=new THREE.WebGLRenderer({canvas,antialias:!small&&devicePixelRatio<1.5,alpha:true,powerPreference:'default'});")
rep("renderer.setPixelRatio(Math.min(devicePixelRatio,small?1.5:1.75));", "renderer.setPixelRatio(Math.min(devicePixelRatio,small?1.5:1.25));")

# ---------- shared materials instead of one clone per mesh ----------
rep("const boxes={};const box=new THREE.Box3();", "const boxes={};const box=new THREE.Box3();const matCache=new Map();")
rep("""    o.material=o.material.clone();patch(o.material,PH[key]?key:'T');
    if(CFG.roofFix&&key==='R'&&/Color_000|\\|default$|\\|$/.test(name)){o.material.color.set(0x2c3149);o.material.roughness=.6}  /* SketchUp lost the slate color on the domes */
    o.frustumCulled=!o.isInstancedMesh;
    if(/Glass/.test(name)){o.material.transparent=true;o.material.opacity=.55;o.material.depthWrite=false}""",
"""    const mk2=o.material.uuid+'|'+key;let sm=matCache.get(mk2);
    if(!sm){sm=o.material.clone();patch(sm,PH[key]?key:'T');
      if(CFG.roofFix&&key==='R'&&/Color_000|\\|default$|\\|$/.test(name)){sm.color.set(0x2c3149);sm.roughness=.6}  /* SketchUp lost the slate color on the domes */
      if(/Glass/.test(name)){sm.transparent=true;sm.opacity=.55;sm.depthWrite=false}
      matCache.set(mk2,sm)}
    o.material=sm;o.frustumCulled=!o.isInstancedMesh;""")

# ---------- fewer draw calls: repeated meshes -> InstancedMesh, the rest merged per material ----------
rep("const hasL=!!boxes.L;", """const hasL=!!boxes.L;
  {const {mergeGeometries}=await import('three/addons/utils/BufferGeometryUtils.js');
   const out=new THREE.Group(),groups=new Map(),singles=new Map(),list=[];
   model.traverse(o=>{if(o.isMesh&&o.visible&&!o.isInstancedMesh&&!o.isSkinnedMesh)list.push(o)});
   for(const m of list){const neg=m.matrixWorld.determinant()<0;const k=m.geometry.uuid+'|'+m.material.uuid+(neg?'|n':'');(groups.get(k)||groups.set(k,[]).get(k)).push(m)}
   for(const [k,g] of groups){const m0=g[0];
     if(g.length>=3&&!k.endsWith('|n')){const im=new THREE.InstancedMesh(m0.geometry,m0.material,g.length);g.forEach((m,i)=>im.setMatrixAt(i,m.matrixWorld));im.frustumCulled=false;out.add(im)}
     else g.forEach(m=>{const key=m.material.map?m.uuid:m.material.uuid;(singles.get(key)||singles.set(key,[]).get(key)).push(m)})}
   const toWorld=(m)=>{const geo=m.geometry,pa=geo.attributes.position,na=geo.attributes.normal,n=pa.count;const P=new Float32Array(n*3),N=new Float32Array(n*3);
     for(let i=0;i<n;i++){P[i*3]=pa.getX(i);P[i*3+1]=pa.getY(i);P[i*3+2]=pa.getZ(i);if(na){N[i*3]=na.getX(i);N[i*3+1]=na.getY(i);N[i*3+2]=na.getZ(i)}}
     const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));
     const idx=geo.index?Uint32Array.from(geo.index.array):Uint32Array.from({length:n},(_,i)=>i);
     if(m.matrixWorld.determinant()<0)for(let i=0;i<idx.length;i+=3){const t=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=t}
     g.setIndex(new THREE.BufferAttribute(idx,1));g.applyMatrix4(m.matrixWorld);if(!na)g.computeVertexNormals();return g};
   for(const g of singles.values()){const mat=g[0].material;
     if(mat.map){g.forEach(m=>{const c=m.clone();m.matrixWorld.decompose(c.position,c.quaternion,c.scale);out.add(c)});continue}
     const geos=g.map(toWorld);const merged=geos.length>1?mergeGeometries(geos,false):geos[0];
     if(merged){if(geos.length>1)geos.forEach(x=>x.dispose());out.add(new THREE.Mesh(merged,mat))}
     else geos.forEach(x=>out.add(new THREE.Mesh(x,mat)))}
   const inst=[];model.traverse(o=>{if(o.isInstancedMesh&&o.visible)inst.push([o,o.matrixWorld.clone()])});
   inst.forEach(([o,mw])=>{out.add(o);mw.decompose(o.position,o.quaternion,o.scale)});
   scene.remove(model);scene.add(out);
   const keep=new Set();out.traverse(o=>o.geometry&&keep.add(o.geometry));list.forEach(m=>{if(!keep.has(m.geometry))m.geometry.dispose()});}""")

# ---------- render only when something changes ----------
rep("  let first=true;", "  let first=true;const kick=()=>{dirty=true};window.__kick=kick;")
rep("  const scene=new THREE.Scene();", "  let dirty=true;const scene=new THREE.Scene();")
rep("drag.moved=true;drag.x=e.clientX;", "drag.moved=true;dirty=true;drag.x=e.clientX;")
rep("function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;", "function resize(){dirty=true;const w=canvas.clientWidth,h=canvas.clientHeight;")
rep("function themeColors(){", "function themeColors(){dirty=true;")
# drop the mouse-follow tilt (it kept the GPU busy on every mouse move)
rep("addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();tilt.tx=((e.clientX-r.left)/r.width-.5);tilt.ty=((e.clientY-r.top)/r.height-.5);",
    "addEventListener('pointermove',e=>{")
rep("function setExplore(on){exploring=on;", "function setExplore(on){exploring=on;window.__exploring=on;dirty=true;")
rep("if(on){window.__p=1}else{delete window.__p;$('#reset').onclick()}resize()}",
    "if(on){window.__p=window.__p??Math.max(P,.999)}else{delete window.__p;$('#reset').onclick()}resize()}\n  window.__setExplore=setExplore;")
rep("""function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-lastT)/1000);lastT=now;if(!vis.on&&!first)return;
    const target=window.__p??P;""",
"""function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-lastT)/1000);lastT=now;if((!vis.on||document.hidden)&&!first)return;
    const target=window.__p??P;
    if(!first&&!dirty&&!drag.resetting&&Math.abs(target-cur.p)<1e-4&&Math.abs(zoom.t-zoom.k)<1e-4)return;dirty=false;""")
rep("ctl.hidden=false;hint.style.opacity=1;setTimeout(hideHint,6000)","ctl.hidden=false;hint.textContent=small?'اسحب للّف · قرّب بإصبعين · اختار مرحلة من تحت':'اسكرول أو اختار مرحلة من تحت · اسحب للّف · + و − للتقريب';hint.hidden=false;hint.style.opacity=1;setTimeout(hideHint,7000)")
# phase bar fill also follows explore jumps
rep("    apply(cur.p);", "    apply(cur.p);if(window.__exploring)ui(cur.p);")
open(f'{p}/site/index.html', 'w', encoding='utf-8').write(s)
print(p, 'ok', len(s))
