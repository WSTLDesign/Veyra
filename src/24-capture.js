// ===== VEYRA – Fangen: Fangkapseln, Wurfphysik, calcCatch, SEQ.catch, Erwerb & Herstellen (Agent F) =====
// Fangkapsel = EIGENES Design: facettierte Kristallkapsel (sechsseitige Doppelpyramide) mit Lichtkern und schwebendem Ring.
// Funktion ist an Facettenfarbe + Muster ablesbar (auch klein). Bestehende ITEMS kapsel/superk/ultra/daemmer/netz/meister bleiben als Aliasse.
// Schnittstellen: CAPSULES, CAP_ALIAS, capOf(k), calcCatch(mon,capsule,ctx)→{p,shakes,crit,ok}, capIcon(c,x,y,r,k,t,o), capIconCanvas(k,size),
//  capsuleStock(badges), capsuleGift(flag,k,n,text), RECIPES, craftMenu(), boxPut(m), dexNew(id), SEQ.catch, tryCatch(k) (ersetzt)
const CAPSULES={
 standard:{n:'Fangkapsel',item:'kapsel',c1:'#8fdcec',c2:'#e8fbff',ring:'#ffd166',core:'#fff6d0',pat:'plain',mul:1,p:200,d:'Die klassische Kristallkapsel. Ein ruhiger Lichtkern, ein goldener Ring.'},
 verstaerkt:{n:'Kobaltkapsel',item:'superk',c1:'#3f6fe0',c2:'#a9c4ff',ring:'#e8eef8',core:'#cfe0ff',pat:'alt',mul:1.5,p:600,d:'Facetten im Rautenwechsel aus Kobaltglas. Fangquote ×1,5.'},
 elite:{n:'Sternkapsel',item:'ultra',c1:'#f2b632',c2:'#2c2f45',ring:'#2c2f45',core:'#fff3b0',pat:'stripes',mul:2,p:1200,d:'Goldkristall mit dunklen Schrägstreifen. Fangquote ×2.'},
 absolut:{n:'Absolutkapsel',item:'meister',c1:'#b892ff',c2:'#ffffff',ring:'#ffe27a',core:'#ffffff',pat:'prism',always:1,mul:255,p:0,d:'Ein Prisma, in dem alle Farben singen. Fängt jede Kreatur. Es gibt nur ganz wenige.'},
 jubilaeum:{n:'Jubelkapsel',item:'jubelkapsel',c1:'#ff9ec4',c2:'#fff4f9',ring:'#7fe0c8',core:'#ffffff',pat:'confetti',mul:1,p:0,d:'Konfetti im Kristall! Gibt es als Bonus für je 10 gekaufte Fangkapseln.'},
 blitzstart:{n:'Zündkapsel',item:'zuendkapsel',c1:'#ffd84a',c2:'#ff7a3d',ring:'#3a3a3a',core:'#fff3b0',pat:'zigzag',mul:(m,x)=>(x.turn||1)<=1?5:1,p:1000,d:'Blitzzacken auf gelbem Kristall. Als allererste Aktion ×5, danach ×1.'},
 ausdauer:{n:'Geduldkapsel',item:'geduldkapsel',c1:'#9fcf7a',c2:'#5f7f40',ring:'#e8dcc0',core:'#f4ffd8',pat:'rings',mul:(m,x)=>Math.min(4,1+.3*Math.max(0,(x.turn||1)-1)),p:1000,d:'Jahresringe im Grünkristall. Je länger der Kampf, desto besser – bis ×4.'},
 daemmer:{n:'Dämmerkapsel',item:'daemmer',c1:'#3d2f6e',c2:'#f2e14c',ring:'#9a86e0',core:'#f2e14c',pat:'stars',mul:(m,x)=>x.night||x.cave?3:1,p:1000,d:'Nachtviolett mit Sternpunkten. Nachts oder in Höhlen ×3.'},
 netz:{n:'Netzkapsel',item:'netz',c1:'#3fc0d8',c2:'#0e5a78',ring:'#bff3ff',core:'#e8fdff',pat:'grid',mul:m=>MONS[m.s].t.some(t=>t==='flut'||t==='boe')?3.5:1,p:1000,d:'Ein Gitter aus Tiefseeblau. ×3,5 gegen Flut- und Böe-Kreaturen.'},
 nest:{n:'Nestkapsel',item:'nestkapsel',c1:'#6fb85a',c2:'#e4f7b0',ring:'#a07a4a',core:'#fbffe0',pat:'leaf',mul:m=>Math.max(1,Math.min(4,(41-m.l)/10)),p:1000,d:'Ein Blatt im Kristall. Je jünger die Kreatur, desto stärker – bis ×4.'},
 wiederkehr:{n:'Echokapsel',item:'echokapsel',c1:'#ff8a3d',c2:'#ffe0c0',ring:'#ffffff',core:'#fff1e0',pat:'echo',mul:(m,x)=>x.caughtBefore?3.5:1,p:1000,d:'Wellenringe in Orange. ×3,5, wenn du diese Art schon gefangen hast.'},
 heil:{n:'Balsamkapsel',item:'balsamkapsel',c1:'#f3efff',c2:'#5fcf9a',ring:'#ffb4c8',core:'#ffffff',pat:'petal',mul:1,heal:1,p:300,d:'Mintblüten im Milchkristall. Heilt die Kreatur beim Fang vollständig.'},
 bindung:{n:'Herzkapsel',item:'herzkapsel',c1:'#ff5f7a',c2:'#ffd0da',ring:'#ffd166',core:'#fff0f3',pat:'heart',mul:1,bond:1,p:400,d:'Ein Herz im Rosenkristall. Die Freundschaft wächst doppelt so schnell.'},
 // handgefertigt (Werkbank): eigene Wurfphysik
 feder:{n:'Federkapsel',item:'federkapsel',c1:'#f4efe2',c2:'#7f9be8',ring:'#c9a77c',core:'#ffffff',pat:'feather',mul:1,range:1.9,arc:1.6,fly:680,craft:1,p:0,d:'Handgefertigt, federleicht: fliegt weit und hoch. Ideal für Würfe aus der Distanz.'},
 wucht:{n:'Wuchtkapsel',item:'wuchtkapsel',c1:'#8a7a66',c2:'#3f352c',ring:'#d9b26a',core:'#ffe2a0',pat:'rough',mul:2.2,range:.7,arc:.5,fly:400,craft:1,p:0,d:'Handgefertigt aus Steinnuss: schwer, kurzer flacher Wurf – dafür Fangquote ×2,2.'},
 ranke:{n:'Rankenkapsel',item:'rankenkapsel',c1:'#4f9a58',c2:'#d2ee8e',ring:'#8a5a3a',core:'#f6ffd0',pat:'vine',mul:1.3,range:1.2,surp:2,craft:1,p:0,d:'Handgefertigt, umrankt. ×1,3 – trifft sie eine unaufmerksame Kreatur, wirkt der Überraschungsbonus doppelt.'}};
for(const id in CAPSULES)CAPSULES[id].id=id;
const CAP_ALIAS={kapsel:'standard',superk:'verstaerkt',ultra:'elite',meister:'absolut',daemmer:'daemmer',netz:'netz'};
// ITEMS: Aliasse auf die neuen Definitionen + neue Kapseln (k:'ball')
for(const id in CAPSULES){const C=CAPSULES[id],k=C.item,num=typeof C.mul==='number'?C.mul:1;
 if(ITEMS[k])Object.assign(ITEMS[k],{n:C.n,k:'ball',cap:id,d:C.d,r:C.always?999:ITEMS[k].r});else ITEMS[k]={n:C.n,k:'ball',r:num,p:C.p,d:C.d,cap:id};
 CAP_ALIAS[k]=id;}
// Sammelfrüchte (für die Werkbank)
Object.assign(ITEMS,{glanzbeere:{n:'Glanzbeere',k:'fruit',p:0,d:'Schimmernde Beere. Werkstoff für Balsam- und Herzkapseln.'},steinnuss:{n:'Steinnuss',k:'fruit',p:0,d:'Steinharte Nuss. Macht Kapseln schwer und wuchtig.'},
 federschote:{n:'Federschote',k:'fruit',p:0,d:'Leichte Schote voller Flaum. Lässt Kapseln weit fliegen.'},rankfrucht:{n:'Rankfrucht',k:'fruit',p:0,d:'Zähe Frucht mit Ranken. Gut für Ranken- und Nestkapseln.'},
 glutkern:{n:'Glutkern',k:'stone',p:2400,d:'Ein warm pulsierender Element-Kristall. Manche Kreaturen verändert er, wenn sie ihn beim Tausch tragen.'}});
