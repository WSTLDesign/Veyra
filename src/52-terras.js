// ===== VEYRA – Terras: tierhafte Neuauflage der Kreaturen-Modelle (Agent Terras · Opus hoch · 12.11.) =====
// Leitziel (docs/ziele.md, Ziel 4): moderner, deutlich tierhafter. Jede Art hat eine echte Tierbasis (docs/terras.md).
// Technik: EIN gehäuteter Körper je Kreatur (SkinnedMesh; Gelenk-Gruppen = Knochen) + Umriss + Augen → wenige Draw-Calls.
// Formen als „Lofts“ (Querschnitte entlang einer Kurve: Rumpf, Hals, Schädel→Schnauze, Glieder, Schwanz) mit Fellzeichnung als Vertex-Farbe.
// Einstieg: buildMon3D(id) → buildTerra(id), wenn TERRA[id] existiert; animMon → taGait (Gangarten). Arten ohne Eintrag bleiben unverändert.

// ---------- Proportionen je Entwicklungsstufe: Kopf, Beine, Rumpf, Masse, Augen, Ohren, Pfoten, Hals ----------
const TA_STG={1:{h:1.32,l:.76,b:.82,m:1.02,e:1.1,ear:1.18,paw:1.15,n:.72},2:{h:1.08,l:1,b:1,m:1,e:1,ear:1.04,paw:1,n:1},3:{h:.94,l:1.1,b:1.12,m:1.12,e:.88,ear:.95,paw:1.02,n:1.14}};
// ---------- Geometrie ----------
// Porträt-Qualität (Fortsetzung 15:30): TA_HQ=1 nur beim Rendern der Dex-/Team-Bilder → feinere Lofts/Kugeln, keine Facetten; Spielmodelle bleiben ≤ 6 k Dreiecke
let TA_HQ=0;
function taEll(){return TA_HQ?gc('taEh',()=>new THREE.SphereGeometry(1,20,14)):gc('taE',()=>new THREE.SphereGeometry(1,10,7));}
function taEllLo(){return TA_HQ?gc('taElh',()=>new THREE.SphereGeometry(1,14,10)):gc('taEl',()=>new THREE.SphereGeometry(1,7,5));}
function taEllT(){return gc('taEt',()=>new THREE.SphereGeometry(1,5,3));}
function taEyeGeo(fl){return gc('taEye'+fl+(TA_HQ?'h':''),()=>{const g=new THREE.SphereGeometry(1,TA_HQ?24:11,TA_HQ?16:8),p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,.5+p.getX(i)*.5*fl,.5+p.getY(i)*.5);return g;});}
// Loft: Stationen [x,y,z,rx,ry] → glatte Röhre mit elliptischem Querschnitt. o: seg (Umfang), k (Ringe je Abschnitt), up (Bezug „oben“),
// c0/c1 (Kappen 0 = flach … 1 = halbrund), c (Grundfarbe), z = Zeichnung [[farbe, t0, t1, |a|0, |a|1], …] (t entlang, a = Winkel, 0 = oben/vorn)
function taLoft(S,o){o=o||{};const key='TL'+(TA_HQ?'h':'')+JSON.stringify([S,o.seg,o.k,o.up,o.c0,o.c1,o.c,o.z,o.cr]).replace(/(\.\d{3})\d+/g,'$1');
 return gc(key,()=>{const seg=Math.round((o.seg||10)*(TA_HQ?1.8:1)),ns=S.length,V=S.map(s=>new THREE.Vector3(s[0],s[1],s[2])),RR=S.map(s=>new THREE.Vector3(s[3],s[4],0)),
  cv=ns>2?new THREE.CatmullRomCurve3(V,false,'catmullrom',.5):null,cr=ns>2?new THREE.CatmullRomCurve3(RR,false,'catmullrom',.5):null,N=Math.max(2,(ns-1)*(o.k||3)*(TA_HQ?2:1)+1),
  upR=new THREE.Vector3().fromArray(o.up||[0,1,0]),alt=new THREE.Vector3(0,0,-1),pos=[],col=[],tt=[],idx=[],cc=new THREE.Color(),Z=o.z||[],CR=o.cr||[1];
  const zc=(t,a)=>{const A=Math.abs(a);for(const z of Z)if(t>=z[1]&&t<=z[2]&&A>=z[3]&&A<=z[4])return z[0];return o.c||'#ffffff';};
  const fr=u=>{const P=cv?cv.getPoint(u):V[0].clone().lerp(V[1],u),T=cv?cv.getTangent(u).normalize():V[1].clone().sub(V[0]).normalize(),r=cr?cr.getPoint(u):RR[0].clone().lerp(RR[1],u);
   const sd=new THREE.Vector3().crossVectors(T,upR);if(sd.lengthSq()<.05)sd.crossVectors(T,alt);sd.normalize();return{P,T,sd,up:new THREE.Vector3().crossVectors(sd,T).normalize(),rx:Math.max(.0006,r.x),ry:Math.max(.0006,r.y)};};
  const ring=(F,back,sc,t)=>{const b=pos.length/3;for(let j=0;j<seg;j++){const a=j/seg*Math.PI*2,sa=Math.sin(a),ca=Math.cos(a);
    pos.push(F.P.x+F.T.x*back+(F.sd.x*sa*F.rx+F.up.x*ca*F.ry)*sc,F.P.y+F.T.y*back+(F.sd.y*sa*F.rx+F.up.y*ca*F.ry)*sc,F.P.z+F.T.z*back+(F.sd.z*sa*F.rx+F.up.z*ca*F.ry)*sc);
    cc.set(zc(t,a>Math.PI?a-Math.PI*2:a));col.push(cc.r,cc.g,cc.b);tt.push(t);}return b;};
  const pole=(F,back,t)=>{pos.push(F.P.x+F.T.x*back,F.P.y+F.T.y*back,F.P.z+F.T.z*back);cc.set(zc(t,Math.PI/2));col.push(cc.r,cc.g,cc.b);tt.push(t);return pos.length/3-1;};
  const F0=fr(0),F1=fr(1),c0=o.c0??1,c1=o.c1??1,r0=(F0.rx+F0.ry)/2,r1=(F1.rx+F1.ry)/2,R=[];
  const p0=pole(F0,-r0*c0,0);CR.slice().reverse().forEach(k=>{const f=k/(CR.length+1)*Math.PI/2;R.push(ring(F0,-r0*Math.sin(f)*c0,Math.cos(f),0));});
  for(let i=0;i<N;i++){const u=i/(N-1);R.push(ring(i?i===N-1?F1:fr(u):F0,0,1,u));}
  CR.forEach(k=>{const f=k/(CR.length+1)*Math.PI/2;R.push(ring(F1,r1*Math.sin(f)*c1,Math.cos(f),1));});const p1=pole(F1,r1*c1,1);
  for(let j=0;j<seg;j++){const j1=(j+1)%seg;idx.push(R[0]+j,p0,R[0]+j1);idx.push(R[R.length-1]+j,R[R.length-1]+j1,p1);}
  for(let r=0;r<R.length-1;r++)for(let j=0;j<seg;j++){const j1=(j+1)%seg,a=R[r]+j,an=R[r]+j1,b=R[r+1]+j,bn=R[r+1]+j1;idx.push(a,an,b,an,bn,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('tt',new THREE.Float32BufferAttribute(tt,1));g.setIndex(idx);g.computeVertexNormals();return g;});}
// Teile-Liste (niedrig aufgelöst); Flags: n() = ohne Umriss, p(k) = Oberflächenmuster (1 Schuppen, 2 Panzerbänder, 3 Federn)
function taPL(){const L=[],fl=f=>{const e=L[L.length-1];if(e)e[3]=Object.assign({},e[3],f);return L;};
 L.s=(p,s,c,r,lo)=>{L.push([lo?taEllLo():taEll(),mtx(p,r,s),c]);return L;};L.t=(pts,rad,c,rs)=>{const n=pts.length,ri=u=>{const f=u*(rad.length-1),i=Math.min(rad.length-2,Math.floor(f)),t=f-i;return rad[i]+(rad[i+1]-rad[i])*t;};
  L.push([taLoft(pts.map((q,i)=>{const r=Math.max(.002,ri(n>1?i/(n-1):0));return[q[0],q[1],q[2],r,r];}),{seg:Math.min(rs||6,6),k:n>4?1:2,c:c||'#ffffff',c0:.6,c1:.6}),I4,null]);return L;};
 L.g=(g,m,c)=>{L.push([g,m||I4,c]);return L;};L.l=(S,o)=>{L.push([taLoft(S,o),I4,null]);return L;};L.lb=(S,o,bw)=>{L.push([taLoft(S,o),I4,null,{bw}]);return L;};L.n=()=>fl({nol:1});L.p=k=>fl({pat:k});return L;}
// ---------- Material: Cel 2-stufig (monGrad) + Knochen + prozedurales Muster im Shader ----------
const TA_PAT='if(vPat>.5){float k=1.;vec3 q=vOP*uPF;\nif(vPat<1.5){vec2 p=vec2(q.z+q.x*.55,q.y*1.3);p.x+=.5*floor(p.y);vec2 f=vec2(fract(p.x)-.5,fract(p.y));float d=length(f*vec2(1.,1.2));k=1.-.17*smoothstep(.4,.47,d)*(1.-smoothstep(.56,.62,d));}\n'+
 'else if(vPat<2.5){float b=fract(q.z*.42);k=1.-.22*smoothstep(.8,.86,b)*(1.-smoothstep(.94,.99,b));}\nelse{vec2 p=vec2(q.x*.8+q.z*.8,q.y*1.1);p.x+=.5*floor(p.y);vec2 f=vec2(fract(p.x)-.5,fract(p.y)-.15);k=1.+.09*(1.-smoothstep(.28,.46,length(f)))-.08*smoothstep(.5,.56,length(f));}\ngl_FragColor.rgb*=k;}';
function taMat(hl,em,ei){const m=celMat(hl,em,ei),ob=m.onBeforeCompile;m.skinning=true;
 m.onBeforeCompile=sh=>{ob(sh);sh.uniforms.uPF={value:30};sh.fragmentShader=sh.fragmentShader.replace('vec3(.84,.84,.97)','vec3(.98,.86,.83)');// warmer Schattenton (Fortsetzung 15:30): Creme/Weiß wird nicht mehr lila-grau
 sh.vertexShader='attribute float pat;\nvarying float vPat;\nvarying vec3 vOP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPat=pat;vOP=position;');
  sh.fragmentShader='uniform float uPF;\nvarying float vPat;\nvarying vec3 vOP;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n'+TA_PAT);};
 m.customProgramCacheKey=()=>'tcel2';return m;}
// Umriss mit Knochen (Rückseiten, im Bildraum gleichmäßig)
function taOl(col){const k='taol'+col;if(M3.mats[k])return M3.mats[k];const m=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{c:{value:new THREE.Color(col)}},
 vertexShader:'#include <common>\n#include <skinning_pars_vertex>\nvoid main(){\n#include <skinbase_vertex>\n#include <begin_vertex>\n#include <beginnormal_vertex>\n#include <skinnormal_vertex>\n#include <skinning_vertex>\nvec4 mv=modelViewMatrix*vec4(transformed,1.);vec3 n=normalize(normalMatrix*objectNormal);mv.xyz+=n*clamp(-mv.z*.0046,.0032,.048);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 c;void main(){gl_FragColor=vec4(c,1.);}'});m.skinning=true;return M3.mats[k]=m;}
// Alle Teile → ein Körper je Material (Knochen-Index je Teil), Umriss-Geometrie ohne Kleinteile
function taMergeSkin(list,ol){const P=[],N=[],C=[],A=[],SI=[],SW=[],I=[],v=new THREE.Vector3(),nm=new THREE.Matrix3(),cc=new THREE.Color();let o=0;
 const bw=(K,t,out)=>{let w=[1],ix=[K[0][1]];for(let j=1;j<K.length;j++){const s=Math.max(0,Math.min(1,(t-(K[j][0]-.045))/.09)),e=s*s*(3-2*s);w=w.map(x=>x*(1-e));w.push(e);ix.push(K[j][1]);}
  const o=w.map((x,i)=>[x,ix[i]]).sort((a,b)=>b[0]-a[0]);out[0]=o[0][1];out[1]=o[1]?o[1][1]:0;out[2]=o[0][0];out[3]=o[1]?o[1][0]:0;const s=out[2]+out[3];out[2]/=s;out[3]/=s;},WB=[0,0,1,0];
 for(const[g,m,col,f,b]of list){if(ol&&f&&f.nol)continue;const p=g.attributes.position,n=g.attributes.normal,ca=g.attributes.color,ta=g.attributes.tt;nm.getNormalMatrix(m);if(col)cc.set(col);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);
   if(!ol){if(col)C.push(cc.r,cc.g,cc.b);else if(ca)C.push(ca.getX(i),ca.getY(i),ca.getZ(i));else C.push(1,1,1);A.push(f&&f.pat||0);}if(f&&f.bi&&ta){bw(f.bi,ta.getX(i),WB);SI.push(WB[0],WB[1],0,0);SW.push(WB[2],WB[3],0,0);}else{SI.push(b,0,0,0);SW.push(1,0,0,0);}}
  if(g.index)for(let i=0;i<g.index.count;i++)I.push(g.index.getX(i)+o);else for(let i=0;i<p.count;i++)I.push(i+o);o+=p.count;}
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 if(!ol){G.setAttribute('color',new THREE.Float32BufferAttribute(C,3));G.setAttribute('pat',new THREE.Float32BufferAttribute(A,1));}
 G.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));G.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));G.setIndex(I);G.computeBoundingBox();G.computeBoundingSphere();return G;}
