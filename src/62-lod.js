// ===== VEYRA – Stabilität Runde 4 (15.11., Opus 5.5 · hoch): Shader-Vorkompilierung hinter dem Ladebildschirm + leichte LOD-Netze zur Laufzeit =====
// Doku: docs/stabilitaet.md › Runde 4 · Tests: test/stabil_qa.mjs (R4-Fälle), Messung test/stabil4_mess.mjs
// 1) LOD zur Laufzeit (GLBs bleiben unverändert): beim Laden eines Figuren-/Terra-Modells wird das Körpernetz EINMAL im Hintergrund (Web Worker, Rückfall Leerlauf)
//    per Kantenkollaps (Quadrik-Fehler, nur Original-Ecken → Skinning/UV/Masken bleiben gültig, Nähte bleiben erhalten, wo möglich) vereinfacht und gecacht:
//    Figuren-Körper 11,7 k → 2,8 k Dreiecke, Terra Körper+Kopf ≈ 7 k → 2 k. Das leichte Netz ist zugleich
//    · LOD1 (ersetzt Koerper_LOD1 aus dem GLB, 5,8 k bzw. 3,6 k) – mit eigenem Umriss,
//    · Umrisshülle des Hauptnetzes (statt Kopie des vollen Körpers),
//    · Schattennetz (eigenes SkinnedMesh, zeichnet nur im Schattenpass; im Hauptpass Zeichenbereich 0 → kein Draw-Call).
//    Gesicht/Augen (Shape Keys) bleiben unverändert. Shape-Key-Updates (Mimik/Blinzeln) nur für Figuren/Terras bis 8 Felder, ferne bleiben eingefroren.
// 2) Vorkompilieren: nach dem Aufbau einer Szene und hinter dem Ladebildschirm (ldHold, Haken in 55) werden die Modelle des Ortes abgewartet (höchstens +1,5 s),
//    dann renderer.compile + ein Aufwärm-Bild in ein 4×4-Ziel mit ALLEM sichtbar und schattenwerfend (Programme, Schatten-Varianten, Texturen, Knochen-Texturen),
//    Terras des Gebiets, die noch nicht in der Szene stehen, als vorübergehende Exemplare.
// 3) Schatten an/aus ohne Neukompilieren: die Sonne wirft für den Renderer immer Schatten (gleicher Licht-Schlüssel ⇒ gleiche Programme);
//    „aus“ = Schattenkarte einmal geleert, nicht mehr aktualisiert, Empfänger je Bild ohne Schatten (Uniform, kein Programmwechsel).
// Figuren R5 (16.11.): Schutz-Markierung je Ecke (GLB-Attribut _LODW aus dem Blender-Bau: Haar 1, Schirm 1, Krone 0,8 …) → der Vereinfacher verteuert das Verschieben
//    geschützter Ecken (Faktor 1 + 12·w) und nimmt für solche Figuren 3,2 k statt 2,8 k; Modelle ohne _LODW wie bisher. ?lodschutz=0 schaltet den Schutz ab (Vergleich).
// API: LOD4 · PC4 · lodSimplify(P,I,ziel,o) · lodPrep(gltf) · lodApply(root) · pcWarm(grund) · ldHold(tok,tShow) · lodInfo()
const LOD4={on:true,T:{fig:2800,figS:3200,terra:2000},cache:new WeakMap(),pend:0,done:0,ms:[],w:null,jobs:new Map(),id:0,near:8,holdMax:1500,err:0,prot:true,wK:12};// prot/wK: Figuren R5 (Schutzgewicht _LODW)
const PC4={n:0,log:[],need:0,rt:null,off:false,clr:0,hold:[],tEnd:0,nach:[],wasLd:false};
try{if(/[?&]lod=0/.test(location.search))LOD4.on=false;if(/[?&]lodschutz=0/.test(location.search))LOD4.prot=false;}catch(e){}
// ---------- 1a) Vereinfachen: Halbkanten-Kollaps a→b (Quadrik-Fehler nach Garland/Heckbert), keine neuen Positionen ----------
// Rückgabe {idx, pv, av, tris}: idx über neue Ecken; pv[i] = Original-Ecke für Position/Normale/Skinning, av[i] = Original-Ecke für UV/Farbe/Masken.
// Ohne o.free bleiben Nähte (gleiche Position, andere UV) erhalten (Kollaps nur entlang der Naht); mit o.free darf eine Ecke über die Naht wandern und
// behält ihre eigenen UV/Farben (Textur dehnt sich etwas, statt fremde Farben zu ziehen). Muss eigenständig bleiben (läuft als Text im Worker).
// Figuren R5: o.w = Schutzgewicht je Ecke (0…1, GLB-Attribut _LODW: Haar/Schirm/Krone) → Kosten, eine geschützte Ecke zu verschieben, × (1 + o.wK·w);
// so behalten Strähnen ihre Spitzen und der Schirm bleibt flach und breit, die Reduktion tragen Körper/Kleidung. Ohne o.w unverändert.
function lodSimplify(P,I,target,o){
 o=o||{};const nV=(P.length/3)|0,nF=(I.length/3)|0,free=!!o.free;
 const pid=new Int32Array(nV),mp=new Map(),PX=[],rep=[];let np=0;const q=1e5;
 for(let v=0;v<nV;v++){const k=Math.round(P[v*3]*q)+','+Math.round(P[v*3+1]*q)+','+Math.round(P[v*3+2]*q);let id=mp.get(k);if(id===undefined){id=np++;mp.set(k,id);PX.push(P[v*3],P[v*3+1],P[v*3+2]);rep.push(v);}pid[v]=id;}
 const X=Float64Array.from(PX),F=Int32Array.from(I),FP=new Int32Array(nF*3),alive=new Uint8Array(nF),VF=new Array(np),dead=new Uint8Array(np),border=new Uint8Array(np),lock=new Uint8Array(np);
 for(let i=0;i<nF*3;i++)FP[i]=pid[F[i]];for(let i=0;i<np;i++)VF[i]=[];let live=0;
 const WP=o.w?new Float32Array(np):null,wK=o.wK!=null?o.wK:12;if(WP)for(let v=0;v<nV;v++){const x=o.w[v]||0;if(x>WP[pid[v]])WP[pid[v]]=x;}
 for(let f=0;f<nF;f++){const a=FP[f*3],b=FP[f*3+1],c=FP[f*3+2];if(a===b||b===c||a===c)continue;alive[f]=1;live++;VF[a].push(f);VF[b].push(f);VF[c].push(f);}
 const Q=new Float64Array(np*10);
 const addQ=(i,a,b,c,d,w)=>{const k=i*10;Q[k]+=w*a*a;Q[k+1]+=w*a*b;Q[k+2]+=w*a*c;Q[k+3]+=w*a*d;Q[k+4]+=w*b*b;Q[k+5]+=w*b*c;Q[k+6]+=w*b*d;Q[k+7]+=w*c*c;Q[k+8]+=w*c*d;Q[k+9]+=w*d*d;};
 const fn=new Float64Array(nF*3);let aSum=0;
 const fnorm=f=>{const A=FP[f*3]*3,B=FP[f*3+1]*3,C=FP[f*3+2]*3,ux=X[B]-X[A],uy=X[B+1]-X[A+1],uz=X[B+2]-X[A+2],vx=X[C]-X[A],vy=X[C+1]-X[A+1],vz=X[C+2]-X[A+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz);if(l>1e-14){fn[f*3]=nx/l;fn[f*3+1]=ny/l;fn[f*3+2]=nz/l;}return l;};
 for(let f=0;f<nF;f++){if(!alive[f])continue;const l=fnorm(f);if(l<1e-14)continue;const a=FP[f*3],nx=fn[f*3],ny=fn[f*3+1],nz=fn[f*3+2];
  const d=-(nx*X[a*3]+ny*X[a*3+1]+nz*X[a*3+2]),w=l*.5;aSum+=w;addQ(a,nx,ny,nz,d,w);addQ(FP[f*3+1],nx,ny,nz,d,w);addQ(FP[f*3+2],nx,ny,nz,d,w);}
 const aAvg=aSum/Math.max(1,live);
 const E=new Map(),ek=(a,b)=>a<b?a*np+b:b*np+a,wAt=(f,p)=>{for(let k=0;k<3;k++)if(FP[f*3+k]===p)return F[f*3+k];return-1;};
 for(let f=0;f<nF;f++){if(!alive[f])continue;for(let k=0;k<3;k++){const key=ek(FP[f*3+k],FP[f*3+(k+1)%3]);let L=E.get(key);if(!L)E.set(key,L=[]);L.push(f);}}
 const wB=o.wBorder!=null?o.wBorder:8,wS=o.wSeam!=null?o.wSeam:(free?.5:2);
 // Rand- und Nahtkanten: senkrechte Zusatzebenen, damit Rand/Naht ihre Form behalten
 const edgePlane=(a,b,f,w)=>{const ex=X[b*3]-X[a*3],ey=X[b*3+1]-X[a*3+1],ez=X[b*3+2]-X[a*3+2],nx0=fn[f*3],ny0=fn[f*3+1],nz0=fn[f*3+2];
  let px=ey*nz0-ez*ny0,py=ez*nx0-ex*nz0,pz=ex*ny0-ey*nx0;const l=Math.hypot(px,py,pz);if(l<1e-14)return;px/=l;py/=l;pz/=l;const d=-(px*X[a*3]+py*X[a*3+1]+pz*X[a*3+2]),ww=w*(ex*ex+ey*ey+ez*ez);
  addQ(a,px,py,pz,d,ww);addQ(b,px,py,pz,d,ww);};
 for(const[key,L]of E){const a=Math.floor(key/np),b=key%np;
  if(L.length===1){border[a]=border[b]=1;edgePlane(a,b,L[0],wB);}
  else if(L.length===2){if(wAt(L[0],a)!==wAt(L[1],a)||wAt(L[0],b)!==wAt(L[1],b)){edgePlane(a,b,L[0],wS);edgePlane(a,b,L[1],wS);}}
  else{lock[a]=lock[b]=1;}}
 const stamp=new Int32Array(np),HC=[],HA=[],HB=[],HS=[],HT=[];
 const qev=(a,b)=>{const i=a*10,j=b*10,x=X[b*3],y=X[b*3+1],z=X[b*3+2];
  return(Q[i]+Q[j])*x*x+2*(Q[i+1]+Q[j+1])*x*y+2*(Q[i+2]+Q[j+2])*x*z+2*(Q[i+3]+Q[j+3])*x+(Q[i+4]+Q[j+4])*y*y+2*(Q[i+5]+Q[j+5])*y*z+2*(Q[i+6]+Q[j+6])*y+(Q[i+7]+Q[j+7])*z*z+2*(Q[i+8]+Q[j+8])*z+Q[i+9]+Q[j+9];};
 const lenW=o.lenW!=null?o.lenW:.03;
 const hsw=(i,j)=>{let t=HC[i];HC[i]=HC[j];HC[j]=t;t=HA[i];HA[i]=HA[j];HA[j]=t;t=HB[i];HB[i]=HB[j];HB[j]=t;t=HS[i];HS[i]=HS[j];HS[j]=t;t=HT[i];HT[i]=HT[j];HT[j]=t;};
 const hpush=(a,b)=>{const dx=X[a*3]-X[b*3],dy=X[a*3+1]-X[b*3+1],dz=X[a*3+2]-X[b*3+2],c=(Math.max(0,qev(a,b))+lenW*aAvg*(dx*dx+dy*dy+dz*dz))*(WP?1+wK*WP[a]:1);
  let i=HC.length;HC.push(c);HA.push(a);HB.push(b);HS.push(stamp[a]);HT.push(stamp[b]);while(i>0){const p=(i-1)>>1;if(HC[p]<=HC[i])break;hsw(p,i);i=p;}};
 let ra=0,rb=0,rsa=0,rsb=0;
 const hpop=()=>{const n=HC.length-1;ra=HA[0];rb=HB[0];rsa=HS[0];rsb=HT[0];HC[0]=HC[n];HA[0]=HA[n];HB[0]=HB[n];HS[0]=HS[n];HT[0]=HT[n];HC.pop();HA.pop();HB.pop();HS.pop();HT.pop();
  let i=0;const m=HC.length;for(;;){const l=i*2+1,r=l+1;let s=i;if(l<m&&HC[l]<HC[s])s=l;if(r<m&&HC[r]<HC[s])s=r;if(s===i)break;hsw(s,i);i=s;}};
 for(const[key]of E){const a=Math.floor(key/np),b=key%np;hpush(a,b);hpush(b,a);}
 const mk=new Int32Array(np);let mkN=0;const NB=[];
 const nb=p=>{NB.length=0;mkN++;for(const f of VF[p])for(let k=0;k<3;k++){const x=FP[f*3+k];if(x!==p&&mk[x]!==mkN){mk[x]=mkN;NB.push(x);}}return NB;};
 const map=new Map(),minDot=o.minDot!=null?o.minDot:.25,sh=[];
 function collapse(a,b){
  if(lock[a])return false;const fa=VF[a];sh.length=0;for(const f of fa)if(FP[f*3]===b||FP[f*3+1]===b||FP[f*3+2]===b)sh.push(f);
  if(!sh.length)return false;if(border[a]&&sh.length!==1)return false;// Rand nur entlang des Randes
  nb(b);const mB=mkN;let common=0;for(const f of fa)for(let k=0;k<3;k++){const x=FP[f*3+k];if(x!==a&&mk[x]===mB){mk[x]=-1;common++;}}if(common!==sh.length)return false;// keine Nicht-Mannigfaltigkeit
  map.clear();let conflict=false;for(const f of sh){const wa=wAt(f,a),wb=wAt(f,b);if(map.has(wa)&&map.get(wa)!==wb)conflict=true;else map.set(wa,wb);}
  if(!free){if(conflict)return false;for(const f of fa)if(sh.indexOf(f)<0&&!map.has(wAt(f,a)))return false;}
  const bx=X[b*3],by=X[b*3+1],bz=X[b*3+2];
  for(const f of fa){if(sh.indexOf(f)>=0)continue;const p0=FP[f*3],p1=FP[f*3+1],p2=FP[f*3+2];// keine Umklappung, keine entarteten Dreiecke
   const x0=p0===a?bx:X[p0*3],y0=p0===a?by:X[p0*3+1],z0=p0===a?bz:X[p0*3+2],x1=p1===a?bx:X[p1*3],y1=p1===a?by:X[p1*3+1],z1=p1===a?bz:X[p1*3+2],x2=p2===a?bx:X[p2*3],y2=p2===a?by:X[p2*3+1],z2=p2===a?bz:X[p2*3+2];
   const ux=x1-x0,uy=y1-y0,uz=z1-z0,vx=x2-x0,vy=y2-y0,vz=z2-z0,nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz);
   if(l<1e-12)return false;if((nx*fn[f*3]+ny*fn[f*3+1]+nz*fn[f*3+2])/l<minDot)return false;}
  for(const f of fa){if(sh.indexOf(f)>=0)continue;for(let k=0;k<3;k++)if(FP[f*3+k]===a){FP[f*3+k]=b;const w=F[f*3+k];if(!conflict&&map.has(w))F[f*3+k]=map.get(w);}VF[b].push(f);fnorm(f);}
  for(const f of sh){alive[f]=0;live--;for(let k=0;k<3;k++){const x=FP[f*3+k];if(x===a)continue;const L=VF[x],j=L.indexOf(f);if(j>=0){L[j]=L[L.length-1];L.pop();}}}
  VF[a]=[];dead[a]=1;for(let k=0;k<10;k++)Q[b*10+k]+=Q[a*10+k];if(border[a])border[b]=1;stamp[b]++;
  const L=nb(b).slice();for(const x of L){hpush(b,x);hpush(x,b);}return true;}
 while(live>target&&HC.length){hpop();const a=ra,b=rb;if(dead[a]||dead[b]||stamp[a]!==rsa||stamp[b]!==rsb)continue;collapse(a,b);}
 const key2=new Map(),pv=[],av=[],idx=new Uint32Array(live*3);let n=0;
 for(let f=0;f<nF;f++){if(!alive[f])continue;for(let k=0;k<3;k++){const w=F[f*3+k],p=FP[f*3+k],kk=w*np+p;let id=key2.get(kk);
   if(id===undefined){id=pv.length;key2.set(kk,id);pv.push(pid[w]===p?w:rep[p]);av.push(w);}idx[n++]=id;}}
 return{idx:pv.length<65536?Uint16Array.from(idx):idx,pv:Uint32Array.from(pv),av:Uint32Array.from(av),tris:live};}