function capOf(k){if(!k)return CAPSULES.standard;if(typeof k==='object')return k;return CAPSULES[k]||CAPSULES[CAP_ALIAS[k]]||(ITEMS[k]&&CAPSULES[ITEMS[k].cap])||CAPSULES.standard;}
function capItem(k){const d=capOf(k);return d.item;}

// ---------- Fangformel ----------
function statusMul(st){if(!st)return 1;const k=(typeof st==='string'?st:(st.name||st.k||st.id||'')).toLowerCase();
 if(/schlummer|raureif|schlaf|sleep|frost|gefr/.test(k))return 2.5;if(/starre|sporen|sengen|l[äa]e?hm|para|gift|tox|brand|verbr|burn/.test(k))return 1.5;return 1;}
function dexFrac(){try{const n=Object.keys(G.dex.caught).length,tot=Math.max(1,(typeof NMON!=='undefined'?NMON:MONS.length-1));return n/tot;}catch(e){return 0;}}
// kritischer Fang: Chance wächst mit dem Fortschritt der Chronik
function critChance(f){return f<.15?0:f<.3?.02:f<.5?.05:f<.7?.08:f<.9?.12:.16;}
function surpriseMul(def,ctx){let s=ctx.surprise||1;if((ctx.turn||1)>1)s=1;if(def.surp&&s>1)s=1+(s-1)*def.surp;return s;}
function calcCatch(mon,capsule,ctx){ctx=ctx||{};const def=capOf(capsule),M=MONS[mon.s],rnd=ctx.rand||Math.random;
 const max=Math.max(1,ctx.maxHp||stat(mon,'hp')),hp=Math.max(1,Math.min(max,mon.hp));
 if(def.always)return{p:1,a:255,bonus:Infinity,shakes:1,crit:true,ok:true,always:true};
 if(ctx.dist!=null&&ctx.dist>(def.range||1)){const hit=Math.max(0,1-(ctx.dist-(def.range||1))/((def.range||1)*.6));if(ctx.roll!==false&&rnd()>=hit)return{p:0,a:0,bonus:0,shakes:0,crit:false,ok:false,miss:true};}
 const bonus=typeof def.mul==='function'?def.mul(mon,ctx):def.mul,cr=ctx.rate??M.cr??45;
 let a=((3*max-2*hp)*cr*bonus)/(3*max)*statusMul(mon.status)*surpriseMul(def,ctx),p=Math.max(0,Math.min(1,a/255));
 if(DF().catch>1&&p<1){const f=Math.min(1,cr/30),fl=(.2+.9*(1-hp/max))*f;p=Math.min(1,Math.max(p*DF().catch,fl));a=p*255;}
 if(ctx.roll===false)return{p,a,bonus,shakes:0,crit:false,ok:p>=1};
 if(p>=1)return{p,a,bonus,shakes:3,crit:false,ok:true};
 const s1=Math.pow(p,1/3);// je Wackler
 if(rnd()<critChance(ctx.dex??dexFrac())){const ok=rnd()<s1;return{p,a,bonus,shakes:1,crit:true,ok};}
 let s=0;while(s<3&&rnd()<s1)s++;return{p,a,bonus,shakes:s,crit:false,ok:s===3};}
function catchCtx(foe,def){const st=(B&&B.wildState)||foe._wildState,sur=st==='sleep'?2:st==='graze'||st==='sniff'?1.5:1;
 return{turn:(B&&(B.turnN||B.nTurn))||1,night:isNight(),cave:!!(cur&&(cur.theme==='cave'||/grotte|hoehle|höhle/.test(cur.id))),surprise:sur,caughtBefore:!!G.dex.caught[foe.s],dist:.6,dex:dexFrac()};}

// ---------- 2D-Kapsel (Icon, Kampf-Overlay-Fallback, Heilstation, Läden) ----------
function capIcon(c,x,y,r,key,t,o){o=o||{};const d=capOf(key);t=t||0;c.save();c.translate(x,y);if(o.rot)c.rotate(o.rot);if(o.scale)c.scale(o.scale,o.scale);if(o.alpha!=null)c.globalAlpha=o.alpha;
 const ringC=o.ring||d.ring,coreC=o.core||d.core,lw=Math.max(.8,r*.13),tilt=-.2,spin=o.still?0:t/700;
 const ringArc=(a0,a1)=>{c.strokeStyle=ringC;c.lineWidth=lw;c.beginPath();c.ellipse(0,r*.08,r*1.22,r*.36,tilt,a0,a1);c.stroke();
  c.fillStyle='#ffffff';const a=(spin%(Math.PI*2));if(a>=a0&&a<=a1||a+Math.PI*2<=a1&&a+Math.PI*2>=a0){const px=Math.cos(a)*r*1.22,py=Math.sin(a)*r*.36;c.beginPath();c.arc(px*Math.cos(tilt)-py*Math.sin(tilt),r*.08+px*Math.sin(tilt)+py*Math.cos(tilt),lw*.7,0,7);c.fill();}};
 ringArc(Math.PI,Math.PI*2);
 const T=[0,-1.3*r],L=[-.8*r,-.02*r],CL=[-.28*r,.14*r],CR=[.28*r,.14*r],R=[.8*r,-.02*r],Bt=[0,1.12*r];
 const F=[[T,L,CL],[T,CL,CR],[T,CR,R],[L,Bt,CL],[CL,Bt,CR],[CR,Bt,R]],SH=[1.16,1,.8,1.04,.9,.72],RB=['#ff8a8a','#ffd36a','#8ef0a0','#7fd0ff','#b49cff','#ff9ee0'];
 const tri=(p,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(p[0][0],p[0][1]);c.lineTo(p[1][0],p[1][1]);c.lineTo(p[2][0],p[2][1]);c.closePath();c.fill();};
 F.forEach((p,i)=>{const base=d.pat==='prism'?RB[(i+Math.floor(t/400))%6]:d.pat==='alt'&&i%2?d.c2:d.c1;tri(p,shade(base,SH[i]));});
 c.save();c.beginPath();c.moveTo(T[0],T[1]);c.lineTo(R[0],R[1]);c.lineTo(Bt[0],Bt[1]);c.lineTo(L[0],L[1]);c.closePath();c.clip();capPattern(c,d,r,t);c.restore();
 // Lichtkern
 const pu=o.still?1:1+Math.sin(t/160)*.08,cr=r*.5*pu*(o.coreK||1),g=c.createRadialGradient(0,-.04*r,0,0,-.04*r,cr);g.addColorStop(0,'#ffffff');g.addColorStop(.35,coreC);g.addColorStop(1,'rgba(255,255,255,0)');
 c.fillStyle=g;c.beginPath();c.arc(0,-.04*r,cr,0,7);c.fill();
 // Kanten + Glanz
 c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=Math.max(.5,r*.05);c.beginPath();c.moveTo(T[0],T[1]);c.lineTo(CL[0],CL[1]);c.lineTo(Bt[0],Bt[1]);c.moveTo(T[0],T[1]);c.lineTo(CR[0],CR[1]);c.lineTo(Bt[0],Bt[1]);c.moveTo(L[0],L[1]);c.lineTo(CL[0],CL[1]);c.lineTo(CR[0],CR[1]);c.lineTo(R[0],R[1]);c.stroke();
 c.strokeStyle='rgba(30,40,64,.7)';c.lineWidth=Math.max(.7,r*.09);c.lineJoin='round';c.beginPath();c.moveTo(T[0],T[1]);c.lineTo(R[0],R[1]);c.lineTo(Bt[0],Bt[1]);c.lineTo(L[0],L[1]);c.closePath();c.stroke();
 c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.moveTo(-.12*r,-1.05*r);c.lineTo(-.55*r,-.12*r);c.lineTo(-.36*r,-.1*r);c.closePath();c.fill();
 ringArc(0,Math.PI);c.restore();}