function taSkin(X,LS){const{U,bd}=X;U.root.updateMatrixWorld(true);const inv=bd.matrixWorld.clone().invert(),bones=[],bi=new Map(),P={0:[],MG:[]},reg=g=>{if(!bi.has(g)){bi.set(g,bones.length);bones.push(g);}return bi.get(g);};
 for(const n in LS){const q=LS[n];if(!q.L.length||!q.par)continue;const b=reg(q.par),rel=inv.clone().multiply(q.par.matrixWorld);
  q.L.forEach(it=>{let f=it[3];if(f&&f.bw)f=Object.assign({},f,{bi:f.bw.map(([t,g])=>[t,reg(g)])});P[q.mat==='MG'?'MG':0].push([it[0],rel.clone().multiply(it[1]),it[2],f,b]);});}
 const sk=new THREE.Skeleton(bones),add=(g,m)=>{const s=new THREE.SkinnedMesh(g,m);bd.add(s);s.bind(sk);s.frustumCulled=false;return s;};
 const mB=add(gc(X.ck+'skB',()=>taMergeSkin(P[0])),U.MB);mB.castShadow=true;mB.receiveShadow=true;U.skin=mB;
 if(P.MG.length){const mG=add(gc(X.ck+'skG',()=>taMergeSkin(P.MG)),U.MG);mG.castShadow=true;}
 const ol=add(gc(X.ck+'skO',()=>taMergeSkin(P[0].concat(P.MG),1)),taOl(mixC(shade(X.C.a,.22),'#1a1420',.45)));ol.userData.ol=1;U.ols=[ol];U.bones=bones.length;}
// Rumpf-Oberfläche (für Flecken, Platten, Moos): z entlang, a Winkel (0 oben)
function taSurf(S){return(z,a)=>{let i=0;const Z=S.map(s=>s[2]),asc=Z[0]<Z[Z.length-1];const f=k=>asc?Z[k]:-Z[k];while(i<S.length-2&&f(i+1)<(asc?z:-z))i++;
 const p=S[i],q=S[i+1],t=Math.max(0,Math.min(1,((asc?z:-z)-f(i))/((f(i+1)-f(i))||1))),rx=p[3]+(q[3]-p[3])*t,ry=p[4]+(q[4]-p[4])*t,cy=p[1]+(q[1]-p[1])*t,sa=Math.sin(a),ca=Math.cos(a);
 const n=new THREE.Vector3(sa/rx,ca/ry,0).normalize();return[[sa*rx,cy+ca*ry,z],[n.x,n.y,n.z]];};}
// ---------- Köpfe: Schädel → Schnauze als ein Loft, Nase, Unterkiefer, Augen-Anker, Ohren ----------
const TA_H={
 canine:{ml:.9,mw:.33,mh:.27,md:.26,tip:.42,ck:1,ex:.46,eh:.3,er:.31,ear:[.5,.56,.16],nose:'#2b1d26',jaw:1},
 feline:{ml:.2,mw:.42,mh:.3,md:.34,ck:1.16,ex:.42,eh:.22,er:.27,tip:.6,ear:[.56,.56,.12],nose:'#d9798a',jaw:1,wh:1},
 ursine:{ml:.58,mw:.4,mh:.34,md:.3,ck:1.06,ex:.42,eh:.3,er:.27,ear:[.62,.6,.16],nose:'#2b1d26',jaw:1},
 otter:{ml:.4,mw:.5,mh:.34,md:.3,ck:1.02,ex:.5,eh:.32,er:.3,ear:[.74,.32,.2],nose:'#3a2630',wh:1,jaw:1},
 rodent:{ml:.5,mw:.46,mh:.4,md:.24,ck:1.1,ex:.72,eh:.24,er:.3,ear:[.52,.6,.22],nose:'#d07a8a',wh:1,inc:1,jaw:1},
 lago:{ml:.42,mw:.46,mh:.42,md:.28,ck:1.04,ex:.82,eh:.26,er:.33,ear:[.26,.78,.26],nose:'#d07a8a',wh:1,jaw:1},
 armadillo:{ml:1.05,mw:.26,mh:.22,md:.26,ck:.92,ex:.78,eh:.2,er:.24,ear:[.42,.52,.36],nose:'#3a2a2a',jaw:1},
 reptile:{ml:.66,mw:.58,mh:.28,md:.12,ck:1,cy:.74,ex:.7,eh:.4,er:.33,jaw:1,brow:1},
 amphib:{ml:.42,mw:.78,mh:.3,md:.1,ck:1.12,cy:.68,ex:.62,eh:.48,er:.33,jaw:1},
 tortoise:{ml:.36,mw:.5,mh:.44,md:.14,ck:.95,ex:.62,eh:.26,er:.32,beak:1,jaw:1},
 seal:{ml:.36,mw:.58,mh:.44,md:.22,ck:1.06,ex:.46,eh:.26,er:.34,nose:'#23304f',wh:1,jaw:1},
 owl:{ml:.12,mw:.3,mh:.3,md:.08,ck:1.12,cy:1,ex:.32,eh:.12,er:.36,owl:1},
 bird:{ml:.12,mw:.32,mh:.3,md:.06,ck:1,cy:1,ex:.78,eh:.22,er:.33,bird:1},
 oarfish:{ml:.5,mw:.3,mh:.5,md:.05,ck:.85,cy:1.05,ex:.85,eh:.25,er:.3,jaw:1}};
function taHead(X,H,R,kind){const{U,C,T}=X,h=TA_H[kind],mk=T.mk||{},cr=h.cy||1,ml=h.ml,L=X.L('head',H),fc=mk.face,fC=mk.faceC||C.b;X.H=H;X.hr=R;X.top=[0,R*.84*cr,0];
 const z=[];if(fc==='mask')z.push([fC,.42,1,1.7,9]);else if(fc==='muzzle')z.push([fC,.62,1,0,9]);else if(fc==='blaze'){z.push([fC,.46,1,1.45,9],[fC,.3,1,0,.26]);}else if(fc==='chin')z.push([fC,.55,1,2.2,9]);else if(fc==='disc')z.push([fC,.3,1,0,1.25]);else if(fc==='cap')z.push(['#ffffff',.38,.8,1.25,2.2],[C.b,0,1,0,1.25],[C.b,.5,1,2.2,9]);
 const nzT=-R*(.52+ml);
 L.l([[0,R*.04,R*.6,R*.4,R*.4*cr],[0,R*.04,R*.28,R*.9,R*.84*cr],[0,0,-R*.12,R*.94*h.ck,R*.82*cr],[0,-R*h.md*.5,-R*.5,R*(h.mw+.12),R*(h.mh+.12)],[0,-R*h.md,-R*(.5+ml*.55),R*h.mw*.9,R*h.mh*.86],[0,-R*h.md*.92,nzT,R*h.mw*(h.tip||.5),R*h.mh*.6]],
  {seg:18,k:2,c:C.a,z,c0:1,c1:h.beak?.4:.75,cr:[1,2]});
 X.mz=[0,-h.md-.2,-(.5+ml)];X.nose=[0,-R*h.md*.92+R*h.mh*.3,nzT-R*.02];
 if(h.nose&&!h.owl&&!h.bird)L.s(X.nose,[R*h.mw*.3,R*h.mw*.19,R*h.mw*.2],mk.nose||h.nose,0,1);
 if(h.jaw){const J=grp(H,0,-R*h.md-R*h.mh*.48,-R*.32);J.userData.r0=0;X.L('jaw',J).l([[0,R*.04,R*.04,R*.3,R*.14],[0,0,-R*(ml*.55+.12),R*h.mw*.62,R*h.mh*.3],[0,R*.02,-R*(ml*.9+.14),R*h.mw*.36,R*h.mh*.2]],{seg:7,k:1,c:mk.jaw||(fc&&fc!=='disc'?fC:C.a),c0:.5,c1:.7});
  L.s([0,-R*h.md-R*h.mh*.3,-R*(.38+ml*.5)],[R*h.mw*.5,R*h.mh*.26,R*(ml*.4+.12)],'#7a2a3a',0,1).n();X.L('jaw',J).s([0,R*.05,-R*(ml*.4+.1)],[R*h.mw*.4,R*h.mh*.12,R*(ml*.3+.08)],'#e8798a',0,1).n();U.beak=J;}
 if(h.beak){X.L('jaw',U.beak).s([0,-R*.02,-R*(ml*.92+.12)],[R*h.mw*.5,R*h.mh*.3,R*.14],C.bk);L.s([0,-R*h.md,nzT+R*.05],[R*h.mw*.6,R*h.mh*.5,R*.16],C.bk);}
 if(h.inc)[-1,1].forEach(s=>L.s([s*R*.06,-R*h.md-R*h.mh*.62,nzT+R*.1],[R*.06,R*.12,R*.035],'#fffaf0').n());
 if(h.wh)[-1,1].forEach(s=>[0,1,2].forEach(j=>L.t([[s*R*h.mw*.55,-R*h.md+R*h.mh*.05-j*R*.06,nzT+R*.18],[s*R*(h.mw+.42),-R*h.md+R*h.mh*.12-j*R*.1,nzT+R*.32],[s*R*(h.mw+.82),-R*h.md+R*h.mh*.04-j*R*.17,nzT+R*.52]],[R*.018,R*.012,R*.006],mk.wh||'#fff8ee',3).n()));
 if(h.brow)[-1,1].forEach(s=>L.s([s*R*.5,R*.42*cr,-R*.42],[R*.3,R*.12,R*.34],C.a,[0,0,s*.2]));
 // Augen-Anker auf der Kopf-Ellipse (Blickwinkel ex von vorn, Höhe eh)
 const S=TA_STG[X.stage],er=R*h.er*S.e*(X.K.eye||1),rx=R*.94*h.ck,ry=R*.82*cr,rz=R*.86;X.eyes=[-1,1].map(s=>{const d=[s*Math.sin(h.ex)*Math.cos(h.eh),Math.sin(h.eh),-Math.cos(h.ex)*Math.cos(h.eh)],t=1/Math.sqrt(d[0]*d[0]/rx/rx+d[1]*d[1]/ry/ry+d[2]*d[2]/rz/rz);
  return h.owl?{s,p:[s*R*.36,R*.1,-R*.66],ry:-s*.28,rx:.05,er}:{s,p:d.map(v=>v*t*.86),ry:-s*h.ex,rx:h.eh*.5,er};});
 if(h.owl){L.l([[0,0,-R*.5,R*.88,R*.8],[0,-R*.02,-R*.64,R*.76,R*.68]],{seg:12,k:1,c:mk.disc||C.b,c0:.2,c1:.15});}
 return H;}
// Ohren: Loft entlang +y, Innenseite (vorn) farbig, Spitze optional dunkel
const TA_EAR={tall:[1.2,.4,.3],cat:[.78,.42,.3],round:[.42,.3,.65],mouse:[.6,.46,.4],small:[.2,.2,.9],lop:[1.5,.34,0],long:[1.85,.3,.12],tallRound:[.92,.34,.25]};
function taEars(X,type,hk){if(!type||type==='none')return;const{U,C,T}=X,R=X.hr,h=TA_H[hk]||TA_H.canine,e=h.ear||[.5,.6,.15],k=TA_EAR[type],mk=T.mk||{},S=TA_STG[X.stage],f=S.ear*(X.K.ear||1),Le=R*k[0]*f,w=R*k[1]*f;
 [-1,1].forEach((s,i)=>{const g=grp(X.H,s*R*e[0],R*e[1],R*e[2]);let rz=-s*k[2],rx=-.16;if(type==='lop'){rz=-s*.15;rx=.1;}g.rotation.set(rx,0,rz);g.userData.rz0=rz;
  const z=[[mk.earIn||C.p,0,.86,0,1.15]];if(mk.earTip)z.unshift([mk.earTip,.66,1,0,9]);const E=X.L('ear'+i,g);
  if(type==='round'||type==='mouse'||type==='small')E.l([[0,0,0,w,w*.42],[0,Le*.55,0,w,w*.36],[0,Le,0,w*.5,w*.2]],{seg:6,k:1,c:C.a,z,c0:.3,c1:1});
  else if(type==='lop')E.l([[0,0,0,w*.7,w*.35],[s*Le*.25,Le*.35,0,w*.95,w*.3],[s*Le*.55,Le*.42,0,w,w*.28],[s*Le*.8,Le*.2,0,w*.75,w*.22],[s*Le*.88,-Le*.05,0,w*.4,w*.15]],{seg:6,k:1,c:C.a,z:[[mk.earIn||C.p,.2,.9,2,9]],up:[0,0,-1],c0:.3,c1:1});
  else E.l([[0,0,0,w,w*.42],[0,Le*.42,-Le*.04,w*.9,w*.36],[0,Le*.78,-Le*.03,w*.5,w*.22],[0,Le,0,w*.08,w*.06]],{seg:6,k:1,c:C.a,z,c0:.3,c1:.4});
  U.ears.push(g);});}