// ---------- 1b) Hintergrund-Arbeit: Web Worker (Blob), Rückfall Leerlauf im Hauptthread ----------
function lodWorker(){if(LOD4.w!==null)return LOD4.w;try{
  const src='var S='+lodSimplify.toString()+';self.onmessage=function(e){var d=e.data,r;try{r=S(d.P,d.I,d.t,{w:d.W,wK:d.K});if(r.tris>d.t*1.12)r=S(d.P,d.I,d.t,{free:1,w:d.W,wK:d.K});'+
   'self.postMessage({id:d.id,r:r},[r.idx.buffer,r.pv.buffer,r.av.buffer]);}catch(x){self.postMessage({id:d.id,err:String(x&&x.message||x)});}};';
  const w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  w.onmessage=e=>{const d=e.data,j=LOD4.jobs.get(d.id);if(!j)return;LOD4.jobs.delete(d.id);d.err?j.rej(new Error(d.err)):j.res(d.r);};
  w.onerror=e=>{try{e.preventDefault&&e.preventDefault();}catch(x){}LOD4.w=false;for(const[id,j]of LOD4.jobs){LOD4.jobs.delete(id);lodLocal(j.d).then(j.res,j.rej);}};
  LOD4.w=w;}catch(e){LOD4.w=false;}return LOD4.w;}