function capPattern(c,d,r,t){const k=d.c2;c.strokeStyle=k;c.fillStyle=k;c.lineWidth=Math.max(.7,r*.13);c.lineCap='round';c.lineJoin='round';const P=d.pat;
 const ln=pts=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0]*r,p[1]*r):c.moveTo(p[0]*r,p[1]*r));c.stroke();},dot=(x,y,s)=>{c.beginPath();c.arc(x*r,y*r,s*r,0,7);c.fill();};
 if(P==='stripes'){c.lineWidth=r*.2;for(let i=-3;i<=3;i++)ln([[i*.55-1,-1.4],[i*.55+1,1.4]]);}
 else if(P==='confetti'){const C=[k,'#ffd166','#7fe0c8','#8fb4ff'];[[-.3,-.7],[.25,-.45],[-.45,.05],[.4,.15],[0,.55],[-.15,-.25],[.15,.85]].forEach((p,i)=>{c.fillStyle=C[i%4];dot(p[0],p[1],.11);});}
 else if(P==='zigzag'){c.lineWidth=r*.17;ln([[-.9,-.25],[-.45,.15],[-.1,-.35],[.25,.15],[.6,-.3],[.95,0]]);}
 else if(P==='rings'){c.lineWidth=r*.09;[-.75,-.35,.4,.75].forEach(y=>{c.beginPath();c.ellipse(0,y*r,r*.9,r*.12,0,0,7);c.stroke();});}
 else if(P==='stars'){[[-.35,-.6,.16],[.3,-.3,.12],[-.2,.45,.12],[.35,.6,.1]].forEach(([x,y,s])=>{c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,q=i%2?s*.35:s;c.lineTo((x+Math.cos(a)*q)*r,(y+Math.sin(a)*q)*r);}c.closePath();c.fill();});}
 else if(P==='grid'){c.lineWidth=r*.08;for(let i=-3;i<=3;i++){ln([[i*.4-1,-1.3],[i*.4+1,1.3]]);ln([[i*.4+1,-1.3],[i*.4-1,1.3]]);}}
 else if(P==='leaf'){c.beginPath();c.moveTo(0,-.85*r);c.quadraticCurveTo(.55*r,-.1*r,0,.75*r);c.quadraticCurveTo(-.55*r,-.1*r,0,-.85*r);c.fill();c.strokeStyle=d.c1;c.lineWidth=r*.07;ln([[0,-.7],[0,.65]]);ln([[0,-.2],[.22,-.38]]);ln([[0,.15],[-.22,-.02]]);}
 else if(P==='echo'){c.lineWidth=r*.11;[.3,.6,.92].forEach(q=>{c.beginPath();c.arc(0,.35*r,q*r,Math.PI*1.1,Math.PI*1.9);c.stroke();});}
 else if(P==='petal'){for(let i=0;i<3;i++){c.save();c.rotate(i*Math.PI*2/3);c.beginPath();c.ellipse(0,-.42*r,.2*r,.38*r,0,0,7);c.fill();c.restore();}}
 else if(P==='heart'){c.beginPath();c.moveTo(0,.62*r);c.bezierCurveTo(-.95*r,-.05*r,-.35*r,-.75*r,0,-.25*r);c.bezierCurveTo(.35*r,-.75*r,.95*r,-.05*r,0,.62*r);c.fill();}
 else if(P==='feather'){c.lineWidth=r*.08;ln([[0,-1.1],[0,1]]);for(let i=0;i<6;i++){const y=-.8+i*.3;ln([[0,y],[-.45,y-.25]]);ln([[0,y],[.45,y-.25]]);}}
 else if(P==='rough'){[[-.4,-.5,.13],[.3,-.6,.09],[.1,-.1,.15],[-.5,.3,.1],[.45,.25,.12],[-.05,.7,.1]].forEach(p=>dot(...p));}
 else if(P==='vine'){c.lineWidth=r*.12;c.beginPath();for(let i=0;i<=24;i++){const q=i/24,y=(-1.1+q*2.1)*r,x=Math.sin(q*Math.PI*3)*.42*r;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();dot(.36,-.55,.1);dot(-.36,.15,.1);}}
const CAPICON={};function capIconCanvas(k,size){size=size||28;const id=capOf(k).id+'_'+size;const c=document.createElement('canvas');c.width=c.height=size*2;c.className='capIc';c.style.width=c.style.height=size+'px';
 const x=c.getContext('2d');x.scale(2,2);capIcon(x,size/2,size*.52,size*.33,k,0,{still:1});return c;}

// ---------- 3D-Kapsel ----------
const CAP3={cache:{},g:null,id:null};
function capGlowTex(){if(CAP3.tex)return CAP3.tex;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return CAP3.tex=new THREE.CanvasTexture(c);}
function capMesh3D(key){if(!window.THREE)return null;const d=capOf(key);if(CAP3.cache[d.id])return CAP3.cache[d.id];
 const RB=['#ff8a8a','#ffd36a','#8ef0a0','#7fd0ff','#b49cff','#ff9ee0'],c1=new THREE.Color(d.c1),c2=new THREE.Color(d.c2),g=new THREE.Group();
 const half=(h,flip)=>{const geo=new THREE.ConeGeometry(.36,h,6,1).toNonIndexed();if(flip)geo.rotateX(Math.PI);geo.translate(0,flip?-h/2:h/2,0);geo.computeVertexNormals();
  const pos=geo.attributes.position,col=new Float32Array(pos.count*3);for(let f=0;f<pos.count;f+=3){const cx=(pos.getX(f)+pos.getX(f+1)+pos.getX(f+2))/3,cz=(pos.getZ(f)+pos.getZ(f+1)+pos.getZ(f+2))/3;
   const seg=((Math.floor((Math.atan2(cz,cx)+Math.PI)/(Math.PI/3))%6)+6)%6;const cc=d.pat==='prism'?new THREE.Color(RB[(seg+(flip?3:0))%6]):d.pat==='plain'?c1:((seg+(flip?1:0))%2?c2:c1);
   for(let v=0;v<3;v++){col[(f+v)*3]=cc.r;col[(f+v)*3+1]=cc.g;col[(f+v)*3+2]=cc.b;}}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));const m=new THREE.Mesh(geo,CAP3.mat||(CAP3.mat=new THREE.MeshToonMaterial({vertexColors:true,color:'#ffffff',gradientMap:typeof toonGrad==='function'?toonGrad():null,transparent:true,opacity:.92,toneMapped:false,emissive:'#ffffff',emissiveIntensity:.22})));
  if(typeof addOutline==='function')try{addOutline(m,.018);}catch(e){}return m;};
 const top=half(.62,false),bot=half(.46,true);g.add(top,bot);
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,1),new THREE.MeshBasicMaterial({color:d.core}));g.add(core);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:capGlowTex(),color:d.core,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.85}));glow.scale.setScalar(.8);g.add(glow);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.026,6,40),new THREE.MeshBasicMaterial({color:d.ring}));ring.rotation.x=Math.PI/2.3;g.add(ring);
 const sh=new THREE.Mesh(new THREE.CircleGeometry(.32,20),new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.22,depthWrite:false}));sh.rotation.x=-Math.PI/2;
 g.userData={core,glow,ring,sh,top,bot,d};g.scale.setScalar(.75);return CAP3.cache[d.id]=g;}

// ---------- Uhr für Sequenzen: Tippen beschleunigt die laufende Phase ----------
function seqClock(el,scale){const S={vt:0,sp:1,last:performance.now(),w:[],dead:0,scale:scale||1,taps:0};
 const tick=()=>{if(S.dead)return;const n=performance.now();S.vt+=(n-S.last)*S.sp;S.last=n;for(const w of S.w.slice())if(S.vt>=w.at){S.w.splice(S.w.indexOf(w),1);w.r();}};
 S.iv=setInterval(tick,15);S.now=()=>S.dead?S.vt:S.vt+(performance.now()-S.last)*S.sp;
 const tap=()=>{if(S.lock)return;S.sp=5;S.taps++;};if(el)el.addEventListener('pointerdown',tap);document.addEventListener('keydown',tap);
 S.planned=0;S.wait=ms=>new Promise(r=>{tick();S.sp=1;S.planned+=ms*S.scale;S.w.push({at:S.vt+ms*S.scale,r});});
 S.stop=()=>{if(S.dead)return;tick();S.dead=1;clearInterval(S.iv);if(el)el.removeEventListener('pointerdown',tap);document.removeEventListener('keydown',tap);S.w.forEach(w=>w.r());S.w=[];};return S;}