// ---------- Vierbeiner-Baukasten ----------
// Grundmaße (Stufe 2): L Schulter–Hüfte, dep Rumpftiefe, wid halbe Breite, waist/rump/chest Querschnitt-Faktoren, nl/na/nr Hals, hs Schädelradius,
// lf/lh Beinlängen vorn/hinten, lr Beinradius, paw Pfotengröße, st Stand (digi = Zehengänger, planti = Sohlengänger, hop = Hase, sprawl = Echse, tort = Schildkröte)
const TA_Q={
 canine:{L:.42,dep:.26,wid:.13,waist:.76,rump:.94,chest:1.08,nl:.19,na:.95,nr:.078,hs:.155,hk:'canine',ear:'tall',st:'digi',lf:.35,lh:.37,lr:.04,paw:.062},
 feline:{L:.44,dep:.24,wid:.125,waist:.84,rump:1.02,chest:.98,nl:.12,na:.78,nr:.074,hs:.15,hk:'feline',ear:'cat',st:'digi',lf:.28,lh:.32,lr:.038,paw:.06},
 ursine:{L:.42,dep:.36,wid:.19,waist:.96,rump:1,chest:1.04,nl:.1,na:.35,nr:.12,hs:.17,hk:'ursine',ear:'round',st:'planti',lf:.3,lh:.29,lr:.058,paw:.085,hump:1},
 mustelid:{L:.5,dep:.21,wid:.13,waist:.92,rump:1.06,chest:.94,nl:.12,na:.55,nr:.08,hs:.13,hk:'otter',ear:'small',st:'planti',lf:.17,lh:.2,lr:.036,paw:.066},
 rodent:{L:.3,dep:.27,wid:.15,waist:1.06,rump:1.16,chest:.88,nl:.04,na:.5,nr:.1,hs:.14,hk:'rodent',ear:'mouse',st:'planti',lf:.13,lh:.17,lr:.03,paw:.055},
 lagomorph:{L:.3,dep:.27,wid:.14,waist:1.02,rump:1.18,chest:.86,nl:.06,na:1.1,nr:.08,hs:.14,hk:'lago',ear:'long',st:'hop',lf:.2,lh:.5,lr:.03,paw:.05},
 armadillo:{L:.4,dep:.3,wid:.17,waist:1.04,rump:1.05,chest:.96,nl:.06,na:.3,nr:.08,hs:.12,hk:'armadillo',ear:'tallRound',st:'planti',lf:.16,lh:.18,lr:.036,paw:.06},
 reptile:{L:.42,dep:.17,wid:.12,waist:.95,rump:.95,chest:1,nl:.08,na:.3,nr:.07,hs:.13,hk:'reptile',ear:'none',st:'sprawl',spr:1.15,lf:.22,lh:.24,lr:.03,paw:.06,yo:.05},
 amphibian:{L:.36,dep:.15,wid:.12,waist:1,rump:.95,chest:1,nl:.04,na:.2,nr:.075,hs:.13,hk:'amphib',ear:'none',st:'sprawl',spr:1.2,lf:.17,lh:.19,lr:.028,paw:.055,yo:.05},
 tortoise:{L:.3,dep:.3,wid:.2,waist:1,rump:1,chest:1,nl:.13,na:.3,nr:.06,hs:.125,hk:'tortoise',ear:'none',st:'sprawl',spr:.7,lf:.15,lh:.15,lr:.05,paw:.075,shell:1,toes:3}};
const TA_ST={digi:{F:{f:[.4,.42,.18],a:[-.42,.05,.32]},H:{f:[.36,.4,.24],a:[.64,-.62,.12]}},planti:{F:{f:[.47,.43,.1],a:[-.2,.06,.12]},H:{f:[.46,.42,.12],a:[.32,-.22,.1]}},
 hop:{F:{f:[.46,.42,.12],a:[-.12,.06,.22]},H:{f:[.36,.36,.28],a:[1.2,-1.45,1.42]}}};
const TA_GAIT={canine:'quad',feline:'quad',ursine:'quad',mustelid:'quad',rodent:'quad',armadillo:'quad',lagomorph:'hop',reptile:'sprawl',amphibian:'sprawl',tortoise:'sprawl',seal:'seal',owl:'bird',bird:'bird',jelly:'jelly',ribbon:'ribbon'};
function taChainH(D,len){let y=0,z=0;D.f.forEach((f,i)=>{y+=len*f*Math.cos(D.a[i]);z-=len*f*Math.sin(D.a[i]);});return[y,z];}
// Bein: Gelenk-Gruppen (Knochen) Oberarm/Schenkel → Unterarm/Unterschenkel → Mittelfuß → Pfote; EIN Loft über alle Glieder, Gewichte an Knie/Sprunggelenk weich verblendet
function taLeg(X,J,D,len,o){const{U}=X,s=o.s,key='lg'+o.i,sp=o.spr,g=[];const g0=grp(X.bd,J[0],J[1],J[2]);let P=[[0,0,0]],last;
 if(sp){g0.rotation.z=s*sp;const l0=len*.5,l1=len*.62,g1=grp(g0,0,-l0,0);g1.rotation.z=-s*sp;g.push(g0,g1);const th=-s*sp,d1=[Math.sin(th),-Math.cos(th),0];
  P=[[0,o.r0*.4,0],[0,-l0*.5,0],[0,-l0,0],[d1[0]*l1*.5,-l0+d1[1]*l1*.5,0],[d1[0]*l1,-l0+d1[1]*l1,0]];last=[g1,l1];
  X.L(key,g0).lb(P.map((q,i)=>[q[0],q[1],q[2],[o.r0,o.r0*.95,o.r1,o.r1*.9,o.r2][i],[o.r0,o.r0*.95,o.r1,o.r1*.9,o.r2][i]*1.05]),{seg:6,k:1,up:[0,0,-1],c:o.col[0],z:o.col[2]!==o.col[0]?[[o.col[2],.55,1,0,9]]:[],c0:.7,c1:.6},[[0,g0],[.5,g1]]);}
 else{const l=D.f.map(f=>len*f),g1=grp(g0,0,-l[0],0),g2=grp(g1,0,-l[1],0);g0.rotation.x=D.a[0];g1.rotation.x=D.a[1]-D.a[0];g2.rotation.x=D.a[2]-D.a[1];g.push(g0,g1,g2);
  const t1=g1.rotation.x,t2=t1+g2.rotation.x,P1=[0,-l[0],0],P2=[0,P1[1]-Math.cos(t1)*l[1],-Math.sin(t1)*l[1]],P3=[0,P2[1]-Math.cos(t2)*l[2],P2[2]-Math.sin(t2)*l[2]],mid=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*(k??.5));
  P=[[0,o.r0*.45,0],mid([0,0,0],P1,.45),P1,mid(P1,P2),P2,mid(P2,P3),P3];const R=[o.r0,o.r0*.92,o.r1*1.02,o.r1*.86,o.r2*.95,o.r2*.88,o.r2*.86];last=[g2,l[2]];
  const z=[];if(o.col[2]!==o.col[0])z.push([o.col[2],o.col[1]!==o.col[0]?.3:.62,1,0,9]);
  X.L(key,g0).lb(P.map((q,i)=>[q[0],q[1],q[2],R[i]*(i===0?1:.96),R[i]]),{seg:6,k:1,up:[0,0,-1],c:o.col[0],z,c0:.7,c1:.5},[[0,g0],[2/6,g1],[4/6,g2]]);}
 g.forEach(q=>{q.userData.r0=q.rotation.x;q.userData.z0=q.rotation.z;});
 if(o.mus)X.L(key+'m',g0).s([0,-len*D.f[0]*.28,o.front?o.r0*.1:o.r0*.3],[o.r0*o.mus,len*D.f[0]*.42,o.r0*o.mus*1.12],o.col[0],0,1);
 const gp=grp(last[0],0,-last[1],0);if(!sp)gp.rotation.x=-D.a[2];gp.userData.r0=gp.rotation.x;g.push(gp);
 const Pw=X.L(key+'p',gp),pw=o.paw,ph=o.pawH,pc=o.col[3];Pw.s([0,-ph*.5,-pw*.3],[pw*.6,ph*.56,pw*.92],pc,0,1);
 const nt=o.toes||0;for(let t=0;t<nt;t++){const x=(nt>1?t/(nt-1)-.5:0)*pw*(sp?1.3:.9),zt=-pw*(sp?1.2:1.05)+Math.abs(x)*(sp?.4:.35);
  Pw.g(taEllT(),mtx([x,-ph*.64,zt],[0,sp?x*4:0,0],[pw*(sp?.12:.19),ph*.36,pw*(sp?.4:.24)]),pc).n();
  if(o.claw)Pw.g(coneG(4),mtx([x*(sp?1.25:1),-ph*.7,zt-pw*(sp?.38:.2)],[-Math.PI/2+.25,0,0],[pw*.05,pw*.2,pw*.05]),o.claw).n();}
 const Lg={u:g[0],l:g[1],g:sp?[g[0],g[1],g[1],gp]:g,front:o.front,s,r:(sp?[g[0],g[1],g[1],gp]:g).map(q=>q.rotation.x),z:g.map(q=>q.rotation.z),spr:!!sp,len};U.legs.push(Lg);return Lg;}
// Schwanz: Kette aus Gliedern (Knochen) + EIN durchgehender Loft; Spitze für Merkmale in X.tip
function taTail(X,base,t){const{U,C}=X;if(!t||!t.n)return;const fl=t.flat||1,gs=[];let prev=grp(X.bd,base[0],base[1],base[2]);
 for(let i=0;i<t.n;i++){const g=i?grp(prev,0,t.L,0):prev;g.userData.rx0=i?t.curl:t.rx;g.rotation.x=g.userData.rx0;U.tail.push(g);gs.push(g);prev=g;}
 const P=[[0,-t.L*.18,0]];let A=0,q=[0,0,0];for(let i=0;i<=t.n;i++){P.push(q.slice());if(i<t.n){const L=i===t.n-1?t.L*1.04:t.L;q=[0,q[1]+Math.cos(A)*L,q[2]+Math.sin(A)*L];A+=t.curl;}}
 const ns=P.length,tk=i=>(i+1)/(ns-1),z=[];if(t.tip)z.push([t.tip,1-(t.tipF??.22),1,0,9]);if(t.cols)t.cols.forEach((c,i)=>{if(i<t.n)z.push([c,tk(i),tk(i+1),0,9]);});
 const R=[t.r[0]*.9].concat(t.r).map(v=>Math.max(.003,v));X.L('tail',gs[0]).lb(P.map((p,i)=>[p[0],p[1],p[2],R[i],R[i]*fl]),{seg:t.seg||7,k:1,c:C.a,z,c0:.5,c1:t.c1??1},gs.map((g,i)=>[i?tk(i):0,g]));
 if(t.pat)X.L('tail',gs[0]).p(t.pat);X.tip={par:prev,pos:[0,t.L*1.02,0]};}
function taQuad(X){const{U,C,K,T}=X,Q=Object.assign({},TA_Q[T.b],T.q||{}),S=TA_STG[X.stage],mk=T.mk||{};
 const L=Q.L*S.b*K.len,dep=Q.dep*S.m*K.w,wid=Q.wid*S.m*K.w,lr=Q.lr*S.m*K.w,R=Q.hs*S.h*K.h,paw=Q.paw*S.paw*(K.paw||1),pawH=paw*.42;let lf=Q.lf*S.l*K.l,lh=Q.lh*S.l*K.l;
 const sp=Q.st==='sprawl'?Q.spr:0,D=TA_ST[Q.st]||TA_ST.planti;
 const legY=(len,front)=>sp?len*(.5*Math.cos(sp)+.62)+pawH:taChainH(front?D.F:D.H,len)[0]+pawH;
 let sY=legY(lf,1),hY=legY(lh,0);const yo=Q.yo??.16,clr=Math.max(pawH*1.2,.02);
 const bot=()=>Math.min(hY+dep*yo-dep*.5*Q.rump,sY+dep*.1-dep*.5*Q.chest,(hY+sY)/2+dep*.06-dep*.5*Q.waist);
 if(!Q.shell&&bot()<clr){const k=(clr-bot())*1.05;lf*=(sY+k)/sY;lh*=(hY+k)/hY;sY=legY(lf,1);hY=legY(lh,0);}
 const yH=hY+dep*yo,yS=sY+dep*.1,yM=(yH+yS)/2+dep*.5*(1-Q.waist)*.55,zr=L/2,zf=-L/2;
 const TS=[[0,yH+dep*.06,zr+dep*.4*Q.rump,wid*Q.rump*.5,dep*.5*Q.rump*.48],[0,yH,zr+dep*.1,wid*Q.rump,dep*.5*Q.rump],[0,yM,0,wid*Q.waist,dep*.5*Q.waist],[0,yS,zf+dep*.04,wid*Q.chest,dep*.5*Q.chest],[0,yS+dep*.12,zf-dep*.24,wid*Q.chest*.74,dep*.5*Q.chest*.78]];
 if(Q.hump)TS[3][1]+=dep*.08;
 const z=[];if(mk.bib)z.push([mk.bibC||C.b,.66,1,mk.bib,9]);if(mk.belly)z.push([mk.bellyC||C.b,0,1,mk.belly,9]);if(mk.saddle)z.push([mk.saddle,.15,.85,0,.9]);
 const B=X.L('torso',X.bd);if(!Q.shell){B.l(TS,{seg:16,k:2,c:C.a,z,c0:.9,c1:.85});if(T.pat)B.p(T.pat);}
 X.surf=taSurf(TS);X.TS=TS;
 // Hals (eigener Knochen, senkt sich beim Grasen) + Kopf
 const nl=Q.nl*S.n*K.n,na=Q.na,nr=Q.nr*S.m*K.w*(X.stage===1?1.1:1),N=grp(X.bd,0,yS+dep*.18,zf-dep*.12),nt=[0,Math.sin(na)*nl,-Math.cos(na)*nl];N.userData.r0=0;U.neckG=N;
 X.L('neck',N).l([[0,-dep*.14,dep*.12,nr*1.7,nr*1.8],[0,nt[1]*.5,nt[2]*.5,nr*1.18,nr*1.28],[0,nt[1],nt[2],nr,nr*1.06]],{seg:8,k:1,c:C.a,z:mk.throat?[[mk.throatC||C.b,0,1,mk.throat,9]]:[],c0:.6,c1:.6});
 const H=grp(N,0,nt[1]+R*.16,nt[2]-R*.28);taHead(X,H,R,Q.hk);taEars(X,T.ear||Q.ear,Q.hk);
 // Beine
 const cs=mk.sock,sh=mk.sockH??1,lc=i=>i>=3?(cs&&sh>=0?cs:mk.pawC||C.a):cs&&i>=3-sh?cs:C.a;
 [[-1,1],[1,1],[-1,0],[1,0]].forEach(([s,front],i)=>{const len=front?lf:lh,J=front?[s*wid*(sp?.78:.6),sY,zf+dep*.02]:[s*wid*Q.rump*(sp?.8:.62),hY,zr];
  taLeg(X,J,front?D.F:D.H,len,{i,s,front:!!front,spr:sp,r0:lr*(front?1.25:1.45),r1:lr*1.0,r2:lr*.82,paw,pawH,toes:Q.toes??(sp?4:3),claw:Q.claw||(sp?shade(C.a,.6):0),mus:sp||Q.shell?0:front?1.3:1.6,col:[lc(0),lc(1),lc(2),lc(3)]});});
 // Schwanz
 const tl=Object.assign({},TA_TAIL[T.tail||Q.tail||'none']||{},T.tl||{});if(tl.n){tl.L=(tl.L||.1)*S.b*(K.t||1);tl.r=(tl.r||[]).map(v=>v*S.m*K.w);if(!tl.tip&&mk.tailTip)tl.tip=mk.tailTip;}
 taTail(X,[0,yH+dep*(tl.y??.26),zr+dep*.3*Q.rump],tl);
 if(Q.shell)taShell(X,TS,dep,wid,L,yH,yS);
 X.back=[[0,yS+dep*.48,-L*.32],[0,yM+dep*.46*Q.waist,0],[0,yH+dep*.48*Q.rump,L*.32]];X.sho=[0,yS+dep*.4,zf];X.neck=[0,N.position.y+nt[1]*.5,N.position.z+nt[2]*.5];X.nr=nr;X.r=wid;X.h=yM;X.len=L;X.dep=dep;
 U.hip=hY;U.legH=Math.min(hY,sY);U.dropH=Math.max(0,bot()-.004);U.gaitRate=Math.max(5.5,Math.min(12,7.2*Math.sqrt(.3/Math.max(.08,U.legH))))*(Q.st==='hop'?.8:Q.shell?.55:1);}