function lodLocal(d){return new Promise((res,rej)=>{const run=()=>{try{let r=lodSimplify(d.P,d.I,d.t,{w:d.W,wK:d.K});if(r.tris>d.t*1.12)r=lodSimplify(d.P,d.I,d.t,{free:1,w:d.W,wK:d.K});res(r);}catch(e){rej(e);}};
 try{if(window.requestIdleCallback){requestIdleCallback(run,{timeout:1500});return;}}catch(e){}setTimeout(run,30);});}
function lodRun0(P,I,t,W){const d={P,I,t,W:W||null,K:LOD4.wK};const w=lodWorker();if(!w)return lodLocal(d);const id=++LOD4.id;d.id=id;
 return new Promise((res,rej)=>{LOD4.jobs.set(id,{res,rej,d:{P:P.slice(),I:I.slice(),t,W:W?W.slice():null,K:LOD4.wK}});try{w.postMessage(d,W?[P.buffer,I.buffer,W.buffer]:[P.buffer,I.buffer]);}catch(e){LOD4.jobs.delete(id);lodLocal({P,I,t,W,K:LOD4.wK}).then(res,rej);}});}
// Eins nach dem anderen und erst, wenn die Modell-Warteschlange ruht (oder ein Ladebildschirm deckt) – keine Konkurrenz um die CPU mit Draco/Parsen
const LOD_Q=[];let lodBusy=false;
function lodIdle(){try{const Q=VMODEL_QUEUE;return(typeof LADEN==='object'&&LADEN.active)||!Q.busy&&!Q.q.length;}catch(e){return true;}}
function lodPump(){if(lodBusy||!LOD_Q.length)return;if(!lodIdle()){setTimeout(lodPump,200);return;}lodBusy=true;const j=LOD_Q.shift();
 lodRun0(j.P,j.I,j.t,j.W).then(j.res,j.rej).finally(()=>{lodBusy=false;setTimeout(lodPump,0);});}