// eigene Klänge (SFX-Tabelle von 11-fx.js wird nur ergänzt)
Object.assign(SFX,{capThrow:[['triangle',300,1200,.22,.03]],capAbsorb:[['sine',1400,300,.4,.04],['triangle',700,1600,.25,.02,.12]],capShake:[['square',180,140,.05,.03],['sine',420,380,.06,.02,.05]],
 capClick:[['square',1600,1500,.03,.04],['sine',880,880,.08,.04,.05],['sine',1320,1320,.16,.04,.13]],capBreak:[['sawtooth',900,120,.3,.05],['triangle',1800,600,.2,.025,.05]],
 capCatchJ:[['triangle',587,587,.11,.05],['triangle',740,740,.11,.05,.12],['triangle',988,988,.11,.05,.24],['triangle',880,880,.1,.045,.38],['sine',1175,1175,.42,.055,.5]],
 capCrit:[['sine',660,1980,.3,.04],['triangle',1320,2640,.25,.025,.1]],healJ:[['sine',523,523,.14,.05],['sine',659,659,.14,.05,.15],['sine',784,784,.14,.05,.3],['triangle',1046,1046,.5,.05,.45]],
 healNote:[['sine',880,880,.12,.035]],evoTheme:[['sine',392,392,.5,.04],['sine',494,494,.5,.04,.55],['sine',587,587,.5,.04,1.1],['sine',740,740,.9,.045,1.65]],
 evoJ:[['triangle',523,523,.12,.05],['triangle',784,784,.12,.05,.13],['triangle',698,698,.12,.05,.26],['triangle',880,880,.12,.05,.39],['sine',1046,1046,.6,.06,.52]],
 lvlUp:[['triangle',659,659,.08,.05],['triangle',880,880,.08,.05,.09],['sine',1318,1318,.25,.05,.18]],evoBurst:[['sawtooth',200,1600,.45,.04],['sine',1600,2400,.5,.03,.2]]});
function jingle(id,fb){try{if(typeof playJingle==='function'){playJingle(id);return;}}catch(e){}sfx(fb);}
function capLog(t){const el=$('#bLog');if(!el)return;if(el._tw&&el._tw.finish)el._tw.finish();el.textContent=t;}

// ---------- SEQ.catch: Wurf → Lichtenergie → Fall → Wackler → Klick/Ausbruch ----------
SEQ.catch=async o=>{if(!B)return{};const def=capOf(o.capsule),res=o.res||(o.ok!=null?{ok:!!o.ok,shakes:o.shakes|0,crit:!!o.crit}:{shakes:3,ok:true}),short=SET.banim===0||RED;
 if(!o.res&&o.ok!=null)o.res={ok:!!o.ok,shakes:o.shakes|0,crit:!!o.crit};const S=seqClock($('#battle'),short?.32:1),C=B.cap={def,key:o.capsule,ph:'fly',ps:0,dur:1,clk:S,res,crit:!!res.crit,trail:[],foe:o.mon||B.foe[B.fi]};
 const ph=async(n,ms)=>{C.ph=n;C.ps=S.now();C.dur=Math.max(1,ms*S.scale);await S.wait(ms);};
 const FA=()=>!B2D&&BT&&BT.foe&&BT.foe.userData&&BT.foe.userData.act;
 try{capLog('Du wirfst eine '+def.n+'!');sfx('capThrow');vib(10);
  if(res.crit&&!res.always){capLog('Kritischer Fang! Die '+def.n+' glüht auf!');sfx('capCrit');}
  await ph('fly',short?260:(def.fly||560));
  if(res.miss){sfx('bump');await ph('miss',short?200:520);return{miss:true};}
  sfx('capAbsorb');vib(14);const A=FA();if(A)A.catch=performance.now()+40;if(BT&&BT.foe)setExpression(BT.foe,'verletzt',600);
  await ph('absorb',short?240:720);B.caught=1;
  await ph('drop',short?150:380);vib(8);sfx('bump');
  const n=res.always?1:res.crit?1:res.ok?3:res.shakes;
  for(let i=0;i<n;i++){C.si=i;await ph('pause',short?70:[360,470,600][i]);sfx('capShake');vib(6);capLog('…'.repeat(i+1));await ph('shake',short?140:440);}
  if(res.ok){C.si=-1;await ph('pause',short?60:380);sfx('capClick');vib([12,30,40]);capLog('Klick!');await ph('click',short?200:640);C.ph='rest';C.ps=S.now();}
  else{await ph('pause',short?60:300);B.caught=0;const A2=FA();if(A2){A2.catch=0;A2.pop=performance.now();}if(BT&&BT.foe)setExpression(BT.foe,'wuetend',1400);sfx('capBreak');vib([30,20,30]);await ph('break',short?220:620);}
 }finally{S.stop();if(!res.ok&&B&&B.cap===C)B.cap=null;}
 return{ok:!!res.ok,ms:Math.round(S.planned)};};

// Bild für Bild: 3D-Kapsel bewegen (vor dem Rendern), Lichteffekte im 2D-Overlay (danach)
const lerp3=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k],ezC=k=>k<0?0:k>1?1:k*k*(3-2*k);
function capPath(C){const has3=!B2D&&!!(BT&&BT.s&&BT.foe&&BT.cam);let S0,H,Gp,fh=1;
 if(has3){const f=BT.foe.position;fh=(BT.foe.userData.baseH||1)*BT.foe.scale.y;S0=[-3,1.3,3];H=[f.x-.35,f.y+fh*.55,f.z+.45];Gp=[f.x-.2,.16+.46*.75,f.z+.35];}
 else{S0=[40,138,0];H=[172,48,0];Gp=[176,70,0];}
 const now=C.clk?C.clk.now():0,k=Math.max(0,Math.min(1,(now-C.ps)/C.dur)),d=C.def,up=has3?1:-60;let p=Gp,rx=0,ry=0,rz=0,sc=1,coreK=1;
 if(C.ph==='fly'){const e=1-Math.pow(1-k,1.6);p=lerp3(S0,H,e);p=[p[0],p[1]+Math.sin(Math.PI*k)*1.3*(d.arc||1)*up,p[2]];ry=k*9;rz=k*3.4;}
 else if(C.ph==='miss'){p=[H[0]+(has3?1.4:30)*k,H[1]+(has3?-2.2:40)*k*k,H[2]-(has3?.6:0)*k];rz=k*8;}
 else if(C.ph==='absorb'){p=[H[0],H[1]+Math.sin(k*Math.PI)*(has3?.1:-4),H[2]];ry=k*14;sc=1+Math.sin(k*Math.PI)*.3;coreK=1+k*.9;}
 else if(C.ph==='drop'){const e=k*k;p=lerp3(H,Gp,e);if(k>.85)p=[p[0],p[1]+Math.sin((k-.85)/.15*Math.PI)*(has3?.05:-2),p[2]];}
 else if(C.ph==='shake'){const env=Math.sin(k*Math.PI);rz=Math.sin(k*Math.PI*3)*.5*env;p=[Gp[0]+Math.sin(k*Math.PI*3)*(has3?.03:1.2)*env,Gp[1],Gp[2]];}
 else if(C.ph==='click'){sc=1+Math.sin(Math.min(1,k*2.2)*Math.PI)*.18;coreK=1.5;}
 else if(C.ph==='rest'){coreK=1.3;}
 return{has3,p,rx,ry,rz,sc,coreK,k,H,Gp};}