const TA_TAIL={brush:{n:4,L:.1,r:[.04,.085,.112,.108,.05],rx:.92,curl:-.2},long:{n:5,L:.085,r:[.026,.024,.022,.022,.02,.018],rx:1.25,curl:-.28},
 stub:{n:1,L:.05,r:[.04,.03],rx:1.6,curl:0},flat:{n:2,L:.1,r:[.035,.07,.06],rx:1.75,curl:.1,flat:.3},whip:{n:5,L:.09,r:[.022,.018,.014,.011,.008,.004],rx:1.75,curl:.18},
 otter:{n:3,L:.11,r:[.06,.05,.035,.01],rx:1.6,curl:.12},taper:{n:5,L:.09,r:[.06,.05,.04,.028,.018,.004],rx:1.75,curl:.08},puff:{n:1,L:.02,r:[.05,.05],rx:1.2,curl:0,c1:1},
 lizard:{n:5,L:.11,r:[.055,.045,.035,.025,.016,.004],rx:1.62,curl:.03},none:{}};
// Panzer (Schildkröte): Kuppel + Bauchplatte + Platten-Höcker
function taShell(X,TS,dep,wid,L,yH,yS){const{C,T}=X,SC=C.sh||C.a,B=X.L('shell',X.bd),y0=Math.min(yH,yS)+dep*.05,sw=wid*1.55,sl=L*.95+dep*.5,sh=dep*1.05,mk=T.mk||{};
 B.l([[0,y0+sh*.05,sl*.55,sw*.5,sh*.25],[0,y0+sh*.32,sl*.3,sw*.92,sh*.6],[0,y0+sh*.36,0,sw,sh*.72],[0,y0+sh*.32,-sl*.3,sw*.92,sh*.6],[0,y0+sh*.05,-sl*.55,sw*.5,sh*.25]],{seg:14,k:2,c:SC,c0:.4,c1:.4,z:[[mk.rim||C.d,0,1,1.7,9]]});
 B.s([0,y0-sh*.02,0],[sw*.9,sh*.14,sl*.5],mk.plastron||C.b);
 const sc=mk.scute||[mixC(SC,'#ffffff',.18),shade(SC,.9),mixC(SC,C.b,.3)];let k=0;
 [[0,0,.0,.32],[0,-.6,.2,.22],[0,.6,.2,.22],[1.1,0,.55,.2],[-1.1,0,.55,.2],[1.1,.65,.6,.17],[-1.1,.65,.6,.17],[1.1,-.65,.6,.17],[-1.1,-.65,.6,.17],[0,1.15,.55,.16],[0,-1.15,.55,.16]].forEach(([ax,az,el,s])=>{
  const a=ax,p=[Math.sin(a)*sw*el*1.02,y0+sh*.72-sh*el*el*.55+sh*.02,az*sl*.4];B.s(p,[sw*s,sh*s*.5,sl*s*.62],sc[k++%sc.length],[az*-.25,0,-a*.35],1);});
 X.shTop=[0,y0+sh*.74,0];X.back=[[0,y0+sh*.7,-sl*.25],[0,y0+sh*.76,0],[0,y0+sh*.7,sl*.25]];}
// ---------- Robbe (liegend, Vorderflossen, Schwanzflossen) ----------
function taSeal(X){const{U,C,K,T}=X,S=TA_STG[X.stage],w=K.w*S.m,L=.6*S.b*K.len,R=.155*S.h*K.h,mk=T.mk||{};
 const TS=[[0,.07,L*.62,.03*w,.025*w],[0,.1,L*.42,.085*w,.075*w],[0,.15,L*.12,.16*w,.14*w],[0,.19,-L*.16,.19*w,.18*w],[0,.23,-L*.36,.15*w,.15*w]];
 X.L('torso',X.bd).l(TS,{seg:16,k:2,c:C.a,z:[[mk.bellyC||C.b,0,1,mk.belly||2.0,9]],c0:.8,c1:.8});X.surf=taSurf(TS);X.TS=TS;
 const N=grp(X.bd,0,.24,-L*.36);N.userData.r0=0;U.neckG=N;const nt=[0,.11,-.06];X.L('neck',N).l([[0,-.06,.04,.14*w,.14*w],[0,nt[1]*.5,nt[2]*.5,.12*w,.12*w],[0,nt[1],nt[2],.1*w,.1*w]],{seg:10,k:2,c:C.a,z:[[mk.bellyC||C.b,0,1,2.1,9]],c0:.6,c1:.6});
 const H=grp(N,0,nt[1]+R*.1,nt[2]-R*.25);taHead(X,H,R,'seal');taEars(X,'small','seal');
 [-1,1].forEach((s,i)=>{const g=grp(X.bd,s*.13*w,.11,-L*.2);g.rotation.set(.2,0,s*.55);g.userData.rz0=g.rotation.z;
  X.L('fl'+i,g).l([[0,.02,0,.05*w,.03*w],[s*.03,-.08*w,-.03,.06*w,.022*w],[s*.05,-.16*w,-.02,.04*w,.014*w]],{seg:8,k:2,c:mk.flip||C.a,up:[0,0,-1],c0:.5,c1:1});U.arms.push({u:g,l:null,s});});
 const tg=grp(X.bd,0,.075,L*.6);tg.userData.rx0=1.5;tg.rotation.x=1.5;const F=X.L('fluke',tg);[-1,1].forEach(s=>F.l([[0,0,0,.03*w,.02*w],[s*.05*w,.08*w,0,.05*w,.012*w],[s*.09*w,.14*w,0,.035*w,.008*w]],{seg:8,k:2,c:mk.flip||C.a,up:[0,0,-1],c0:.5,c1:1}));U.tail.push(tg);
 X.back=[[0,.38,-L*.2],[0,.32,L*.08],[0,.22,L*.36]];X.sho=[0,.34,-L*.3];X.neck=[0,.3,-L*.4];X.nr=.12*w;X.r=.18*w;X.h=.16;X.len=L;X.tip={par:tg,pos:[0,.1,0]};
 U.hip=.12;U.legH=.12;U.dropH=0;U.gaitRate=5.2;}
// ---------- Vögel: Eule (aufrecht, Gesichtsschleier) · Singvogel (waagerecht, Gabelschwanz) ----------
const TA_B={owl:{by:.32,bh:.24,bw:.2,bd:.19,tilt:.12,hs:.21,leg:.1,wing:.34,tail:.12},song:{by:.26,bh:.17,bw:.13,bd:.2,tilt:.75,hs:.13,leg:.12,wing:.3,tail:.2}};
function taBird(X){const{U,C,K,T}=X,v=T.v||'owl',B=TA_B[v],S=TA_STG[X.stage],mk=T.mk||{},w=K.w*S.m,by=B.by*K.l*(X.stage===1?.85:1),bh=B.bh*w,bw=B.bw*w,R=B.hs*S.h*K.h;
 const body=grp(X.bd,0,by,0);body.rotation.x=-B.tilt;body.userData.r0=-B.tilt;U.torsoG=body;
 X.L('torso',body).l([[0,-bh*.95,B.bd*.25*w,bw*.35,bw*.3],[0,-bh*.55,B.bd*.08*w,bw*.9,bw*.85],[0,0,0,bw,B.bd*w],[0,bh*.6,-B.bd*.1*w,bw*.82,B.bd*.82*w],[0,bh*1.0,-B.bd*.12*w,bw*.6,B.bd*.6*w]],
  {seg:16,k:2,up:[0,0,-1],c:C.a,z:[[mk.chest||C.b,.08,.88,0,mk.chestA||1.15]],c0:.7,c1:.7});
 const N=grp(body,0,bh*.9,-B.bd*.1*w);N.rotation.x=B.tilt;N.userData.r0=B.tilt;U.neckG=N;const H=grp(N,0,R*(v==='owl'?.45:.62),-R*.05);taHead(X,H,R,v==='owl'?'owl':'bird');
 // Schnabel
 const bk=mk.beak||C.bk,bl=v==='owl'?R*.42:R*.62,hl=TA_H[v==='owl'?'owl':'bird'],zb=-R*(.52+hl.ml)+R*.02;X.L('head',H).l([[0,-R*.08,zb+R*.12,R*.13,R*.12],[0,-R*.16,zb-bl*.45,R*.08,R*.07],[0,-R*(v==='owl'?.34:.2),zb-bl*(v==='owl'?.62:1),R*.012,R*.012]],{seg:6,k:2,c:bk,c0:.4,c1:.3});
 // Beine mit Zehen (befiedert bei Eulen)
 [-1,1].forEach((s,i)=>{const g0=grp(body,s*bw*.45,-bh*.75,B.bd*.05);g0.rotation.x=B.tilt;g0.userData.r0=B.tilt;const lg=B.leg*K.l,g1=grp(g0,0,-lg*.3,0);g1.userData.r0=0;
  X.L('bl'+i,g0).s([0,-lg*.12,0],[bw*.32,lg*.32,bw*.34],v==='owl'?C.b:C.a);X.L('bl'+i,g1).l([[0,0,0,.016*w,.016*w],[0,-lg*.72,.005,.013*w,.013*w]],{seg:6,k:1,c:v==='owl'?(mk.leg||C.b):bk,up:[0,0,-1]});
  const ft=grp(g1,0,-lg*.72,0);ft.userData.r0=0;const F=X.L('bf'+i,ft);[-.45,0,.45].forEach(a=>F.l([[0,0,0,.012*w,.01*w],[Math.sin(a)*.05*w,-.008,-Math.cos(a)*.05*w,.009*w,.007*w]],{seg:5,k:1,c:bk,c0:.4,c1:.6}).n());
  F.l([[0,0,0,.01*w,.008*w],[0,-.006,.035*w,.008*w,.006*w]],{seg:5,k:1,c:bk}).n();U.legs.push({u:g0,l:g1,g:[g0,g1,ft],r:[g0.rotation.x,0,0],front:true,s,bird:1});});
 // Flügel (aufklappbar wie bisher: wR → wF → wP → Segmente), Federn als flache Fahnen
 const ws=B.wing*(K.ws||1)*w,wc=T.wc||[C.a,shade(C.a,.86),mk.wtip||shade(C.a,.7)];[-1,1].forEach(s=>{const wR=grp(body,s*bw*.92,bh*.45,-B.bd*.05),wF=grp(wR,0,0,0),wP=grp(wF,0,0,0),segs=[];let p=wP;
  [.45,.55].forEach((f,j)=>{const g=grp(p,j?s*ws*.45:0,0,0);segs.push(g);p=g;const Wl=X.L('w'+s+j,g),len=ws*f;Wl.l([[0,0,0,.03*w,.022*w],[s*len*.55,.004,0,.026*w,.018*w],[s*len*1.05,0,0,.016*w,.012*w]],{seg:6,k:1,c:wc[0],up:[0,0,-1],c0:.5,c1:.5});
   const nf=j?5:4;for(let k=0;k<nf;k++){const x=s*len*(k+.6)/nf,fl=(j?.2+k*.045:.16+k*.01)*w*(B.wing/.32),phi=s*(j?.1+k*.14:.04+k*.03),dx=Math.sin(phi)*fl,dy=-Math.cos(phi)*fl,c=k>=nf-2&&j?wc[2]:wc[1];
    Wl.l([[x,-.005,.004,.022*w,.006*w],[x+dx*.5,dy*.5,.006,.024*w,.006*w],[x+dx,dy,.004,.006*w,.003*w]],{seg:4,k:1,c,up:[0,0,-1],c0:.3,c1:.5,cr:[]});}});
  U.wings.push({wR,wF,wP,segs,s,rest:1,bird:true});});
 U.wOpen=T.wOpen||0;U.wRaise=T.wRaise||0;U.wPitch=T.wPitch??.6;
 // Schwanzfächer
 const tg=grp(body,0,-bh*.7,B.bd*.75*w);tg.rotation.x=1.25;U.fan=tg;const TL=X.L('fan',tg),tl=B.tail*(K.t||1)*w,fork=T.fork;
 for(let j=0;j<5;j++){const a=(j-2)*.2,Lq=tl*(fork?1+Math.abs(j-2)*.35:1-Math.abs(j-2)*.08),c=j%2?C.a:shade(C.a,.86);TL.l([[0,0,0,.02*w,.006*w],[-Math.sin(a)*Lq*.5,Lq*.5,0,.026*w,.006*w],[-Math.sin(a)*Lq,Lq,0,fork&&Math.abs(j-2)===2?.004:.016*w,.004*w]],{seg:4,k:1,c,up:[0,0,-1],c0:.3,c1:.6,cr:[]});}
 X.tip={par:tg,pos:[0,tl,0]};X.back=[[0,by+bh*.7,0],[0,by+bh*.5,.05],[0,by+bh*.2,.1]];X.sho=[0,by+bh*.6,0];X.neck=[0,by+bh*.9,-.03];X.nr=bw*.6;X.r=bw;X.h=by;X.len=bh*2;
 U.hip=by-bh*.75;U.legH=B.leg*K.l;U.dropH=Math.max(0,by-bh*.9-.01);U.gaitRate=v==='owl'?6.5:8;}