function lodRun(P,I,t,W){return new Promise((res,rej)=>{LOD_Q.push({P,I,t,W,res,rej});lodPump();});}
const lodTris=g=>g.index?g.index.count/3:g.attributes.position.count/3;
function lodArr(A){const n=A.count,s=A.itemSize,o=new Float32Array(n*s);if(!A.isInterleavedBufferAttribute&&A.array instanceof Float32Array&&!A.normalized){o.set(A.array.subarray(0,n*s));return o;}
 for(let i=0;i<n;i++){o[i*s]=A.getX(i);if(s>1)o[i*s+1]=A.getY(i);if(s>2)o[i*s+2]=A.getZ(i);}return o;}
// Ergebnis → eigenes Netz (Position/Normale/Skinning aus pv, UV/Farbe/Masken aus av), Index neu; geglättete Normalen für den Umriss gleich mit
function lodBuild(src,R){const g=new THREE.BufferGeometry(),PA={position:1,normal:1,skinIndex:1,skinWeight:1};
 for(const k in src.attributes){if(k==='aSmooth')continue;const A=src.attributes[k],sel=PA[k]?R.pv:R.av,s=A.itemSize,n=sel.length,C=A.isInterleavedBufferAttribute?A.data.array.constructor:A.array.constructor,arr=new C(n*s);
  if(A.isInterleavedBufferAttribute){for(let i=0;i<n;i++){const j=sel[i];arr[i*s]=A.getX(j);if(s>1)arr[i*s+1]=A.getY(j);if(s>2)arr[i*s+2]=A.getZ(j);if(s>3)arr[i*s+3]=A.getW(j);}}
  else{const a=A.array;for(let i=0;i<n;i++){const j=sel[i]*s;for(let c=0;c<s;c++)arr[i*s+c]=a[j+c];}}
  g.setAttribute(k,new THREE.BufferAttribute(arr,s,A.normalized));}
 g.setIndex(new THREE.BufferAttribute(R.idx,1));g.computeBoundingSphere();g.computeBoundingBox();g.name=(src.name||'')+'_lod4';g.userData.lod4=1;
 try{if(typeof toonProSmooth==='function')toonProSmooth(g);}catch(e){}return g;}