function capFrame(){const C=B&&B.cap,g=CAP3.g;
 if(!C){if(g&&g.parent){g.parent.remove(g);if(g.userData.sh.parent)g.userData.sh.parent.remove(g.userData.sh);}return;}
 const Q=capPath(C);C.q=Q;if(!Q.has3)return;let m=capMesh3D(C.key);if(!m)return;
 if(CAP3.g!==m){if(CAP3.g&&CAP3.g.parent){CAP3.g.parent.remove(CAP3.g);CAP3.g.userData.sh.parent&&CAP3.g.userData.sh.parent.remove(CAP3.g.userData.sh);}CAP3.g=m;}
 if(m.parent!==BT.s){BT.s.add(m);BT.s.add(m.userData.sh);}const U=m.userData,t=performance.now();
 m.visible=C.ph!=='break';m.position.set(...Q.p);m.rotation.set(Q.rx,Q.ry,Q.rz);m.scale.setScalar(.75*Q.sc);
 U.ring.rotation.z=C.ph==='click'||C.ph==='rest'?U.ring.rotation.z*.9:t/240;U.core.scale.setScalar(Q.coreK*(1+Math.sin(t/140)*.08));
 U.glow.scale.setScalar(.8*Q.coreK);U.glow.material.color.set(C.ph==='click'||C.ph==='rest'?'#ffe27a':U.d.core);U.core.material.color.set(C.ph==='click'||C.ph==='rest'?'#fff2b0':U.d.core);
 const onG=['drop','pause','shake','click','rest'].includes(C.ph);U.sh.visible=m.visible;U.sh.position.set(Q.p[0],.17,Q.p[2]);const hs=onG?1:.5;U.sh.scale.setScalar(hs);
 const pr=new THREE.Vector3(...Q.p).project(BT.cam);C.sp=[(pr.x+1)/2*240,(1-pr.y)/2*150];}
function capOverlay(){const C=B&&B.cap;if(!C||!C.q)return;const c=$('#bcv').getContext('2d'),Q=C.q,t=performance.now(),d=C.def;c.save();c.setTransform(BS,0,0,BS,0,0);
 if(!Q.has3)C.sp=[Q.p[0],Q.p[1]];const[x,y]=C.sp,k=Q.k,f=scr('foe'),tc=TYPES[MONS[C.foe.s].t[0]].c;
 C.trail.push([x,y]);if(C.trail.length>12)C.trail.shift();
 if(C.ph==='fly'||C.ph==='miss'){C.trail.forEach((p,i)=>{c.globalAlpha=i/C.trail.length*.7;circ(c,p[0],p[1],1.6*i/C.trail.length+.4,C.crit?`hsl(${(t/3+i*30)%360},90%,70%)`:d.ring);});c.globalAlpha=1;}
 if(C.crit&&['fly','absorb','drop','pause','shake'].includes(C.ph)){c.strokeStyle=`hsla(${(t/4)%360},90%,72%,.85)`;c.lineWidth=1.4;c.beginPath();c.arc(x,y,10+Math.sin(t/90)*1.5,0,7);c.stroke();
  for(let i=0;i<6;i++){const a=t/300+i*Math.PI/3;circ(c,x+Math.cos(a)*12,y+Math.sin(a)*12,1,'#fff');}}
 if(C.ph==='absorb'){const fl=Math.max(0,1-k*2.5);if(fl>0){const g=c.createRadialGradient(f[0],f[1],0,f[0],f[1],34);g.addColorStop(0,`rgba(255,255,255,${.9*fl})`);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(f[0]-40,f[1]-40,80,80);}
  c.globalAlpha=.35*Math.sin(k*Math.PI);c.strokeStyle='#fff';c.lineWidth=3;c.beginPath();c.moveTo(f[0],f[1]);c.lineTo(x,y);c.stroke();c.globalAlpha=1;
  for(let i=0;i<22;i++){const ph=(k*1.6-i/22*.6);if(ph<0||ph>1)continue;const e=ph*ph,a=i*2.4+ph*5,rr=(1-e)*(14+(i%5)*3);const px=f[0]+(x-f[0])*e+Math.cos(a)*rr,py=f[1]+(y-f[1])*e+Math.sin(a)*rr*.7;
   circ(c,px,py,1.8*(1-e)+.5,i%3?tc:'#ffffff');}}
 if(C.ph==='shake'&&k<.4){c.globalAlpha=(1-k/.4)*.5;for(let i=0;i<4;i++)circ(c,x+(i-1.5)*5,y+7-k*6,1.6,'#e8e2d0');c.globalAlpha=1;}
 if(C.ph==='click'||C.ph==='rest'){const kk=C.ph==='click'?k:1;if(C.ph==='click'){c.strokeStyle=`rgba(255,226,122,${1-kk})`;c.lineWidth=2;c.beginPath();c.arc(x,y,6+kk*22,0,7);c.stroke();}
  const n=C.ph==='click'?6:3;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(C.ph==='rest'?t/900:.3),dd=C.ph==='click'?8+kk*20:11+Math.sin(t/300+i)*2;capStar(c,x+Math.cos(a)*dd,y-4+Math.sin(a)*dd*.7,C.ph==='click'?3*(1-kk*.5):1.6,'#ffe27a');}}
 if(C.ph==='break'){const g=c.createRadialGradient(x,y,0,x,y,30);g.addColorStop(0,`rgba(255,255,255,${.85*(1-k)})`);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(x-40,y-40,80,80);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+.3,v=18+(i%4)*7,px=x+Math.cos(a)*v*k,py=y+Math.sin(a)*v*k*.8+k*k*16;c.save();c.translate(px,py);c.rotate(a+k*6);c.globalAlpha=1-k;c.fillStyle=i%2?d.c1:d.c2;c.beginPath();c.moveTo(0,-3);c.lineTo(2.2,2);c.lineTo(-2.2,2);c.closePath();c.fill();c.restore();}}
 if(!Q.has3&&C.ph!=='break')capIcon(c,x,y,6.5,C.key,t,{rot:Q.rz,scale:Q.sc,coreK:Q.coreK});
 c.restore();}
function capStar(c,x,y,s,col){c.fillStyle=col;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?s*.42:s;c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}c.closePath();c.fill();}
// Lichtfunken nach Level-up/Heilung im Kampf (B.lvFx / B.healFx = {who,t,col})
function sparkOverlay(){if(!B)return;const c=$('#bcv').getContext('2d'),t=performance.now();c.save();c.setTransform(BS,0,0,BS,0,0);
 for(const[F,col,dur]of[[B.lvFx,'#ffd166',1200],[B.healFx,'#5fdc8a',1000]]){if(!F||t-F.t>dur)continue;const k=(t-F.t)/dur,[x,y]=scr(F.who);
  for(let i=0;i<16;i++){const a=i*2.39,rr=8+(i%4)*5,py=y+22-((k+i/16)%1)*48;c.globalAlpha=Math.sin(Math.PI*Math.min(1,k*1.2))*(1-((k+i/16)%1)*.6);
   if(i%3===0)capStar(c,x+Math.cos(a)*rr,py,2.2,'#ffffff');else circ(c,x+Math.cos(a+k*3)*rr,py,1.5,F.col||col);}}c.globalAlpha=1;c.restore();}
const _drawBattleCap=drawBattle;
drawBattle=function(){const C=B&&B.cap;let dm=null;try{capFrame();}catch(e){}
 // 2D-Fallback: Gegner während Fang ausblenden/verkleinern (drawBattle2D kennt B.cap nicht)
 if(C&&(B2D||!(BT&&BT.foe))&&['absorb','drop','pause','shake','click','rest'].includes(C.ph)){dm=drawMon;const k=C.q?C.q.k:1;drawMon=function(c,id,x,y,s,flip,t,al){if(flip){if(C.ph!=='absorb')return;return dm(c,id,x,y-k*10,s*(1-k),flip,t,1-k);}return dm(c,id,x,y,s,flip,t,al);};}
 try{_drawBattleCap();}finally{if(dm)drawMon=dm;}
 try{capOverlay();sparkOverlay();}catch(e){}};