// ---------- Qualle (schwebend): Glocke mit Randlappen, Mundarme, Tentakel ----------
function taJelly(X){const{U,C,K,T}=X,S=TA_STG[X.stage],w=K.w*S.m,mk=T.mk||{},bell=grp(X.bd,0,.62,0);U.bell=bell;const r=.3*w*(X.stage===1?.9:1),hgt=r*.78;
 const p=[];for(let i=0;i<=10;i++){const t=i/10,a=t*Math.PI/2;p.push(new THREE.Vector2(Math.max(.0001,Math.sin(a)*r),Math.cos(a)*hgt));}p.push(new THREE.Vector2(r*.92,-hgt*.08));p.push(new THREE.Vector2(r*.55,-hgt*.02));p.push(new THREE.Vector2(.0001,.0));
 const BL=X.L('bell',bell);BL.g(gc('tajb'+r.toFixed(3)+hgt.toFixed(3),()=>{const g=new THREE.LatheGeometry(p.reverse(),18);g.computeVertexNormals();return g;}),I4,C.a);
 const nl=X.stage>1?16:12;for(let i=0;i<nl;i++){const a=i/nl*Math.PI*2;BL.g(taEllT(),mtx([Math.sin(a)*r*.96,-hgt*.06,Math.cos(a)*r*.96],0,[r*.15,r*.08,r*.15]),mixC(C.a,'#ffffff',.35)).n();}
 const G=X.L('bellG',bell,'MG');[0,1,2,3].forEach(i=>{const a=i/4*Math.PI*2+Math.PI/4;G.g(gc('tajr',()=>new THREE.TorusGeometry(1,.32,4,10,Math.PI*1.4)),mtx([Math.sin(a)*r*.36,hgt*.82,Math.cos(a)*r*.36],[-Math.PI/2+.25,0,a+.4],[r*.17,r*.17,r*.17]),mk.ring||C.b);});
 X.H=bell;X.hr=r;X.top=[0,hgt,0];X.eyes=[-1,1].map(s=>{const a=.42,el=.42;return{s,p:[s*Math.sin(a)*r*.86,Math.sin(el)*hgt*.75,-Math.cos(a)*r*.82],ry:-s*a,rx:el*.6,er:r*.26*TA_STG[X.stage].e};});
 // Mundarme (gerüscht) + Tentakel als Ketten
 const arm=(i,a,rr,n,Lq,c,key)=>{let prev=grp(bell,Math.sin(a)*rr,-hgt*.05,Math.cos(a)*rr);const gs=[],cu=i%2?.18:-.18;for(let k=0;k<n;k++){const g=k?grp(prev,0,Lq,0):prev;g.userData.rx0=k?cu:Math.PI-.12;g.rotation.x=g.userData.rx0;U.tail.push(g);gs.push(g);prev=g;}
   const P=[];let A=0,q=[0,0,0];for(let k=0;k<=n;k++){P.push(q.slice());q=[0,q[1]+Math.cos(A)*Lq,q[2]+Math.sin(A)*Lq];A+=cu;}const oa=key==='oa',rw=k=>r*(oa?.1-k/n*.05:.035-k/n*.02);
   X.L(key+i,gs[0]).lb(P.map((p,k)=>[p[0],p[1],p[2],rw(k),rw(k)*(oa?.5:1)]),{seg:5,k:1,c,up:[0,0,-1],c0:.5,c1:.6},gs.map((g,k)=>[k/n,g]));X.L(key+i,gs[0]).n();return prev;};
 [0,1,2,3].forEach(i=>arm(i,i/4*Math.PI*2+Math.PI/4,r*.22,3,hgt*.48*(X.stage>1?1.25:1),mixC(C.b,'#ffffff',.25),'oa'));
 const nt=X.stage>1?8:6;for(let i=0;i<nt;i++)arm(i,i/nt*Math.PI*2,r*.86,X.stage>1?3:2,hgt*.42,mixC(C.a,C.s,.35),'tn');
 X.tip={par:bell,pos:[0,hgt,0]};X.back=[[0,.62+hgt*.9,0],[0,.62+hgt*.7,.12],[0,.62+hgt*.4,.2]];X.neck=[0,.62,0];X.nr=r*.5;X.r=r;X.h=.62;X.len=r*2;
 U.hover=.2;U.hip=.3;U.legH=.3;U.dropH=0;U.gaitRate=4;}
// ---------- Riemenfisch (schwebend, langer Bandkörper, Kronenstrahlen, Rückenflossen-Saum) ----------
function taRibbon(X){const{U,C,K,T}=X,w=K.w,mk=T.mk||{},n=7,sl=.17*(K.len||1),R=.15*K.h;let prev=grp(X.bd,0,.42,-.25);const segs=[];U.rib=segs;
 for(let i=0;i<n;i++){const g=i?grp(prev,0,0,sl):prev;g.userData.ry0=0;g.rotation.x=i?(i<3?.06:-.03):0;const t0=i/n,t1=(i+1)/n,hh=t=>(.1*(1-t*.75)+.012)*w,ww=t=>(.045*(1-t*.6)+.01)*w;
  const Lq=X.L('rb'+i,g);Lq.l([[0,0,-.01,ww(t0),hh(t0)],[0,0,sl*.5,(ww(t0)+ww(t1))/2,(hh(t0)+hh(t1))/2],[0,0,sl+.01,ww(t1),hh(t1)]],{seg:10,k:1,up:[0,1,0],c:C.a,z:[[mk.bellyC||mixC(C.a,'#ffffff',.5),0,1,2.2,9],[mk.stripe||C.s,0,1,1.35,1.75]],c0:.5,c1:i===n-1?1:.5}).p(1);
  // Rückenflossen-Saum: Strahlen
  for(let k=0;k<3;k++){const zz=sl*(k+.5)/3,hy=hh(t0+(t1-t0)*(k+.5)/3);Lq.l([[0,hy*.9,zz,.008,.008],[0,hy+.045*w,zz+.02,.012,.006],[0,hy+.075*w,zz+.05,.004,.003]],{seg:4,k:1,c:mk.fin||C.b,c0:.3,c1:.5}).n();}
  segs.push(g);prev=g;}
 X.L('rb'+(n-1),prev).l([[0,0,sl,.02*w,.05*w],[0,.02,sl+.08,.006,.06*w],[0,.03,sl+.15,.002,.03*w]],{seg:6,k:1,c:mk.fin||C.b,up:[0,1,0]});
 const H=grp(segs[0],0,.01,-R*.55);taHead(X,H,R,'oarfish');
 // Krone aus langen Flossenstrahlen + Bauchflossen-Fäden (Signatur)
 const G=X.L('crownG',H,'MG');for(let k=0;k<5;k++){const a=(k-2)*.22,Lc=R*(1.5+(2-Math.abs(k-2))*.45);G.l([[0,R*.6,R*.05,R*.06,R*.05],[Math.sin(a)*Lc*.3,R*.6+Lc*.55,R*.25+Lc*.2,R*.05,R*.04],[Math.sin(a)*Lc*.55,R*.6+Lc*.8,R*.6+Lc*.55,R*.02,R*.02]],{seg:5,k:2,c:mk.crown||C.b,c0:.5,c1:1});}
 [-1,1].forEach(s=>X.L('rb0',segs[0]).l([[s*.03*w,-.07*w,.02,.01,.01],[s*.07*w,-.17*w,.1,.008,.008],[s*.08*w,-.25*w,.24,.012,.012]],{seg:5,k:2,c:mk.fin||C.b}).n());
 X.tip={par:prev,pos:[0,0,sl]};X.back=[[0,.55,0],[0,.52,.3],[0,.48,.6]];X.neck=[0,.45,-.2];X.nr=.08;X.r=.06;X.h=.42;X.len=n*sl;
 U.hover=.18;U.hip=.3;U.legH=.3;U.dropH=0;U.gaitRate=3.5;}