function lodJob(geo,t){if(LOD4.cache.has(geo))return Promise.resolve(LOD4.cache.get(geo));if(geo.userData._lodP)return geo.userData._lodP;
 if(geo.morphAttributes&&geo.morphAttributes.position&&geo.morphAttributes.position.length)return Promise.resolve(null);// Shape Keys: unverändert lassen
 const t0=performance.now(),P=lodArr(geo.attributes.position),n=geo.attributes.position.count,I=geo.index?(geo.index.array.length&&n<65536?Uint16Array.from(geo.index.array):Uint32Array.from(geo.index.array)):(()=>{const a=new Uint32Array(n);for(let i=0;i<n;i++)a[i]=i;return a;})();
 const W=LOD4.prot&&geo.attributes._lodw?lodArr(geo.attributes._lodw):null;if(W)LOD4.wN=(LOD4.wN||0)+1;// Figuren R5: Schutzgewicht (Haar/Kappe) aus dem GLB
 LOD4.pend++;return geo.userData._lodP=lodRun(P,I,t,W).then(R=>{const g=lodBuild(geo,R);LOD4.cache.set(geo,g);LOD4.done++;LOD4.ms.push([geo.name||'?',lodTris(geo),R.tris,Math.round(performance.now()-t0)]);if(LOD4.ms.length>40)LOD4.ms.shift();return g;})
  .catch(e=>{LOD4.err++;console.warn('LOD-Netz nicht erzeugt – volles Netz bleibt:',e&&e.message||e);return null;}).finally(()=>{LOD4.pend--;delete geo.userData._lodP;});}
// Modell geladen → Körpernetze vereinfachen (Figur: „Koerper“ mit „Koerper_LOD1“; Terra: „…_Koerper“/„…_Kopf“ mit LOD1-Gegenstück)
function lodPrep(g){if(!LOD4.on||!g||!g.scene||!window.THREE)return Promise.resolve();const L=[];g.scene.traverse(m=>{if(m.isMesh&&m.userData.outline!==1)L.push(m);});
 const has=n=>L.some(m=>m.name===n+'_LOD1'),jobs=[];
 // Figuren R5: Körper mit Schutzgewicht (_lodw: Haar/Kappe) → Ziel 3,2 k statt 2,8 k: Haar-/Kappen-Umriss −60 %, Körper-Umriss wie bisher
 const fig=L.find(m=>m.name==='Koerper'&&m.isSkinnedMesh);if(fig&&has('Koerper'))jobs.push([fig,LOD4.prot&&fig.geometry.attributes._lodw?LOD4.T.figS:LOD4.T.fig]);
 const ter=L.filter(m=>m.isSkinnedMesh&&/_(Koerper|Kopf)$/.test(m.name)&&has(m.name));
 if(ter.length){const tot=ter.reduce((s,m)=>s+lodTris(m.geometry),0);for(const m of ter)jobs.push([m,Math.max(150,Math.round(LOD4.T.terra*lodTris(m.geometry)/tot))]);}
 return Promise.all(jobs.map(([m,t])=>lodJob(m.geometry,t)));}
// Lader-Hülle (außen um 61 vmqWrap): Modell sofort als „fertig“ melden (keine Verzögerung für Kampf/Figuren-Tausch), leichte Netze im Worker erzeugen
// und danach auf alle schon gebauten Exemplare nachrüsten (lodRetro). Der Ladebildschirm wartet auf beides (pcBusy zählt LOD4.pend).
function lodWrapL(L){if(!L||L._lod4)return L;L._lod4=1;const ld=L.load.bind(L);
 L.load=function(url,onL,onP,onE){return ld(url,g=>{try{lodPrep(g).then(lodRetro,e=>console.warn('LOD',e));}catch(e){}if(onL)onL(g);},onP,onE);};return L;}
function lodRetro(){try{const seen=new Set(),fix=S=>{if(!S||seen.has(S))return;seen.add(S);S.traverse(o=>{const U=o.userData;if(U&&U.inner&&(U.pilot||U.tm)&&!U.lod4){lodApply(o);if(U.lod4)U._gm=null;}});};
  if(typeof R3==='object'&&R3){fix(R3.scene);if(R3.player)fix(R3.player);}if(typeof scenes==='object')for(const k in scenes)fix(scenes[k]);if(typeof BT==='object'&&BT&&BT.s)fix(BT.s);}catch(e){console.warn('LOD nachrüsten',e);}}
if(typeof modelLoaders==='function'&&!modelLoaders._lod4){const _ml4=modelLoaders;modelLoaders=function(){return _ml4().then(lodWrapL);};modelLoaders._lod4=1;}
// ---------- 1c) Exemplare: LOD1, Umriss, Schattennetz aus dem leichten Netz ----------
const LOD_SK0=function(r,s,c,g){g.drawRange.count=0;},LOD_SK1=function(r,s,c,g){g.drawRange.count=Infinity;};// Hauptpass: kein Draw-Call; Schattenpass ruft das nicht auf
function lodShadow(m,G){if(!m.castShadow||!m.isSkinnedMesh||!m.skeleton||!m.parent)return null;let g=G.userData.sh;
 if(!g){g=new THREE.BufferGeometry();for(const k in G.attributes)if(k!=='aSmooth')g.setAttribute(k,G.attributes[k]);g.setIndex(G.index);g.boundingSphere=G.boundingSphere;g.boundingBox=G.boundingBox;g.name=G.name+'_schatten';G.userData.sh=g;}
 const s=new THREE.SkinnedMesh(g,m.material);s.bind(m.skeleton,m.bindMatrix);s.name=m.name+'_Schatten';s.castShadow=true;s.receiveShadow=false;s.frustumCulled=false;s.userData.shadowOnly=1;
 s.onBeforeRender=LOD_SK0;s.onAfterRender=LOD_SK1;s.position.copy(m.position);s.quaternion.copy(m.quaternion);s.scale.copy(m.scale);m.parent.add(s);m.castShadow=false;return s;}