// ---------- Fang auswerten (ersetzt tryCatch aus 14-battle.js; Signatur bleibt) ----------
function boxPut(m){if(typeof boxAdd==='function')return boxAdd(m);G.box=G.box||[];if(Array.isArray(G.box[0])||(G.box.length&&G.box.every(Array.isArray))){let b=G.box.find(x=>Array.isArray(x)&&x.length<30);if(!b){b=[];G.box.push(b);}b.push(m);return;}G.box.push(m);}
function dexNew(id){G.dexNew=G.dexNew||{};G.dexNew[id]=Date.now();try{if(typeof onDexNew==='function')onDexNew(id);}catch(e){}}
async function tryCatch(k){if(!B)return false;const it=ITEMS[k],def=capOf(k),foe=B.foe[B.fi];if(!it||B.tr)return false;G.bag[k]=Math.max(0,(G.bag[k]||0)-1);
 const ctx=catchCtx(foe,def),res=calcCatch(foe,k,ctx);B.lastCatch={k,res,ctx};await playSeq('catch',{mon:foe,capsule:k,res,ctx});if(!B)return true;
 if(res.miss){await msg('Die '+def.n+' verfehlt ihr Ziel!',1000);return false;}
 if(!res.ok){B.cap=null;await msg([res.crit?'Mist! Der kritische Fang ist misslungen!':'Oh nein! Es hat sich sofort befreit!','Mist! Fast hätte es geklappt!','Argh! So knapp!','Nur ein Hauch hat gefehlt!'][res.crit?0:Math.min(3,res.shakes)],1200);return false;}
 const nw=!G.dex.caught[foe.s];B.caught=1;delete foe._wildState;foe.status=null;foe.conf=0;if(typeof registerCatch==='function')registerCatch(foe,k);else{foe.capsule=k;foe.metAt=foe.metAt||{map:cur.id,l:foe.l,date:Date.now()};}
 if(def.heal)healMon(foe);if(def.bond)foe.friendship=Math.max(foe.friendship??70,100);
 caught(foe.s);if(nw)dexNew(foe.s);G.flags.firstcatch=1;if(B.legend)G.flags[B.legend.flag]=1;
 const inTeam=G.team.length<6;let boxed=true;if(inTeam)G.team.push(foe);else boxed=boxPut(foe)!==null;
 jingle('catch','capCatchJ');await msg('Geschafft! '+mname(foe)+' wurde gefangen!',1300);
 if(def.heal)await msg('Die '+def.n+' hat '+mname(foe)+' vollständig geheilt.',1000);
 if(typeof uiCaught==='function')await uiCaught(foe,nw);else await catchCard(foe,nw);
 if(nw)await msg('Neu! '+mname(foe)+' wurde in deine Chronik eingetragen.',1000);
 if(!inTeam)await msg(mname(foe)+(boxed?' wurde in die Kreaturenbox geschickt.':' findet keinen Platz – die Kreaturenbox ist voll!'),1000);
 B.cap=null;endBattle('catch');return true;}
// Freundschafts-Multiplikator (Herzkapsel) – für 21-species/30-camp nutzbar
function friendMul(m){return m&&capOf(m.capsule).bond?2:1;}

// ---------- Rundenzähler, Überraschungsbonus aus dem Roamer-Zustand ----------
const _turnCap=turn;turn=function(act){if(B&&!(B.rt&&(B.busy||B.g.me<1)))B.nTurn=(B.nTurn||0)+1;return _turnCap(act);};
let WILD_ST=null;const _startWildCap=startWild;startWild=function(r){WILD_ST=r?(r.pose||r.st||null):null;try{return _startWildCap(r);}finally{WILD_ST=null;}};
const _startBattleCap=startBattle;startBattle=function(o){if(o&&o.wild&&WILD_ST&&!o.wild._wildState)o.wild._wildState=WILD_ST;return _startBattleCap(o);};

// ---------- Erwerb: Läden nach Orden, Jubel-Bonus, Geschenke ----------
function capsuleStock(badges){badges=badges|0;return[['kapsel',0],['superk',1],['nestkapsel',1],['netz',2],['echokapsel',2],['balsamkapsel',2],['ultra',3],['daemmer',3],['zuendkapsel',3],['geduldkapsel',3],['herzkapsel',4]].filter(x=>badges>=x[1]).map(x=>x[0]);}
{const add={laden_brise:['echokapsel','balsamkapsel'],laden_frost:['netz','zuendkapsel','geduldkapsel'],laden_schatt:['zuendkapsel','geduldkapsel','herzkapsel','echokapsel'],laden_moewe:['echokapsel','balsamkapsel','herzkapsel']};
 for(const id in add){const I=INTERIORS[id];if(!I||!I.stock)continue;const nb=I.stock.filter(k=>ITEMS[k]&&ITEMS[k].k==='ball').length;add[id].forEach(k=>{if(!I.stock.includes(k))I.stock.splice(nb,0,k);});}}
const _openShopCap=openShop;openShop=function(stock){let s=stock;try{const I=cur&&INTERIORS[cur.id];if(I&&I.k==='shop'&&stock===I.stock){const balls=stock.filter(k=>ITEMS[k]&&ITEMS[k].k==='ball');
  s=[...balls,...capsuleStock((G.badges||[]).length).filter(k=>!balls.includes(k)),...stock.filter(k=>!balls.includes(k))];}}catch(e){}const r=_openShopCap(s);capDecorate($('#shopBody'));return r;};
const _addItemCap=addItem;addItem=function(k,n){_addItemCap(k,n);try{const sh=$('#shop');if(sh&&!sh.hidden&&ITEMS[k]&&ITEMS[k].k==='ball'&&k!=='jubelkapsel'&&n>0){G.capBought=(G.capBought||0)+n;let b=0;while(G.capBought>=10){G.capBought-=10;b++;}
  if(b){_addItemCap('jubelkapsel',b);setTimeout(()=>toast('Bonus: '+b+'× Jubelkapsel für je 10 gekaufte Kapseln!'),1000);}}}catch(e){}};
// Kapsel-Icons in Laden und Tasche
function capDecorate(root){if(!root)return;const byN={};for(const k in ITEMS)if(ITEMS[k].k==='ball')byN[ITEMS[k].n]=k;
 root.querySelectorAll('.item').forEach(r=>{if(r.querySelector('.capIc'))return;const b=r.querySelector('b');const k=b&&byN[b.textContent.trim()];if(k){const ic=capIconCanvas(k,30);ic.style.flex='0 0 auto';ic.style.marginRight='6px';r.insertBefore(ic,r.firstChild);}});}
try{new MutationObserver(()=>capDecorate($('#shopBody'))).observe($('#shopBody'),{childList:true});}catch(e){}
const _rBagCap=rBag;rBag=function(el){_rBagCap(el);try{const fr=Object.keys(ITEMS).filter(k=>ITEMS[k].k==='fruit'&&G.bag[k]>0);
 if(fr.length){if(el.querySelector('.empty'))el.innerHTML='';el.insertAdjacentHTML('beforeend','<h3>Sammelfrüchte</h3>');fr.forEach(k=>{const it=ITEMS[k],r=document.createElement('div');r.className='item';r.innerHTML=`<div><b>${it.n}</b> <small>×${G.bag[k]}</small><p class="muted">${it.d}</p></div>`;el.appendChild(r);});}
 capDecorate(el);}catch(e){}};
// Geschenke (einmalig je Flag); Story: Absolutkapsel nach dem Sieg über Vargo
const CAP_GIFTS=[{f:'firstcatch',k:'jubelkapsel',n:1,t:'Prof. Lindqvist schickt dir zur Feier deines ersten Fangs eine Jubelkapsel!'},{f:'badge1',k:'nestkapsel',n:3,t:'Geschenk der Arena: 3× Nestkapsel'},
 {f:'badge2',k:'echokapsel',n:3,t:'Geschenk der Arena: 3× Echokapsel'},{f:'badge3',k:'zuendkapsel',n:2,t:'Geschenk der Arena: 2× Zündkapsel'},{f:'boss1',k:'meister',n:1,t:'Unter Vargos Mantel glimmt etwas: Du erhältst die Absolutkapsel!'}];
function capsuleGift(flag,k,n,text){if(!G||!G.flags||G.flags['gift_'+flag+'_'+k])return false;G.flags['gift_'+flag+'_'+k]=1;_addItemCap(k,n||1);if(text)toast(text);return true;}
function capGiftTick(){if(!G||!G.flags)return;let d=0;for(const g of CAP_GIFTS)if(G.flags[g.f]&&!G.flags['gift_'+g.f+'_'+g.k]){setTimeout(()=>capsuleGift(g.f,g.k,g.n,g.t),400+d);d+=1800;}}
const _endBattleCap=endBattle;endBattle=function(res){if(B&&B.cap)B.cap=null;const r=_endBattleCap(res);try{capGiftTick();}catch(e){}return r;};