const TA_BODY={canine:taQuad,feline:taQuad,ursine:taQuad,mustelid:taQuad,rodent:taQuad,lagomorph:taQuad,armadillo:taQuad,reptile:taQuad,amphibian:taQuad,tortoise:taQuad,seal:taSeal,owl:taBird,bird:taBird,jelly:taJelly,ribbon:taRibbon};
// ---------- Signaturmerkmale (neu; ältere FEAT-Bausteine aus 10-mon3d.js bleiben nutzbar) ----------
const TA_MOSS='#7cc24a',TA_STN=['#a8a399','#cbbca6','#b6ada0','#d6c8b0'];
function taTuft(L,b,d,len,r,c){L.l([[b[0],b[1],b[2],r,r*.55],[b[0]+d[0]*len*.5,b[1]+d[1]*len*.5,b[2]+d[2]*len*.5,r*.72,r*.4],[b[0]+d[0]*len,b[1]+d[1]*len,b[2]+d[2]*len,r*.04,r*.03]],{seg:4,k:1,c,c0:.4,c1:.3}).n();return L;}
const TF={
 waterCrown:X=>{const h=X.hr,g=grp(X.H,0,X.top[1]+h*.12,-h*.05),G=X.L('crown',g),B2=X.L('crownG',g,'MG'),cc='#5ab4f0',R=h*.42,n=X.stage>1?7:5;G.g(torG(.18),mtx([0,0,0],[Math.PI/2,0,0],[R,R,R]),cc);
  for(let j=0;j<n;j++){const a=j/n*Math.PI*2,x=Math.sin(a)*R,z=Math.cos(a)*R,t=j%2?.7:1;G.l([[x,0,z,h*.07,h*.07],[x*1.08,h*.18*t,z*1.08,h*.055,h*.055],[x*1.12,h*.3*t,z*1.12,h*.02,h*.02]],{seg:5,k:1,c:cc});B2.s([x*1.12,h*.38*t,z*1.12],[h*.09,h*.09,h*.09],'#bfe8ff',0,1);}X.U.spin.push([g,'y',.35]);},
 flameMark:X=>{const h=X.hr,tk=TA_H[X.T.hk||(TA_Q[X.T.b]||{}).hk]||TA_H.canine,a=.62,d=[0,Math.sin(a),-Math.cos(a)],rx=h*.94*tk.ck,ry=h*.82*(tk.cy||1),rz=h*.86,t=1/Math.sqrt(d[1]*d[1]/ry/ry+d[2]*d[2]/rz/rz);
  X.L('headG',X.H,'MG').g(tongueG(),orientM(d.map(v=>v*t*.97),[0,.7,-.7],d,[h*.34,h*.5,h*.34]),X.C.s);},
 whirl:X=>{const t=X.tip;if(!t)return;const m=mesh(torG(.09,Math.PI*1.5),bmat(X.C.s==='#ffffff'?'#d8f2ff':X.C.s,{transparent:true,opacity:.75,depthWrite:false}),t.par,0,t.pos[1]*.6,0,.09,.09,.09);m.rotation.x=Math.PI/2;m.userData.noOL=1;X.U.spin.push([m,'z',2.4]);},
 swirlCrest:X=>{const L=X.L('head',X.H),h=X.hr*(X.stage>1?1.15:1),cs=X.T.wc||['#ffffff','#86d8bc','#45a6ea'];[-1,1].forEach(s=>[0,1,2].forEach(j=>{const k=1-j*.18;
  L.l([[s*h*(.42+j*.04),h*(.62-j*.04),h*(.1+j*.06),h*.13*k,h*.08*k],[s*h*.7,h*(1.02-j*.06),h*(.12+j*.08),h*.12*k,h*.07*k],[s*h*.98,h*(1.18-j*.08),h*(.32+j*.05),h*.09*k,h*.05*k],[s*h*1.0,h*(1.05-j*.08),h*(.55+j*.04),h*.05*k,h*.03*k],[s*h*.86,h*(.95-j*.06),h*(.5+j*.02),h*.01,h*.01]],{seg:6,k:2,c:cs[j],up:[0,0,-1],c0:.5,c1:.6});}));},
 flameTip:X=>{const t=X.tip;if(!t)return;flame(X,t.par,[0,t.pos[1]-.025,0],[.42,.52,.62][X.stage-1]*(X.K.fl||1),X.fc).rotation.x=-.2;},
 ruff:X=>{const N=X.U.neckG;if(!N)return;const L=X.L('neck',N),r=X.nr,n=X.stage>2?9:7;for(let i=0;i<n;i++){const a=(i/(n-1)-.5)*3.6;taTuft(L,[Math.sin(a)*r*1.15,-r*.2+Math.cos(a)*r*.2,-Math.cos(a)*r*.6],[Math.sin(a)*.4,-.8,-.25],r*(X.stage>2?2.1:1.7),r*.55,X.C.b);}},
 chestTuft:X=>{const N=X.U.neckG,L=X.L('neck',N),r=X.nr;for(let i=0;i<5;i++){const a=(i-2)*.42;taTuft(L,[Math.sin(a)*r*1.1,-r*.4,-Math.cos(a)*r*1.25-r*.3],[Math.sin(a)*.3,-.85,-.45],r*1.6,r*.5,X.C.b);}},
 cheekTuft:X=>{const L=X.L('head',X.H),R=X.hr,c=(X.T.mk||{}).faceC||X.C.b;[-1,1].forEach(s=>[0,1].forEach(j=>taTuft(L,[s*R*.78,-R*(.12+j*.16),R*(.08+j*.08)],[s*.7,-.3-j*.2,.65],R*(.4-j*.08),R*.2,j?X.C.a:c)));},
 // Flammenzungen (Leuchtmaterial): Basis Glutorange, Spitze Flammengelb – zweistufig wie die Schweifflamme
 flameRuff:X=>{const N=X.U.neckG,G=X.L('neckG',N,'MG'),r=X.nr,n=X.stage>2?13:11,ln=r*(X.stage>2?2.5:2.05),fo=X.fc[0]==='#ff6418'?'#e8420c':X.C.s,fy=X.fc[0]==='#ff6418'?'#ffb020':mixC(X.C.s,'#fff2a8',.45);
  // Halskrause (15:30): Flammen rund um den Hals nach außen/hinten statt flügelartig nach oben
  for(let i=0;i<n;i++){const a=(i/(n-1)-.5)*4.5,l=ln*(1-Math.abs(a)*.1)*(i%2?.74:1),b=[Math.sin(a)*r*1.02,r*.22+Math.cos(a)*r*.92,r*.12],d=[Math.sin(a)*.82,Math.cos(a)*.5+.22,.5];
   G.l([[b[0],b[1],b[2],r*.42,r*.26],[b[0]+d[0]*l*.45,b[1]+d[1]*l*.45,b[2]+d[2]*l*.45,r*.32,r*.2],[b[0]+d[0]*l*.85+Math.sin(a)*l*.08,b[1]+d[1]*l*.85,b[2]+d[2]*l*.95,r*.1,r*.07],[b[0]+d[0]*l,b[1]+d[1]*l*1.05,b[2]+d[2]*l*1.15,r*.01,r*.01]],{seg:6,k:1,c:fo,z:[[fy,.55,1,0,9]],c0:.4,c1:.3});}},
 flameMane:X=>{TF.flameRuff(X);const B=X.L('maneG',X.bd,'MG'),fo=X.fc[0]==='#ff6418'?'#e8420c':X.C.s,fy=X.fc[0]==='#ff6418'?'#ffb020':mixC(X.C.s,'#fff2a8',.45),sf=X.surf;
  [-.46,-.36,-.26,-.16].forEach((zz,k)=>{[-1,0,1].forEach(j=>{const[p,n]=sf(zz*X.len,j*.35),l=(.15-k*.025)*(j?.8:1);B.l([[p[0],p[1]-.01,p[2],.03,.02],[p[0]+n[0]*l*.5,p[1]+l*.5,p[2]+l*.3,.024,.016],[p[0]+n[0]*l*.8,p[1]+l*.9,p[2]+l*.7,.004,.004]],{seg:5,k:1,c:fo,z:[[fy,.5,1,0,9]],c0:.4,c1:.3});});});},
 basalt:X=>{const L=X.L('basalt',X.bd),G=X.L('basaltG',X.bd,'MG'),sf=X.surf;[[-.3,1.0,1],[-.3,-1.0,1],[-.08,1.25,.8],[-.08,-1.25,.8],[.32,.75,.9],[.32,-.75,.9],[.42,.2,.7]].forEach(([zz,a,k])=>{const[p,n]=sf(zz*X.len,a);
  L.g(gc('taBas',()=>{const g=new THREE.CylinderGeometry(.42,.5,.5,6).toNonIndexed();g.computeVertexNormals();return g;}),orientM([p[0]-n[0]*.01,p[1]-n[1]*.01,p[2]],[n[0],n[1],n[2]],[0,0,1],[.075*k,.09*k,.075*k]),X.C.d);G.g(gc('taBas2',()=>new THREE.CylinderGeometry(.44,.44,.04,6)),orientM([p[0]+n[0]*.022*k,p[1]+n[1]*.022*k,p[2]],[n[0],n[1],n[2]],[0,0,1],[.072*k,.5,.072*k]),X.C.s).n();});},
 spots:X=>{const sf=X.surf;if(!sf)return;const T=X.T,gl=T.glowSpots,L=X.L(gl?'spotG':'torso',X.bd,gl?'MG':0),c=(T.mk||{}).spot||(gl?X.C.s:shade(X.C.a,.75)),n=T.nSpots||9,r=hs(X.id,3);
  for(let i=0;i<n;i++){const zz=(hs(X.id,i*7)-.5)*.9*X.len,a=(hs(X.id,i*11)-.5)*3.4,[p,nn]=sf(zz,a),s=.016+hs(X.id,i*5)*.018;L.g(taEllT(),orientM(p,[0,0,1],nn,[s,s*.8,.006]),c).n();}},
 leafCoat:X=>{const L=X.L('leafB',X.bd),c=X.K.leaf||'#8cc63a',sf=X.surf,n=X.stage>2?14:10;for(let i=0;i<n;i++){const zz=(i/(n-1)-.5)*X.len*1.05,a=(i%2?1:-1)*(.35+hs(X.id,i)*.9),[p,nn]=sf(zz,a);
  L.g(leafG(),orientM([p[0],p[1],p[2]],[nn[0]*.3,-.25,.95],nn,[.07,.11,.07]),i%3?c:shade(c,.85));}},
 leafMane:X=>{const N=X.U.neckG,L=X.L('neckL',N),c=X.K.leaf||'#7fc23e',r=X.nr;for(let k=0;k<10;k++){const a=(k/9-.5)*4.2;L.g(leafG(),orientM([Math.sin(a)*r*1.2,r*.3+Math.cos(a)*r*.5,-Math.cos(a)*r*.3],[Math.sin(a)*.6,-.3,.8],[Math.sin(a),Math.cos(a),0],[.07,.12,.07]),k%2?c:shade(c,.84));}},
 blossomsT:X=>{const G=X.L('blosG',X.bd,'MG'),sf=X.surf;[[-.2,.4],[.15,-.5],[.3,.3]].forEach(([zz,a])=>{const[p]=sf(zz*X.len,a);for(let k=0;k<5;k++){const b=k/5*Math.PI*2;G.s([p[0]+Math.sin(b)*.022,p[1]+.008,p[2]+Math.cos(b)*.022],[.02,.008,.02],X.C.s,0,1);}G.s([p[0],p[1]+.012,p[2]],[.01,.008,.01],'#ffd84a',0,1).n();});},
 amberT:X=>{const G=X.L('amberG',X.bd,'MG'),t=X.shTop||X.back[1],k=X.stage>1?1.3:1;[[0,0,0,.05,0],[.04,-.01,.03,.03,.6],[-.035,-.012,-.02,.028,-.5]].forEach(([x,y,z,s,a])=>G.g(crystalG(),mtx([t[0]+x*k,t[1]+y,t[2]+z*k],[.15,a,a*.4],[s*k,s*1.9*k,s*k]),X.C.s));
  if(X.stage>1)[-1,1].forEach(s=>G.g(crystalG(),mtx([s*X.r*1.25,t[1]-X.dep*.35,X.len*.3],[.3,0,-s*.6],[.025,.05,.025]),X.C.s));},
 mossT:X=>{const L=X.L('moss',X.bd),pts=X.back.concat(X.shTop?[[X.r*.8,X.shTop[1]-.06,-.08],[-X.r*.7,X.shTop[1]-.05,.1]]:[]);pts.forEach((p,i)=>{for(let q=0;q<3;q++)L.s([p[0]+(q-1)*.03+(i%2?.04:-.04),p[1]+.004,p[2]+(q%2)*.025],[.035,.016,.03],q%2?TA_MOSS:shade(TA_MOSS,.85),0,1).n();});},
 stars:X=>{const G=X.L('starG',X.bd,'MG'),sf=X.surf,big=X.stage>1?1.25:1;[[.25,.9,.9],[-.15,.6,.6],[.05,-.85,.75],[-.35,-.5,.5],[.4,-1.1,.55]].forEach(([zz,a,k])=>{const[p,n]=sf(zz*X.len,a);G.g(star4G(),orientM(p,[0,0,-1],n,.024*k*big),X.C.s).n();});},
 shellHat:X=>{const L=X.L('head',X.H),h=X.hr,c=X.C.b,c2=mixC(X.C.b,'#ffffff',.35),b=[0,h*.78,h*.15];for(let j=0;j<7;j++){const a=(j-3)*.36;
  L.l([[b[0],b[1],b[2],h*.06,h*.04],[b[0]+Math.sin(a)*h*.3,b[1]+Math.cos(a)*h*.3,b[2]-h*.02,h*.1,h*.05],[b[0]+Math.sin(a)*h*.55,b[1]+Math.cos(a)*h*.52,b[2]-h*.05,h*.09,h*.045]],{seg:6,k:1,c:j%2?c:c2,up:[0,0,-1],c0:.4,c1:.8});}
  L.s([0,h*.74,h*.2],[h*.13,h*.08,h*.08],c2);},
 pearl:X=>{X.L('headG',X.H,'MG').s([0,X.hr*.95,-X.hr*.02],[X.hr*.12,X.hr*.12,X.hr*.12],'#fff8ee');},
 stoneBands:X=>{const L=X.L('stone',X.bd),sf=X.surf,rows=X.stage>1?7:6;let k=0;for(let i=0;i<rows;i++){const zz=(i/(rows-1)-.5)*X.len*1.15,n=i%2?5:6;
  for(let j=0;j<n;j++){const a=-1.45+j/(n-1)*2.9,[p,nn]=sf(zz,a);L.g(gc('taEp',()=>new THREE.SphereGeometry(1,6,4)),orientM([p[0]+nn[0]*.012,p[1]+nn[1]*.012,p[2]],[0,0,1],nn,[.05,.045,.024]),TA_STN[k++%4]).p(2);}}
  X.L('head',X.H).g(taEllLo(),orientM([0,X.hr*.7,X.hr*.05],[0,.4,1],[0,1,-.2],[X.hr*.55,X.hr*.45,X.hr*.15]),TA_STN[0]);},
 bugWings:X=>{const m=bmat(mixC(X.C.b,'#fff3c0',.25),{transparent:true,opacity:.72,depthWrite:false,side:THREE.DoubleSide}),k=(X.K.wings||1)*(X.stage>1?1.4:1),y=X.back[0][1]-.01;
  X.U.fx.bug=[-1,1].map(s=>{const g=grp(X.bd,s*.04,y,X.back[0][2]+.04),q=mesh(gc('tabw'+k,()=>mergeG([[taEllLo(),mtx([.15*k,.07*k,0],[0,0,.5],[.15*k,.07*k,.01])],[taEllLo(),mtx([.12*k,-.04*k,.01],[0,0,-.3],[.11*k,.05*k,.01])]])),m,g,0,0,0,1);q.scale.x=s;q.userData.noOL=1;g.userData.s=s;return g;});},
 glowTail:X=>{const t=X.tip;if(!t)return;X.L('tailG',t.par,'MG').s([0,t.pos[1]+.02,0],[.07,.07,.07].map(v=>v*(X.stage>1?1.3:1)),'#ffe066');X.U.pulse=1;},
 patagium:X=>{const{U,C}=X,len=X.len,G=[];[-1,1].forEach(s=>{const g=grp(X.bd,s*X.r*.85,X.h+X.dep*.12,-len*.05);g.userData.rz0=0;const L=X.L('pt'+s,g);
  L.l([[0,0,0,len*.32,.006],[s*.1,.006,.01,len*.3,.006],[s*.19,.004,.03,len*.2,.005],[s*.24,0,.05,.012,.003]],{seg:8,k:2,up:[0,1,0],c:mixC(C.s,'#ffffff',.35),z:[[C.s,.55,1,0,9]],c0:.2,c1:.5});
  for(let j=0;j<4;j++)L.l([[s*.02,.008,-len*.18+j*len*.12,.006,.006],[s*.2,.008,-len*.1+j*len*.09,.004,.004]],{seg:4,k:1,c:'#ffffff'}).n();G.push(g);});U.pata=G;},
 cloudPuffs:X=>{(X.U.rib||[]).forEach((g,i)=>{if(i%2||i>5)return;const L=X.L('rb'+i,g);[[0,.1,.05,.06],[.03,.09,.11,.045],[-.03,.085,.0,.045]].forEach(([x,y,z,r])=>L.s([x,y*(1-i*.1),z],[r,r*.8,r],i%4?'#ffffff':mixC(X.C.a,'#ffffff',.6),0,1));});},
 capMark:X=>{}
};
// ---------- Arten: Tierbasis je Art (Starter-Linien + Welt I), Details in docs/terras.md ----------
const TERRA={
 1:{tier:'Rotfuchs · Welpe',b:'canine',glowC:'#ff5a14',glowI:.28,tail:'brush',mk:{face:'mask',belly:2.1,bib:1.25,throat:1.9,sock:'#ffe2b4',sockH:0,tailTip:'#ffa526',earTip:'#a8340a',earIn:'#ffe2b4'},f:['flameTip','flameMark','chestTuft','cheekTuft'],iris:'#b84a0c'},
 2:{tier:'Rotfuchs · Jungtier',b:'canine',glowC:'#ff5a14',glowI:.28,tail:'brush',k:{l:1.05},mk:{face:'mask',belly:2.1,bib:1.25,throat:1.9,sock:'#5a2410',sockH:1,tailTip:'#ffa526',earTip:'#5a2410',earIn:'#ffe2b4'},f:['flameTip','flameMark','flameRuff','cheekTuft'],iris:'#c2560f'},
 3:{tier:'Mähnenwolf',b:'canine',glowC:'#ff5a14',glowI:.28,tail:'brush',pk:0,q:{lf:.52,lh:.54,L:.46,nl:.24},k:{w:1.05,h:1.12},mk:{face:'mask',belly:2.2,throat:2,sock:'#3a1e16',sockH:2,tailTip:'#ffa526',earIn:'#ffe2b4'},f:['flameTip','flameMane','basalt','flameMark'],iris:'#c2560f',eye:'ani'},
 4:{tier:'Seehund · Heuler',b:'seal',mk:{belly:2.0},f:['waterCrown','spots'],iris:'#1f6fd0',mk2:1},
 5:{tier:'Seehund · Jungtier',b:'seal',k:{w:1.12,len:1.1},mk:{belly:2.0},f:['waterCrown','spots'],iris:'#1f6fd0'},
 6:{tier:'Seeleopard',b:'seal',k:{w:1.28,len:1.25},mk:{belly:2.1},glowSpots:1,nSpots:12,f:['waterCrown','spots'],iris:'#21c8f0'},
 7:{tier:'Braunbär · Junges',b:'ursine',tail:'stub',mk:{face:'muzzle',belly:2.3,earIn:'#f3dfb4',pawC:'#f3dfb4'},f:['leafCap','budSprout','leafMane'],iris:'#4a2a14',k:{leaf:'#8cc63a'}},
 8:{tier:'Braunbär · Jungbär',b:'ursine',tail:'stub',k:{leaf:'#82c23e',w:1.08},mk:{face:'muzzle',belly:2.3,earIn:'#8a6436',pawC:'#efdcae'},f:['leafCap','budSprout','leafMane','leafCoat'],iris:'#6a3a14'},
 9:{tier:'Grizzly',b:'ursine',tail:'stub',k:{leaf:'#7fc23e',w:1.12},mk:{face:'muzzle',belly:2.3,earIn:'#8a6436',pawC:'#efdcae'},f:['lily','leafMane','leafCoat','blossomsT'],iris:'#6a3a14'},
 22:{tier:'Landschildkröte · Schlüpfling',b:'tortoise',tail:'stub',cols:['#9a8a78','#e9dfcf','#ffb43a'],mk:{plastron:'#d8cbb4',rim:'#7e705f'},f:['amberT','mossT'],iris:'#7a4a14',skin:'#b9a58c'},
 23:{tier:'Riesenschildkröte',b:'tortoise',tail:'stub',k:{w:1.18,len:1.15},cols:['#8f8070','#e9dfcf','#ffb43a'],mk:{plastron:'#d8cbb4',rim:'#6e6152'},f:['amberT','mossT'],iris:'#7a4a14',skin:'#a8957c'},
 25:{tier:'Polarfuchs · Welpe',b:'canine',tail:'brush',mk:{face:'mask',belly:2.0,bib:1.2,throat:1.8,tailTip:'#ffffff',earIn:'#ffffff',sock:'#ffffff',sockH:0},f:['whirl','cheekTuft','chestTuft'],iris:'#1f78d8'},
 26:{tier:'Polarfuchs',b:'canine',tail:'brush',mk:{face:'mask',belly:2.0,bib:1.2,throat:1.8,tailTip:'#ffffff',earIn:'#ffffff',sock:'#ffffff',sockH:1},f:['whirl','cloudCollar','cheekTuft'],iris:'#1f78d8'},
 31:{tier:'Hauskatze · Kätzchen',b:'feline',tail:'long',tl:{cols:['#3a2a74','#3a2a74','#bda4f2','#3a2a74','#bda4f2']},mk:{face:'chin',belly:2.2,throat:2.0,sock:'#c9b4f5',sockH:0,earIn:'#bda4f2',wh:'#e8dcff'},f:['crescent','stars'],iris:'#7a3fd8',eye:'slit'},
 32:{tier:'Katze (schlank)',b:'feline',tail:'long',k:{l:1.06},tl:{cols:['#3a2a74','#3a2a74','#bda4f2','#3a2a74','#bda4f2']},mk:{face:'chin',belly:2.2,throat:2.0,sock:'#c9b4f5',sockH:0,earIn:'#bda4f2',wh:'#e8dcff'},f:['crescent','stars','ruff'],iris:'#7a3fd8',eye:'slit'},
 33:{tier:'Schneeleopard',b:'feline',tail:'long',q:{L:.5,dep:.25},tl:{L:.1,r:[.04,.042,.045,.046,.044,.036],cols:['#35266e','#35266e','#bda4f2','#35266e','#bda4f2']},k:{w:1.1},mk:{face:'chin',belly:2.1,throat:1.9,sock:'#c9b4f5',sockH:0,earIn:'#bda4f2',wh:'#e8dcff'},f:['crescent','stars','ruff','starHalo','crystalCollar'],iris:'#7a3fd8',eye:'slit'},
 34:{tier:'Feuersalamander',b:'amphibian',tail:'lizard',pat:1,glowSpots:1,nSpots:11,mk:{belly:2.3,bellyC:'#5a3020'},tl:{pat:1},f:['spots','flameTip','flameMark'],iris:'#ffb02e',eye:'slit',k:{fl:.85}},
 37:{tier:'Seeotter · Welpe',b:'mustelid',tail:'otter',mk:{face:'muzzle',faceC:'#e9f6ff',belly:2.1,bellyC:'#ffd0d8',earIn:'#ffd0d8',wh:'#ffffff'},f:['shellHat'],iris:'#1f6fd0'},
 38:{tier:'Seeotter',b:'mustelid',tail:'otter',k:{w:1.08},mk:{face:'muzzle',faceC:'#e9f6ff',belly:2.1,bellyC:'#ffd0d8',earIn:'#ffd0d8',wh:'#ffffff'},f:['shellHat','coralHorns','pearl'],iris:'#1f6fd0'},
 52:{tier:'Ohrenqualle',b:'jelly',mk:{ring:'#c9a8ff'},f:[],iris:'#2f78b8'},
 53:{tier:'Kompassqualle',b:'jelly',k:{w:1.15},mk:{ring:'#c9a8ff'},f:['halo'],iris:'#2f78b8'},
 57:{tier:'Neunbinden-Gürteltier',b:'armadillo',tail:'taper',tl:{cols:TA_STN,pat:2},mk:{belly:2.2,earIn:'#f2a08a'},f:['stoneBands','mossT'],iris:'#7a3d10'},
 58:{tier:'Riesengürteltier',b:'armadillo',tail:'taper',q:{claw:'#4a3a34'},k:{w:1.22,len:1.12},tl:{cols:TA_STN,pat:2},mk:{belly:2.2,earIn:'#f2a08a'},f:['stoneBands','mossT','hornsStub'],iris:'#7a3d10'},
 59:{tier:'Schneeeule · Küken',b:'owl',v:'owl',wc:['#ffffff','#7ad6b4','#3a9ff0'],wOpen:.55,wRaise:.2,mk:{chest:'#ffffff',disc:'#ffffff',beak:'#f5b733'},f:['swirlCrest','vMark'],iris:'#1f78d8'},
 60:{tier:'Schneeeule',b:'owl',v:'owl',k:{w:1.12},wc:['#ffffff','#7ad6b4','#3a9ff0'],wOpen:.3,mk:{chest:'#ffffff',disc:'#ffffff',beak:'#f2b33a'},f:['swirlCrest','vMark'],iris:'#1f78d8'},
 61:{tier:'Widderkaninchen · Glühwürmchen',b:'lagomorph',ear:'lop',tail:'puff',mk:{face:'muzzle',faceC:'#fff6dc',belly:2.1,bellyC:'#fff6dc',earIn:'#ffc66a',pawC:'#b79ae2'},f:['bulbAntennae','bugWings','glowTail'],iris:'#6a3cc8'},
 62:{tier:'Feldhase · Leuchtform',b:'lagomorph',ear:'long',tail:'puff',k:{l:1.1,w:1.08,ear:.82,h:1.08},mk:{face:'muzzle',faceC:'#fff6dc',belly:2.1,bellyC:'#fff6dc',earIn:'#ffc66a',pawC:'#b79ae2',earTip:'#b79ae2'},f:['bulbAntennae','bugWings','glowTail','halo'],iris:'#6a3cc8'},
 72:{tier:'Husky · Welpe',b:'canine',tail:'brush',mk:{face:'blaze',belly:2.0,bib:1.3,throat:1.8,sock:'#ffffff',sockH:1,tailTip:'#ffd23f',earTip:'#ffd23f',earIn:'#ffffff'},f:['zigStripes','cheekTuft'],iris:'#3aa0ff'},
 73:{tier:'Wolf',b:'canine',tail:'brush',k:{w:1.08,l:1.05},mk:{face:'blaze',belly:2.0,bib:1.3,throat:1.8,sock:'#ffffff',sockH:1,tailTip:'#ffd23f',earTip:'#ffd23f',earIn:'#ffffff'},f:['boltMane','zigStripes','cheekTuft'],iris:'#ffd23f'},
 75:{tier:'Leguan · Jungtier',b:'reptile',tail:'lizard',pat:1,tl:{pat:1},mk:{belly:2.2},f:['iceSpines','iceCrown'],iris:'#2f78b8',eye:'slit'},
 76:{tier:'Flugdrache (Gleitechse)',b:'reptile',tail:'lizard',pat:1,k:{len:1.12},tl:{pat:1},mk:{belly:2.2},f:['iceSpines','patagium','iceCrown'],iris:'#2f78b8',eye:'slit'},
 90:{tier:'Braunbär · Junges (Felsbär)',b:'ursine',tail:'stub',cols:['#d8b48a','#f0e2c4','#7cc24a'],mk:{face:'muzzle',belly:2.3,earIn:'#c89a70'},f:['rockPlates','mossT','flower'],iris:'#3a6ab8'},
 91:{tier:'Braunbär (Felsbär)',b:'ursine',tail:'stub',k:{w:1.12},cols:['#c9a47a','#f0e2c4','#8fe8ff'],mk:{face:'muzzle',belly:2.3,earIn:'#c89a70'},f:['rockPlates','mossT','crystals'],iris:'#3a6ab8'},
 112:{tier:'Biber',b:'rodent',tail:'flat',tl:{cols:['#6a4a34'],pat:1},mk:{face:'muzzle',belly:2.3,earIn:'#d8a080'},f:[],iris:'#4a2a14'},
 113:{tier:'Wanderratte',b:'rodent',tail:'whip',q:{L:.36,dep:.21,wid:.12,hs:.13},tl:{cols:['#d8a8a0']},mk:{belly:2.2,earIn:'#e8a8a8'},f:['keyTail'],iris:'#ffe14a'},
 114:{tier:'Kohlmeise · Nestling',b:'bird',v:'song',mk:{face:'cap',chest:'#ffd43a',beak:'#3a3344'},cols:['#8fae5a','#3a3344','#fff6b0'],f:['bulbCrest'],iris:'#2a2030'},
 115:{tier:'Rauchschwalbe',b:'bird',v:'song',fork:1,cols:['#3a3344','#ffd43a','#fff6b0'],k:{ws:1.25},mk:{chest:'#ffd43a',face:'chin',faceC:'#ffd43a',beak:'#2a2030'},f:['bulbCrest'],iris:'#2a2030'},
 116:{tier:'Steinkauz',b:'owl',v:'owl',k:{w:.95},mk:{chest:'#cbbbe8',disc:'#cbbbe8',beak:'#e8c25a'},f:['clockFace','spots'],iris:'#f2e14c',glowEyes:1},
 117:{tier:'Uhu',b:'owl',v:'owl',k:{w:1.15},mk:{chest:'#cbbbe8',disc:'#cbbbe8',beak:'#e8c25a'},f:['earTufts','clockFace'],iris:'#f2e14c',glowEyes:1},
 122:{tier:'Riemenfisch',b:'ribbon',mk:{fin:'#ffc94a',crown:'#ffb43a',stripe:'#7fc8ff'},f:['cloudPuffs','halo'],iris:'#2f78b8'}};