function lodApply(root){const U=root&&root.userData;if(!U||!U.inner||U.lod4||!LOD4.on)return;const ms=[];U.inner.traverse(m=>{if(m.isMesh&&m.userData.outline!==1)ms.push(m);});
 const variant=U.tm?'terra':(typeof PILOT==='object'&&PILOT.outline)||'duenn';let n=0;
 for(const m of ms){const G=LOD4.cache.get(m.geometry);if(!G)continue;n++;
  const l1=ms.find(x=>x.name===m.name+'_LOD1');
  if(l1){l1.geometry=G;l1.castShadow=false;let h=l1.children.find(c=>c.userData&&c.userData.outline===1);if(h)h.geometry=G;else if(typeof toonProOutline==='function'){h=toonProOutline(l1,variant);}}
  for(const c of m.children)if(c.userData&&c.userData.outline===1)c.geometry=G;// Umriss des Hauptnetzes aus dem leichten Netz
  lodShadow(m,G);}
 if(!n)return;if(U.tm)for(const m of ms)if(/Augen/.test(m.name))m.castShadow=false;// Terra-Augenpartie: der Kopf-Schatten deckt sie ab
 U.lod4=n;U._gm=null;}
if(typeof pilotMake==='function'&&!pilotMake._lod4){const _pm4=pilotMake;pilotMake=function(){const o=_pm4.apply(this,arguments);try{if(o)lodApply(o);}catch(e){console.warn('LOD Figur',e);}return o;};pilotMake._lod4=1;}
if(typeof tmMake==='function'&&!tmMake._lod4){const _tm4=tmMake;tmMake=function(){const o=_tm4.apply(this,arguments);try{if(o)lodApply(o);}catch(e){console.warn('LOD Terra',e);}return o;};tmMake._lod4=1;}
// ---------- 1d) Shape Keys nur nah: Mimik/Blinzeln ab 8 Feldern eingefroren (Welt; Kampf/Ansichten nie) ----------
const _l4v=new THREE.Vector3();
function lodFar(o,battle){try{if(battle||typeof mode!=='undefined'&&mode==='battle'||typeof R3!=='object'||!R3||!R3.player||o===R3.player||!R3.scene)return false;let r=o;for(let i=0;i<8&&r.parent;i++)r=r.parent;if(r!==R3.scene)return false;
  const p=o.getWorldPosition(_l4v),q=R3.player.position,d=Math.hypot(p.x-q.x,p.z-q.z),U=o.userData;return U._far?d>LOD4.near-.5:d>LOD4.near;}catch(e){return false;}}
if(typeof pilotTick==='function'&&!pilotTick._lod4){const _pt4=pilotTick;pilotTick=function(o){try{if(o&&o.userData)o.userData._far=lodFar(o,false);}catch(e){}return _pt4.apply(this,arguments);};pilotTick._lod4=1;}
if(typeof tmAnim==='function'&&!tmAnim._lod4){const _ta4=tmAnim;tmAnim=function(o,t,st){try{if(o&&o.userData)o.userData._far=lodFar(o,!!(st&&st.battle));}catch(e){}return _ta4.apply(this,arguments);};tmAnim._lod4=1;}
if(typeof pilotFace==='function'&&!pilotFace._lod4){const _pf4=pilotFace;pilotFace=function(U){if(U&&U._far){LOD4.frz=(LOD4.frz||0)+1;return;}return _pf4.apply(this,arguments);};pilotFace._lod4=1;}
if(typeof tmFace==='function'&&!tmFace._lod4){const _tf4=tmFace;tmFace=function(U){if(U&&U._far){LOD4.frz=(LOD4.frz||0)+1;return;}return _tf4.apply(this,arguments);};tmFace._lod4=1;}
// ---------- 2) Vorkompilieren ----------
// Vorübergehende Exemplare der Terras des Gebiets (Team + Begegnungen), die noch nicht in der Szene stehen → Programme/Texturen/Knochen-Texturen vorab
function pcTemps(S){const out=[];try{if(typeof monObj!=='function'||!cur||!R3.player)return out;const ids=new Set();(G&&G.team||[]).forEach(m=>ids.add(m.s));const e=cur.enc;if(e)[...(e.day||[]),...(e.night||[])].forEach(x=>ids.add(x[0]));
  const inS=new Set();S.traverse(o=>{const U=o.userData;if(U&&U.tm)inS.add(U.tm);});const W=PC4.warmed||(PC4.warmed=new Map());
  for(const id of ids){if(!MONS[id])continue;const kind=typeof monRender==='function'?monRender(id):'?',k='m'+id+'|'+kind+(typeof tmReady==='function'&&tmReady(id)?'|tm':'');
   if(typeof tmKey==='function'&&tmReady(id)&&inS.has(tmKey(id))||W.get(k)===R3.r)continue;
   const o=monObj(id,typeof worldScale==='function'?worldScale(id):1,{},S);if(!o)continue;if(!o.parent)S.add(o);o.position.copy(R3.player.position);out.push([o,k]);}}catch(e){console.warn('Vorkompilieren: Terras',e);}return out;}