// ---------- Herstellen: Werkbank bei Kristallschleiferin Juna (Kupferhain, Wohnhaus) ----------
const RECIPES=[{out:'federkapsel',n:2,need:{federschote:2,kapsel:1}},{out:'wuchtkapsel',n:1,need:{steinnuss:2,kapsel:1}},{out:'rankenkapsel',n:2,need:{rankfrucht:2,kapsel:1}},
 {out:'nestkapsel',n:1,need:{rankfrucht:1,steinnuss:1}},{out:'balsamkapsel',n:1,need:{glanzbeere:2,kapsel:1}},{out:'herzkapsel',n:1,need:{glanzbeere:1,federschote:1,kapsel:1}}];
function canCraft(r){return Object.entries(r.need).every(([k,n])=>(G.bag[k]||0)>=n);}
function craft(r){if(!canCraft(r))return false;for(const[k,n]of Object.entries(r.need)){G.bag[k]-=n;if(G.bag[k]<=0)delete G.bag[k];}_addItemCap(r.out,r.n);return true;}
function craftMenu(){const L=RECIPES.map(r=>`${r.n}× ${ITEMS[r.out].n} ← `+Object.entries(r.need).map(([k,n])=>n+' '+ITEMS[k].n).join(' + ')+(canCraft(r)?'':' (fehlt)'));
 ask('Juna: Was soll ich dir schleifen?',[...L,'Fertig'],i=>{if(i>=RECIPES.length)return say('Juna: Komm wieder, wenn du neue Früchte gesammelt hast!');const r=RECIPES[i];
  if(!craft(r))return say(['Juna: Dafür fehlen dir noch Zutaten.','Sammelfrüchte findest du an Wegrändern – achte auf glitzernde Stellen.'],craftMenu);sfx('capClick');say('Du erhältst '+r.n+'× '+ITEMS[r.out].n+'!',craftMenu);});}
if(typeof HOOKS!=='undefined'){HOOKS.werkbank=n=>{const F=G.flags;if(!F.craft_intro){F.craft_intro=1;['glanzbeere','steinnuss','federschote','rankfrucht'].forEach(k=>_addItemCap(k,2));
  return say(['Juna: Ich bin Juna, Kristallschleiferin. Jede Fangkapsel beginnt als roher Kristall.','Juna: Mit Sammelfrüchten schleife ich dir besondere Kapseln: Federkapseln fliegen weit, Wuchtkapseln sind schwer und fangen besser.','Juna: Hier, je zwei Früchte zum Ausprobieren!'],craftMenu);}return craftMenu();};
 NPCS.haus_kupfer=NPCS.haus_kupfer||[];if(!NPCS.haus_kupfer.some(n=>n.hook==='werkbank'))NPCS.haus_kupfer.push({x:6,y:5,c:'#5aa6b8',t:'talk',hook:'werkbank',name:'Juna'});}
// Fundstellen für Sammelfrüchte (Agent H kann weitere ergänzen)
[['route1',2,3,'glanzbeere',2,'fr_r1a'],['route1',17,15,'federschote',2,'fr_r1b'],['route2',3,3,'steinnuss',2,'fr_r2a'],['route2',16,8,'rankfrucht',2,'fr_r2b']].forEach(([map,x,y,item,n,flag])=>{
 try{const M=MAPS[map],t=M&&M.rows[y]&&M.rows[y][x];NPCS[map]=NPCS[map]||[];if(t==='.'&&!NPCS[map].some(q=>q.x===x&&q.y===y))NPCS[map].push({x,y,c:'#e8c22e',t:'item',item,n,flag});}catch(e){}});

// ---------- Kartenbild (Fangkarte-Fix, Opus hoch, 10.11.) ----------
// Nutzer-Bug: „Neu im Dex“-Karte nach dem Fang ohne Bild (leeres Farbfeld). Ursachen (docs/qa-dex.md): (1) bildlose Art – 3D-Vorschaubild aus verlorenem
// WebGL-Kontext ist transparent und blieb für immer im Cache (Fix in 10-mon3d monThumb); (2) Illustration noch nicht geladen/dekodiert (App lädt beim Start
// 105 Bilder vor) – die Karte schloss nach 3,4 s, bevor das <img> fertig war; (3) <img> mit async-Dekodierung + Schwebe-Ebene (will-change) in der 3D-Wende
// (preserve-3d/backface-visibility) und Breite nur über aspect-ratio – auf manchen Engines (WebKit) leer/0 px breit.
// Lösung: cardPic = Canvas in fester Pixelgröße, synchron aus dekodierter Quelle gezeichnet (Illustration, Glanz-Canvas, Vorschaubild); fehlt die Quelle:
// Platzhalter in Elementfarbe, Nachfüllen per Promise (el.ready) mit Einblendung, nach 2,6 s spätestens 2D-Rückfall (drawMon2D). Jede Zeichnung wird auf
// Deckung geprüft (leer ⇒ Rückfall). mini(id,size,dim,{card:true}) liefert diesen Weg; ohne card bleibt mini unverändert (Dex/Team/Menüs).
// Bildsicherheit (Agent Kreaturenbilder, 12.11., docs/bilder.md): cardPic ist jetzt das zentrale Kreaturenbild für Dex, Team, Lager, Kampf-Menüs, Fang-Karte
// und Detail-Bühne (mini() leitet alle Arten hierher). Canvas in Gerätepixeln (CSS-Größe × DPR bis 3, folgt der echten Größe per ResizeObserver), Illustration
// freigestellt (Boden-Platte weg, auf Inhalt zugeschnitten) mit einheitlichem Kontaktschatten; o.lazy = erst zeichnen, wenn sichtbar (Dex mit 105 Bildern).
// Kein Bild (lädt noch / endgültig fehlgeschlagen) → prozedurales Sprite (drawMon2D), nie ein „?“; kommt das Bild später, wird nachgefüllt (50-artsafe).
function picSrc(id,o){if(typeof hasArt==='function'&&hasArt(id)){if(artReady(id))return{kind:artFramed(id)?'framed':'art'};if(!(typeof ART_BAD!=='undefined'&&ART_BAD[id]))return null;}
 const T=typeof THUMB!=='undefined'&&THUMB[id];return T&&T.img?{kind:'thumb',T}:null;}
// Quelle bereitstellen (Promise → true/false): Illustration laden + dekodieren (Warteschlange in 26-art, sichtbar = vorne), sonst Vorschaubild im Leerlauf
function picPrep(id,o){o=o||{};if(!MONS[id])return Promise.resolve(false);
 if(typeof hasArt==='function'&&hasArt(id)&&!(typeof ART_BAD!=='undefined'&&ART_BAD[id]))return new Promise(res=>{artLoad(id,true);
  artOnLoad(id,()=>{if(!artReady(id))return res(false);try{if(o.shiny&&artHue(id))artShinyCanvas(id);}catch(e){}res(true);});});
 if(typeof monThumbAsync!=='function')return Promise.resolve(false);return monThumbAsync(id).then(T=>!!T,()=>false);}