TF.crystals=X=>{const G=X.L('crysG',X.bd,'MG');X.back.forEach((p,i)=>G.g(crystalG(),mtx([p[0]+(i%2?.04:-.04),p[1]-.02,p[2]],[-.3,i,(i%2?.3:-.3)],[.035,.075,.035]),X.C.s));};
function terraOf(id){return!window.TERRA_OFF&&TERRA[id]||null;}
// ---------- Aufbau ----------
function buildTerra(id,h,opts){opts=opts||{};artSpec(id);const T=TERRA[id],M=MONS[id],stg=Math.min(3,Math.max(1,T.st||evoStage(id))),sh=!!opts.shiny,hue=ART_HUE[id]!=null?ART_HUE[id]:150;
 let[c1,c2,c3]=monCols(M,opts);if(T.cols){[c1,c2,c3]=T.cols;if(sh)[c1,c2,c3]=T.cols.map(c=>hueRot(c,hue));else if(opts.form&&opts.form!=='normal'&&opts.form!=='standard'){c1=hueC(c1,40);c2=hueC(c2,25);c3=hueC(c3,30);}}
 const xc=c=>c&&sh?hueRot(c,hue):c,sc=M.sp[4]*(opts.gender==='m'?1.04:1),root=new THREE.Group(),base=grp(root,0,0,0),bd=grp(base,0,0,0),leg=!!M.legend;
 const C={a:c1,b:c2,s:c3,d:mixC(shade(c1,.42),'#2a2633',.3),m:mixC(c1,'#ffffff',.5),k:'#2b1d26',p:mixC(c2,'#ff9fb0',.4),bk:mixC(c3,'#f2a93b',.55),hn:mixC(c2,'#c9b08a',.45)};
 // Zeichnung in der Glanzform mitdrehen
 const mk0=T.mk||{},mk={};for(const k in mk0)mk[k]=typeof mk0[k]==='string'&&mk0[k][0]==='#'?xc(mk0[k]):mk0[k];const TT=Object.assign({},T,{mk});if(T.skin)C.a=xc(T.skin);if(T.wc)TT.wc=T.wc.map(xc);if(T.tl&&T.tl.cols)TT.tl=Object.assign({},T.tl,{cols:T.tl.cols.map(xc)});
 if(T.b==='tortoise'){C.sh=c1;}
 const MB=taMat(T.gloss??(/reptile|amphibian|tortoise|jelly|ribbon/.test(T.b)?.4:.06)),MG=taMat(.3,T.glowC?xc(T.glowC):c3,T.glowI??.55);
 const U={legs:[],arms:[],wings:[],eyes:[],brows:[],serp:[],tail:[],ears:[],flames:[],spin:[],fx:{},body:bd,base,root,sh:'terra',gait:TA_GAIT[T.b],terraV:T.v||T.b,blob:false,seed:id*1.7,mats:[MB],gmats:[MG],MB,MG,act:{},stage:stg,
  K:{glow:leg?.18:(M.t.includes('lumen')?.1:0)},glowC:null,terra:1};
 const K=Object.assign({w:1,len:1,n:1,t:1,h:1,l:1},T.k||{}),LS={},ck='T'+id+(TA_HQ?'h':'')+'|'+c1+c2+c3+(sh?'s':'')+'|';
 const X={U,C,K,T:TT,body:T.b,bd,stage:stg,leg,M,id,ck,has:k=>(T.f||[]).includes(k),fc:[!M.t.includes('glut')||sh?mixC(c3,'#3a4aff',.15):'#ff6418',mixC(c3,'#ffffff',.3)],
  L:(n,par,mat)=>{if(!LS[n])LS[n]={par,L:taPL(),mat:mat||0};else if(par&&!LS[n].par)LS[n].par=par;return LS[n].L;}};
 if(T.b==='tortoise'){X.C=Object.assign({},C,{a:C.a});}
 TA_BODY[T.b](X);
 (T.f||[]).forEach(f=>{const fn=TF[f]||FEAT[f];if(fn)try{fn(X);}catch(e){console.warn('Terra-Merkmal',id,f,e);}});
 taSkin(X,LS);
 // Augen (beide in einem Netz am Kopf), Ausdruck über die Augen-Textur (Lider)
 const glow=!!T.glowEyes||leg,iris=xc(T.iris)||'#6a3a1e',eM=new THREE.MeshBasicMaterial({alphaTest:.5});
 if(X.eyes&&X.H){const em=mesh(gc(ck+'eyes',()=>mergeG(X.eyes.map(E=>[taEyeGeo(E.s<0?-1:1),mtx(E.p,[E.rx,E.ry,0],[E.er,E.er*1.1,E.er*.32])]))),eM,X.H,0,0,0,1);em.userData.noOL=1;}
 U.face={glow,sty:T.eye||(glow?'glow':'ani'),iris,skin:T.lid?xc(T.lid):shade(c1,.9),eM,mM:null,ms:null,fang:false};
 const H=X.H,hr=X.hr;U.head=H;U.hr=hr;U.hk=true;
 const hv=hs(id,77);U.tilt=(hv>.5?1:-1)*(.012+hv*.01);U.htilt=(hs(id,13)>.5?1:-1)*(.06+hs(id,19)*.06);U.cute=stg===1;
 root.updateMatrixWorld(true);const bx=new THREE.Box3();base.traverse(o=>{if(o.isMesh&&!o.userData.fxOnly&&!o.userData.ol&&!(o.material&&o.material.transparent)){o.geometry.boundingBox||o.geometry.computeBoundingBox();bx.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
 base.position.y=-bx.min.y+(U.hover||0);const sz=bx.getSize(new THREE.Vector3());U.baseH=Math.max(.3,sz.y+(U.hover||0)*.5,Math.max(sz.x,sz.z)*.62);U.box0=[sz.x,sz.y,sz.z];
 if(U.aura){U.aura.position.y=U.baseH*.5;U.aura.scale.setScalar(U.baseH*1.9);}
 if(opts.shiny){const n=10,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  const pt=new THREE.Points(g,new THREE.PointsMaterial({color:'#fff3b0',size:.11,map:typeof dotTex==='function'?dotTex():null,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));pt.frustumCulled=false;root.add(pt);U.fx.spark=pt;U.shiny=1;}
 U.lod1=[];U.lod2=[];
 root.scale.setScalar((h||1)*sc/U.baseH);root.userData=U;setFace(U,'neutral','neutral');animMon(root,0,{still:true,pose:opts.pose});return root;}
// ---------- Gangarten (aus animMon aufgerufen): Werte werden zu den Körper-Offsets addiert ----------
function taGait(U,o){const R={px:0,py:0,pz:0,rx:0,ry:0,rz:0,mo:0},G=U.gait,w=o.w,p=o.p,A=U.act,now=o.now,ez=k=>k<=0?0:k>=1?1:k*k*(3-2*k),lerp=(a,b,t)=>a+(b-a)*t;
 const ko=A.ko?ez(Math.min(1,(now-A.ko)/900)):0,down=Math.max(o.sl,ko,o.hd*.55),mv=w*(1-down);
 if(G==='quad'||G==='sprawl'||G==='hop'){const run=(o.spd||1)>1.35&&G==='quad',PH=G==='hop'?[0,0,0,0]:run?[0,Math.PI,Math.PI,0]:[Math.PI*1.5,Math.PI*.5,0,Math.PI];
  U.legs.forEach((L,i)=>{const g=L.g,r=L.r,q=p+PH[i],sw=Math.sin(q),lift=Math.pow(Math.max(0,Math.cos(q)),1.5);
   if(L.spr){g[0].rotation.y=-L.s*sw*.5*mv;g[0].rotation.z=L.z[0]+L.s*(lift*.3*mv-.35*down);g[1].rotation.z=L.z[1]-L.s*lift*.2*mv;return;}
   let a0,a1,a2;
   if(G==='hop'){const k=Math.max(0,Math.sin(p)),k2=Math.max(0,Math.sin(p+.9));if(L.front){a0=r[0]+(k2*.6-.2*k)*mv;a1=r[1]+k2*.5*mv;a2=r[2]-k2*.5*mv;}else{a0=r[0]-k*.45*mv;a1=r[1]+k*.35*mv;a2=r[2]-k*.25*mv;}}
   else if(L.front){a0=r[0]+sw*.42*mv;a1=r[1]+lift*.3*mv;a2=r[2]-lift*1.2*mv;}else{a0=r[0]+sw*.46*mv;a1=r[1]-lift*.8*mv;a2=r[2]+lift*.6*mv;}
   if(down>0&&G!=='hop'){if(L.front){a0=lerp(a0,1.2,down);a1=lerp(a1,.15,down);a2=lerp(a2,.1,down);}else{a0=lerp(a0,1.15,down);a1=lerp(a1,-2.25,down);a2=lerp(a2,.95,down);}}
   g[0].rotation.x=a0;g[1].rotation.x=a1;g[2].rotation.x=a2;g[3].rotation.x=-(a0+a1+a2)-lift*.45*mv;});
  if(G==='hop'){const k=Math.max(0,Math.sin(p));R.py+=k*.09*mv;R.rx+=-Math.cos(p)*.14*mv;}
  else{R.py+=(run?Math.abs(Math.sin(p))*.09:(1-Math.cos(2*p))*.03)*mv*U.legH;R.rx+=Math.sin(2*p)*.02*mv;if(G==='sprawl')R.ry+=Math.sin(p)*.13*mv;}
  if(U.pata)U.pata.forEach((g,i)=>{g.rotation.z=(i?-1:1)*(Math.sin(o.ph*2)*.08+mv*Math.sin(p*2)*.15)+(i?1:-1)*.1*down;});
  R.py-=U.dropH*(G==='hop'?down*.4:down);R.rz+=ko*.35;}
 else if(G==='seal'){R.py+=Math.abs(Math.sin(p))*.035*mv;R.rx+=Math.sin(p)*.07*mv;U.arms.forEach(a=>{a.u.rotation.z=a.u.userData.rz0+a.s*(Math.sin(p)*.4*mv+Math.sin(o.ph*1.7)*.06+o.he*.25);a.u.rotation.x=.2+Math.cos(p)*.3*mv;});R.rz+=ko*.3;}
 else if(G==='bird'){const hop=U.terraV!=='owl';if(hop)R.py+=Math.abs(Math.sin(p))*.06*mv;else R.rz+=Math.sin(p)*.07*mv;
  U.legs.forEach((L,i)=>{const d=hop?-Math.max(0,Math.sin(p))*.5:Math.sin(p+i*Math.PI)*.5;L.g[0].rotation.x=L.r[0]+d*mv;L.g[2].rotation.x=-d*mv*.7;});R.py-=U.dropH*down;R.rz+=ko*.25;}
 else if(G==='jelly'){const pu=Math.sin(o.ph*2.3);if(U.bell)U.bell.scale.set(1+pu*.06*(1-ko),1-pu*.08*(1-ko),1+pu*.06*(1-ko));R.py+=Math.sin(o.ph*1.2)*.03*(1-ko)-ko*(U.hover||0)*.9;}
 else if(G==='ribbon'){(U.rib||[]).forEach((g,i)=>{g.rotation.y=Math.sin(o.ph*(1.6+mv*2.2)-i*.85)*(.09+.08*mv)*(i?1:.35)*(1-ko*.7);});R.py+=Math.sin(o.ph*1.1)*.03-ko*(U.hover||0)*.9;R.rz+=ko*.6;}
 if(U.neckG){const N=U.neckG;N.rotation.x=(N.userData.r0||0)-o.gz*.95-down*.28+o.he*.06+(G==='quad'?Math.sin(2*p)*.04*mv:0);}
 if(o.fe==='freudig'&&!o.still)R.mo=.22;if(o.he>.3&&U.cute!==undefined)R.mo=Math.max(R.mo,.1*o.he);return R;}// Heldenpose: Maul leicht offen (freundlich wie die gemalten Karten)
// ---------- Entwicklungs-Ansicht (Fortsetzung 15:30): gleicher Bildrahmen für gemalte und bildlose Formen ----------
// SEQ.evolve (25-evolve.js) zeigt bei gemischten Linien (z. B. 061 Blinki mit Bild → 062 Strahli ohne Bild) die gemalte Form im 440-px-Rahmen,
// die bildlose aber als kleine 2D-Zeichnung (drawMon, ≈ 40 % so groß). Während der Sequenz zeichnet drawArt für bildlose Arten deshalb das
// Modell-Porträt (monThumb, Kartenqualität) in denselben Rahmen; außerhalb der Sequenz bleibt drawArt unverändert.
if(typeof SEQ!=='undefined'&&typeof SEQ.evolve==='function'&&!SEQ.evolve.taFrame){const E0=SEQ.evolve;
 SEQ.evolve=async function(o){const D0=window.drawArt;if(typeof D0!=='function'||typeof hasArt!=='function')return E0.apply(this,arguments);
  const D1=function(c,id,x,y,w,h,flip){if(!hasArt(id)&&MONS[id]&&window.THREE){let T=null;try{T=monThumb(id);}catch(e){}
    if(T&&T.img){c.save();if(flip){c.translate(x+w,y);c.scale(-1,1);c.drawImage(T.img,0,0,w,h);}else c.drawImage(T.img,x,y,w,h);c.restore();return true;}}
   return D0.apply(this,arguments);};
  window.drawArt=D1;try{return await E0.apply(this,arguments);}finally{if(window.drawArt===D1)window.drawArt=D0;}};
 SEQ.evolve.taFrame=1;}