function pcWarm(why){if(typeof R3!=='object'||!R3||!R3.r||!R3.scene||!GFX.r0)return null;const r=R3.r,S=R3.scene,cam=R3.activeCam||R3.cam,t0=performance.now(),inf=r.info,p0=pcLinks(),x0=inf.memory.textures;
 const temps=pcTemps(S),U=[];let err=null;
 const sc=R3.sun.castShadow;R3.sun.castShadow=true;// für den Renderer wirft die Sonne immer Schatten (Abschnitt 3) – genau diesen Licht-Schlüssel kompilieren
 try{try{r.compile(S,cam);}catch(e){err='compile '+(e&&e.message);}
  // Aufwärm-Bild: alles sichtbar, alles wirft Schatten (Schatten-Varianten der Programme), in ein 4×4-Ziel – Texturen, Knochen-Texturen, Puffer werden hochgeladen
  S.traverse(o=>{if(o===S||o.isLight||o.isCamera)return;if(!o.visible){o.visible=true;U.push([o,'visible',false]);}if(o.isMesh&&!o.castShadow&&!(o.userData&&o.userData.outline===1)){o.castShadow=true;U.push([o,'castShadow',false]);}});
  if(!PC4.rt)PC4.rt=new THREE.WebGLRenderTarget(4,4,{depthBuffer:true,stencilBuffer:false});
  const prev=r.getRenderTarget(),au=r.shadowMap.autoUpdate;r.shadowMap.needsUpdate=true;
  try{r.setRenderTarget(PC4.rt);GFX.r0(S,cam);}finally{r.setRenderTarget(prev);r.shadowMap.autoUpdate=au;r.shadowMap.needsUpdate=true;PC4.clr=1;}}
 catch(e){err=String(e&&e.message||e);}
 finally{R3.sun.castShadow=sc;for(let i=U.length-1;i>=0;i--){const[o,k,v]=U[i];o[k]=v;}
  for(const[o,k]of temps){S.remove(o);try{if(o.userData&&o.userData.L)o.userData.L.items.delete(o);}catch(e){}try{BLOB.delete(o);}catch(e){}try{const sk=new Set();o.traverse(m=>{if(m.isSkinnedMesh&&m.skeleton)sk.add(m.skeleton);});sk.forEach(s=>s.dispose());}catch(e){}(PC4.warmed||(PC4.warmed=new Map())).set(k,r);}}
 const rec={why,ms:Math.round(performance.now()-t0),prog:pcLinks()-p0,tex:inf.memory.textures-x0,temps:temps.length,map:cur&&cur.id,err};PC4.n++;PC4.log.push(rec);if(PC4.log.length>20)PC4.log.shift();
 try{stabEv('Vorkompilieren '+why);}catch(e){}return rec;}
// Szene neu gebaut → im selben (ohnehin langen, meist verdeckten) Bild alles vorkompilieren; im Ladebildschirm erst nach den Modellen (ldHold)
if(typeof build3d==='function'&&!build3d._pc4){const _b34=build3d;build3d=function(){const S=_b34.apply(this,arguments);PC4.need=1;return S;};build3d._pc4=1;}
// Ladebildschirm (Haken in 55 ldRun): Modelle des Ortes abwarten (Warteschlange + LOD-Netze), höchstens bis LD_MS.min + 1,5 s, dann Szene auffrischen + vorkompilieren
function pcBusy(){try{const Q=VMODEL_QUEUE;return Q.busy||Q.q.some(x=>x.prio<=3)||LOD4.pend>0;}catch(e){return false;}}
async function ldHold(tok,tShow){const t0=performance.now(),dl=Math.max(t0,(tShow||t0)+((typeof LD_MS==='object'&&LD_MS.min)||650))+LOD4.holdMax,// höchstens +1,5 s über die sonstige Ladezeit
 Q=VMODEL_QUEUE,gap=Q.gap;let busy0=pcBusy();
 Q.gap=20;try{while(pcBusy()&&performance.now()<dl&&tok===LADEN.tok)await new Promise(r=>setTimeout(r,50));}finally{Q.gap=gap;}
 if(tok!==LADEN.tok)return;const wait=Math.round(performance.now()-t0),left=pcBusy();
 try{LADEN.own=true;draw3d();}catch(e){console.warn('Laden: Aufbau',e);}finally{LADEN.own=false;}
 const w=pcWarm('laden');PC4.need=0;
 const rec={map:cur&&cur.id,wait,busy0,offen:left?Q.q.map(x=>x.name).concat(Q.busy?['(läuft)']:[]):[],warm:w&&w.ms,prog:w&&w.prog,tex:w&&w.tex};PC4.hold.push(rec);if(PC4.hold.length>12)PC4.hold.shift();return rec;}
// ---------- 3) Schatten aus ohne Neukompilieren + Nach-dem-Laden-Protokoll (Hülle außen um r.render der Welt) ----------
function pcShadowMap(){const sh=R3.sun.shadow;if(sh.map)return sh.map;const ms=sh.mapSize;sh.map=new THREE.WebGLRenderTarget(ms.x,ms.y,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,format:THREE.RGBAFormat});
 sh.map.texture.name=(R3.sun.name||'')+'.shadowMap';sh.camera.updateProjectionMatrix();PC4.clr=1;return sh.map;}
function pcClear(){const r=R3.r,map=pcShadowMap(),prev=r.getRenderTarget(),cc=r.getClearColor(new THREE.Color()),ca=r.getClearAlpha();
 try{r.setRenderTarget(map);r.setClearColor(0xffffff,1);r.clear(true,true,false);}finally{r.setRenderTarget(prev);r.setClearColor(cc,ca);}PC4.clr=0;PC4.clears=(PC4.clears||0)+1;}