// Deckung (Anteil sichtbarer Pixel) eines Canvas; gesperrte Pixel (file://) ⇒ 1 (nicht prüfbar, Zeichnung gilt)
function picCover(cv){try{const s=32,t=document.createElement('canvas');t.width=t.height=s;const x=t.getContext('2d');x.drawImage(cv,0,0,s,s);const d=x.getImageData(0,0,s,s).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>24)n++;return n/(s*s);}catch(e){return 1;}}
// Zeichnet in das Canvas (Gerätepixel); Ergebnis true (Bild), '2d' (prozeduraler Ersatz) oder false (Canvas nicht nutzbar)
function picDraw(cv,id,o){if(!cv.width||!cv.height)return false;const x=cv.getContext('2d');if(!x)return false;const W=cv.width,H=cv.height,P=picSrc(id,o);x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,W,H);let ok=false;
 x.imageSmoothingEnabled=true;try{x.imageSmoothingQuality='high';}catch(e){}
 const shadow=()=>{const g=x.createRadialGradient(W/2,H*.9,0,W/2,H*.9,W*.28);g.addColorStop(0,'rgba(24,20,40,.3)');g.addColorStop(.6,'rgba(24,20,40,.12)');g.addColorStop(1,'rgba(24,20,40,0)');
  x.save();x.translate(W/2,H*.9);x.scale(1,.18);x.translate(-W/2,-H*.9);x.fillStyle=g;x.fillRect(0,H*.9-W*.3,W,W*.6);x.restore();};
 try{if(P&&P.kind==='framed')ok=drawArt(x,id,0,0,W,H,false,{cover:true,shiny:o.shiny});
  else if(P&&P.kind==='art'){shadow();ok=drawArt(x,id,W*.1,H*.08,W*.8,H*.82,false,{shiny:o.shiny,cut:true});}
  else if(P){shadow();const s=Math.min(W,H)*.94;x.drawImage(P.T.img,(W-s)/2,H*.02+(H*.94-s)*.6,s,s);ok=true;}}catch(e){ok=false;}
 if(ok&&picCover(cv)<.03){ok=false;x.clearRect(0,0,W,H);}
 if(!ok){try{if(typeof drawMon2D==='function'){x.setTransform(1,0,0,1,0,0);shadow();drawMon2D(x,id,W/2,H*.55,W*.8,false,0);ok=picCover(cv)>=.03?'2d':false;}}catch(e){ok=false;}}
 if(!ok){/* letzter Rückfall: weiche Silhouette in Elementfarbe (nie leer, nie „?“) */try{const M=MONS[id],c=M?TYPES[M.t[0]].c:'#8fb4ff';shadow();const g=x.createRadialGradient(W/2,H*.5,W*.05,W/2,H*.55,W*.36);g.addColorStop(0,'#fff');g.addColorStop(.5,c);g.addColorStop(1,c+'00');x.fillStyle=g;x.beginPath();x.ellipse(W/2,H*.56,W*.3,H*.3,0,0,7);x.fill();ok='2d';}catch(e){}}
 return ok;}
// Backing-Größe = tatsächliche CSS-Größe × DPR (CSS-Regeln wie im Dex überschreiben die Startgröße)
function picFit(el,cv,size){const d=typeof artDpr==='function'?artDpr():Math.min(3,Math.max(1,window.devicePixelRatio||1)),w=el.offsetWidth||size,h=el.offsetHeight||size,
 W=Math.max(1,Math.round(w*d)),H=Math.max(1,Math.round(h*d));if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;return true;}return false;}
function cardPic(id,size,o){o=o||{};size=Math.max(16,Math.round(size||56));const el=document.createElement('span'),M=MONS[id],fr=!!(M&&typeof hasArt==='function'&&hasArt(id)&&artFramed(id));
 el.className='cpic'+(o.field&&!fr?' field':'')+(fr?' framed':'')+(o.dim?' dim':'')+(o.shiny?' shiny':'')+(o.stage?' stage':'')+(size<60?' sm':'');el.style.width=el.style.height=size+'px';
 if(o.field&&!fr&&typeof artField==='function')try{el.style.background=artField(id);}catch(e){}
 if(M)el.style.setProperty('--tc',TYPES[M.t[0]].c);el.setAttribute('role','img');el.setAttribute('aria-label',M?M.n:'');if(M)el.dataset.id=id;
 const cv=document.createElement('canvas'),dpr=typeof artDpr==='function'?artDpr():Math.min(3,Math.max(1,window.devicePixelRatio||1));cv.width=cv.height=o.lazy?0:Math.round(size*dpr);cv.setAttribute('aria-hidden','true');el.appendChild(cv);
 if(!M){el.ready=Promise.resolve(false);return el;}
 const fill=late=>{if(el.isConnected)picFit(el,cv,size);else if(!cv.width)cv.width=cv.height=Math.round(size*dpr);const r=picDraw(cv,id,o);el.classList.remove('wait');el.dataset.pic=r==='2d'?'2d':r?'ok':'none';el._rel=0;
  if(late&&!RED){el.classList.remove('in');void el.offsetWidth;el.classList.add('in');}if(late&&r)try{el.dispatchEvent(new Event('picfill',{bubbles:true}));}catch(e){}
  if(r!==true&&typeof artWatch==='function'&&hasArt(id))artWatch(id,el);return!!r;};
 el._pic={id,o,size,cv,fill};if(typeof artTrack==='function')artTrack(el);
 const go=res=>{if(picSrc(id,o)){fill(false);res(true);if(el.dataset.pic!=='ok')picPrep(id,o).then(()=>{if(el.isConnected&&el.dataset.pic!=='ok'&&picSrc(id,o))fill(true);});return;}
  el.classList.add('wait');el.dataset.pic='wait';let done=0;const fin=()=>{if(done)return;done=1;res(fill(true));};
  picPrep(id,o).then(()=>{if(!done)fin();else if(el.dataset.pic!=='ok'&&picSrc(id,o))fill(true);},fin);setTimeout(fin,o.maxWait||2600);};
 if(o.lazy&&typeof artLazy==='function'&&window.IntersectionObserver){el.classList.add('wait');el.dataset.pic='wait';el.ready=new Promise(res=>{el._go=()=>{el._go=null;go(res);};});artLazy(el);return el;}
 el.ready=new Promise(go);return el;}
// Alle Miniaturen (Dex, Team, Lager, Kampf-Menüs, Fang-Karte) über cardPic; o.img=true erzwingt die alte <img>-Variante
mini=(f=>function(id,size,dim,o){if((o&&o.card)||(MONS[id]&&!(o&&o.img)))return cardPic(id,size,Object.assign({},o,{dim:!!dim}));return f.apply(this,arguments);})(mini);
// Vorladen beim Kampfstart (wilde Kreaturen): Illustration dekodieren bzw. Vorschaubild im Leerlauf erzeugen → Fang-Karte ist sofort voll
function picPreload(){if(!B||B.tr)return;(B.foe||[]).forEach(f=>{try{if(f&&MONS[f.s])picPrep(f.s,{shiny:f.shiny});}catch(e){}});}
{const _sbnPic=startBattleNow;startBattleNow=function(){const r=_sbnPic.apply(this,arguments);try{picPreload();}catch(e){}return r;};}

// ---------- Stile ----------
{const st=document.createElement('style');st.textContent=`.capIc{display:inline-block;vertical-align:middle;flex:0 0 auto}#shopBody .item,#mBody .item{align-items:center}
.cpic{position:relative;display:block;flex:0 0 auto;margin:0 auto;z-index:1;border-radius:22px;isolation:isolate}.cpic.sm{border-radius:12px}
.cpic>canvas{position:absolute!important;left:0;top:0;width:100%!important;height:100%!important;max-height:none!important;max-width:none!important;margin:0!important;display:block}
.cpic.field{box-shadow:var(--shadow-s,0 4px 14px -6px rgba(20,30,60,.3)),inset 0 0 0 1px rgba(255,255,255,.55)}
.cpic.framed{overflow:hidden;border-radius:18px;background:linear-gradient(180deg,#6fa6ec,#c9d8ff 55%,#f6e6ff);box-shadow:var(--shadow-s,0 4px 14px -6px rgba(20,30,60,.3)),0 0 0 2px rgba(255,217,138,.95)}
.cpic.dim>canvas{filter:grayscale(1) brightness(.35)}
.cpic.wait::after{content:'';position:absolute;left:20%;right:20%;top:16%;bottom:14%;border-radius:48% 48% 40% 40%;background:radial-gradient(closest-side,color-mix(in srgb,var(--tc,#8fb4ff) 60%,#fff),rgba(255,255,255,0));animation:cpWait 1s ease-in-out infinite alternate}
.cpic.in>canvas{animation:cpIn .42s cubic-bezier(.2,1.3,.4,1) both}
@keyframes cpWait{from{opacity:.3;transform:scale(.9)}to{opacity:.85;transform:scale(1)}}@keyframes cpIn{from{opacity:0;transform:translateY(6px) scale(.86)}}
.cc .flip .front .pm>.cpic{margin:0 auto}.lvh .pm{display:block;flex:0 0 auto}.rrow .pm>.cpic,.lvh .pm>.cpic{border-radius:inherit}
@media (prefers-reduced-motion:reduce){.cpic.wait::after,.cpic.in>canvas{animation:none}}body.red .cpic.wait::after,body.red .cpic.in>canvas{animation:none}`;document.head.appendChild(st);}