const _pcR={S:null,t:0,l:[],u:[]};
function pcPre(s){const sun=R3.sun,r=R3.r;PC4.off=!sun.castShadow;if(!PC4.off)return;
 // gewünscht „ohne Sonnenschatten“: für den Renderer bleibt die Sonne schattenwerfend (Licht-Schlüssel unverändert ⇒ keine neuen Programme),
 // aber die Karte wird nicht gezeichnet (einmal geleert) und Empfänger lesen sie nicht (receiveShadow ist ein Uniform, kein Programm-Merkmal)
 sun.castShadow=true;r.shadowMap.autoUpdate=false;r.shadowMap.needsUpdate=false;if(PC4.clr||!sun.shadow.map)pcClear();
 const now=performance.now();if(_pcR.S!==s||now-_pcR.t>2000){_pcR.S=s;_pcR.t=now;_pcR.l.length=0;s.traverse(o=>{if(o.isMesh&&o.receiveShadow)_pcR.l.push(o);});}
 for(const o of _pcR.l)if(o.receiveShadow){o.receiveShadow=false;_pcR.u.push(o);}}
function pcPost(){if(PC4.off){R3.sun.castShadow=false;for(const o of _pcR.u)o.receiveShadow=true;_pcR.u.length=0;}}
function pcSetup(){if(!R3||!R3.r||R3.r._pc4)return;const r=R3.r,rr=r.render;r._pc4=1;
 r.render=function(s,c){const w=s===R3.scene&&r.getRenderTarget()===null;if(!w)return rr.call(r,s,c);
  try{pcPre(s);}catch(e){}try{return rr.call(r,s,c);}finally{try{pcPost();}catch(e){}if(PC4.need&&!(typeof LADEN==='object'&&LADEN.active)){PC4.need=0;try{pcWarm('bau');}catch(e){}}}};}
if(typeof init3d==='function'&&!init3d._pc4){const _i34=init3d;init3d=function(){const had=!!R3;_i34.apply(this,arguments);try{if(!had&&R3)pcSetup();}catch(e){}};init3d._pc4=1;}
try{if(typeof R3==='object'&&R3)pcSetup();}catch(e){}
// Protokoll: die ersten 15 s nach dem Ausblenden des Ladebildschirms (je gezeichnetes Bild: Kosten, JS, neue Programme/Texturen, Ereignisse) → VSTAB.info().nach
if(typeof stabLong==='function'&&!stabLong._pc4){const _sl4=stabLong;stabLong=function(cost){try{const ld=typeof LADEN==='object'&&LADEN.active,now=performance.now();
   if(!ld&&(LADEN.count||0)!==(PC4.ldN||0)){PC4.ldN=LADEN.count;PC4.tEnd=now;PC4.nach=[];}/* neuer Ladebildschirm beendet (auch wenn währenddessen kein Bild der Schleife lief) */const r=STAB.fr;
   if(r&&!ld&&PC4.tEnd&&now-PC4.tEnd<15000&&PC4.nach.length<120)PC4.nach.push({at:Math.round(now-PC4.tEnd),ms:Math.round(cost),js:r.js,prog:r.prog,tex:r.tex,geo:r.geo,ev:r.ev.slice(0,3)});}catch(e){}
  return _sl4.apply(this,arguments);};stabLong._pc4=1;}
function lodInfo(){const N=PC4.nach;return{lod:{on:LOD4.on,done:LOD4.done,pend:LOD4.pend,err:LOD4.err,schutz:LOD4.wN||0,worker:LOD4.w?'ja':LOD4.w===false?'nein':'–',ms:LOD4.ms.slice(-12),frz:LOD4.frz||0},
 pc:{n:PC4.n,log:PC4.log.slice(-6),hold:PC4.hold.slice(-4),off:PC4.off,clears:PC4.clears||0},
 nach:{bilder:N.length,prog:N.reduce((s,f)=>s+(f.prog||0),0),tex:N.reduce((s,f)=>s+(f.tex||0),0),jsMax:N.reduce((s,f)=>Math.max(s,f.js||0),0),msMax:N.reduce((s,f)=>Math.max(s,f.ms||0),0),lang:N.filter(f=>f.prog>0||f.tex>0||f.js>100).slice(0,6)}};}
if(typeof stabInfo==='function'&&!stabInfo._lod4){const _si4=stabInfo;stabInfo=function(){const o=_si4.apply(this,arguments);try{Object.assign(o,lodInfo());}catch(e){}return o;};stabInfo._lod4=1;}
if(typeof stabStop==='function'&&!stabStop._lod4){const _ss4=stabStop;stabStop=function(){try{if(LOD4.w)LOD4.w.terminate();LOD4.w=false;}catch(e){}return _ss4.apply(this,arguments);};stabStop._lod4=1;}
// Ursachen-Protokoll (61): neue Programme = tatsächliche linkProgram-Aufrufe (r.info.programs zählt netto – beim Stufenwechsel werden alte Programme
// freigegeben, während neue entstehen, die Differenz blieb 0, obwohl neu kompiliert wurde)
function pcLinks(){try{const gl=R3&&R3.r&&R3.r.getContext();if(!gl)return 0;if(!gl._pc4){gl._pc4=1;gl._links=0;const lp=gl.linkProgram.bind(gl);gl.linkProgram=function(p){gl._links++;return lp(p);};}return gl._links;}catch(e){return 0;}}
if(typeof stabGpuInfo==='function'&&!stabGpuInfo._pc4){stabGpuInfo=function(){try{const i=R3&&R3.r&&R3.r.info;return i?[pcLinks(),i.memory.textures,i.memory.geometries]:null;}catch(e){return null;}};stabGpuInfo._pc4=1;}
