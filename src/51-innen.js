// ===== VEYRA – Detailing: Innenräume, Höhlen, Kreaturenstation (Agent Innenräume, Opus hoch, 12.11.) – siehe docs/innen.md =====
// Nur Darstellung (3D) + Heil-Sequenz. Möbel stehen genau auf den blockierten Feldern aus 02-world (INNEN_FURN → cur.furn): Kollision = Darstellung.
// Hooks (09 bleibt unverändert): build3d-Hülle (09-Innenraum-Kästen + gemalten Boden ersetzen, Höhle ergänzen) · draw3d-Hülle (GPU-Freigabe beim
// Raumwechsel, Tropf-Hall in Höhlen) · Szene.onBeforeRender (innerste Stufe nach 17/36/42: Innen-Kamera, Licht, Animation) · worldPt (gezeigte Kamera)
// · SEQ.heal (neu, scharfe Kreaturenbilder über cardMini) · talk (KP-Schnappschuss für die Heil-Anzeige).
const INN={V:{},cd:null,ch:null,room:null,scene:null,heal:{lit:0,boost:0,on:0},snap:null,au:null,drip:0,cam:null};

// ---------- Grundkörper (geteilter Cache von 09, nie freigegeben) ----------
const iBox=()=>g3('innBox',()=>new THREE.BoxGeometry(1,1,1));
const iBoxS=()=>g3('innBoxS',()=>new THREE.BoxGeometry(1,1,1,1,6,1));
const iCyl=(seg,rt)=>{rt=rt==null?1:Math.round(rt*20)/20;return g3('innCy'+seg+'_'+rt,()=>new THREE.CylinderGeometry(rt,1,1,seg));};
const iSph=(a,b)=>g3('innSp'+a+'_'+b,()=>new THREE.SphereGeometry(1,a,b));
const iHemi=()=>g3('innHemi',()=>new THREE.SphereGeometry(1,10,5,0,Math.PI*2,0,Math.PI/2));
const iCone=seg=>g3('innCo'+seg,()=>new THREE.ConeGeometry(1,1,seg));
const iOct=()=>g3('innOct',()=>new THREE.OctahedronGeometry(1,0));
const iTor=(arc,seg)=>g3('innTo'+arc+'_'+(seg||20),()=>new THREE.TorusGeometry(1,.12,6,seg||20,arc==='h'?Math.PI:Math.PI*2));
const iDisc=seg=>g3('innDi'+seg,()=>new THREE.CircleGeometry(1,seg));
// Welt-Grafik 2: Höhlenfels = Ikosaeder Stufe 1, gestreckt + zwei Rauschlagen + leichte Schichtung; Normalen ⅔ glatt (geschliffen statt Kristall-Facetten)
const iRock=v=>g3('innRock2_'+v,()=>{const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,r=prng(97+v*31),a=.82+r()*.3,b=.88+r()*.25,o1=r()*6,o2=r()*6,n=new THREE.Vector3();
 const key=i=>Math.round(p.getX(i)*1e3)+','+Math.round(p.getY(i)*1e3)+','+Math.round(p.getZ(i)*1e3),J={};
 for(let i=0;i<p.count;i++){const k=key(i);if(!J[k]){n.set(p.getX(i),p.getY(i),p.getZ(i)).normalize();const f=1+.26*Math.sin(n.x*3.3+o1)*Math.sin(n.y*2.9+o2)*Math.sin(n.z*3.7+o1)+.1*Math.sin(n.x*7.1+n.y*9+o2)*Math.sin(n.z*6.3+o1),st=Math.round(n.y*4)/4;let y=(n.y*.7+st*.3)*f*b;if(y>.62)y=.62+(y-.62)*.3;J[k]=[n.x*f*a,y,n.z*f*a];}const q=J[k];p.setXYZ(i,q[0],q[1],q[2]);}
 g.computeVertexNormals();const fn=g.attributes.normal,acc={};for(let i=0;i<p.count;i++){const k=key(i);const t=acc[k]||(acc[k]=[0,0,0]);t[0]+=fn.getX(i);t[1]+=fn.getY(i);t[2]+=fn.getZ(i);}
 for(let i=0;i<p.count;i++){const t=acc[key(i)],l=Math.hypot(t[0],t[1],t[2])||1;n.set(fn.getX(i)*.34+t[0]/l*.66,fn.getY(i)*.34+t[1]/l*.66,fn.getZ(i)*.34+t[2]/l*.66).normalize();fn.setXYZ(i,n.x,n.y,n.z);}return g;});

// ---------- Baukasten: Teile in Raum-Listen (lokaler Rahmen je Möbel: Rückseite −z an der Wand, Vorderseite +z) ----------
function IM(B,x,y,z,sx,sy,sz,rx,ry,rz){return new THREE.Matrix4().multiplyMatrices(B.M,w3M(x,y,z,sx,sy,sz,rx||0,ry||0,rz||0));}
function P_(B,L,g,c,x,y,z,sx,sy,sz,k,rx,ry,rz){B[L].push([g,c,IM(B,x,y,z,sx,sy,sz,rx,ry,rz),null,k||0]);}
// Welt-Grafik 6: Möbel (Ebene F) als Quader mit gerundeten Kanten in echter Größe (Radius ≤ 3 cm, weiche Kanten-Normalen) statt skalierter Kasten
const iRBox=(w,h,d)=>{const q=v=>Math.max(.004,Math.round(v*200)/200);w=q(w);h=q(h);d=q(d);return g3('innRB'+w+'_'+h+'_'+d,()=>{const r=Math.min(.03,.3*Math.min(w,h,d)),H=[w/2,h/2,d/2],g=new THREE.BoxGeometry(1,1,1,3,3,3),p=g.attributes.position,n=g.attributes.normal,v=[0,0,0],o=[0,0,0];
 for(let i=0;i<p.count;i++){v[0]=p.getX(i);v[1]=p.getY(i);v[2]=p.getZ(i);let l=0;for(let a=0;a<3;a++){const c=v[a],e=H[a]-r,pv=Math.abs(c)>.4?Math.sign(c)*H[a]:Math.sign(c)*e,inn=Math.max(-e,Math.min(e,pv));o[a]=pv-inn;v[a]=inn;l+=o[a]*o[a];}
  l=Math.sqrt(l)||1;p.setXYZ(i,v[0]+o[0]/l*r,v[1]+o[1]/l*r,v[2]+o[2]/l*r);n.setXYZ(i,o[0]/l,o[1]/l,o[2]/l);}return g;});};
const bx=(B,x,y,z,w,h,d,c,k,ry,L)=>(L||'F')==='F'?P_(B,'F',iRBox(w,h,d),c,x,y,z,1,1,1,k,0,ry||0,0):P_(B,L,iBox(),c,x,y,z,w,h,d,k,0,ry||0,0);
const cy=(B,x,y,z,r,h,c,k,seg,rt,L)=>P_(B,L||'F',iCyl(seg||10,rt),c,x,y,z,r,h,r,k);
const bxr=(B,x,y,z,w,h,d,c,k,rx,ry,rz,L)=>(L||'F')==='F'?P_(B,'F',iRBox(w,h,d),c,x,y,z,1,1,1,k,rx,ry,rz):P_(B,L,iBox(),c,x,y,z,w,h,d,k,rx,ry,rz);
const cyr=(B,x,y,z,r,h,c,k,seg,rx,ry,rz,L)=>P_(B,L||'F',iCyl(seg||10),c,x,y,z,r,h,r,k,rx,ry,rz);
const sp=(B,x,y,z,rx,ry,rz,c,k,L)=>P_(B,L||'F',iSph(10,7),c,x,y,z,rx,ry,rz,k);
const gl=(B,g,c,c2,x,y,z,sx,sy,sz,k,rx,ry,rz)=>B.GL.push([g,c,IM(B,x,y,z,sx,sy,sz,rx,ry,rz),c2||c,k||0]);
const glB=(B,x,y,z,w,h,d,c,c2)=>gl(B,iBox(),c,c2,x,y,z,w,h,d);
const glS=(B,x,y,z,r,c,c2)=>gl(B,iSph(10,7),c,c2,x,y,z,r,r,r);
// Atlas-Fläche (Bild, Schild, Bildschirm, Teppich): lit = beleuchtet (Bilder) / unbeleuchtet (Bildschirme)
const ap=(B,reg,x,y,z,w,h,rx,ry,lit)=>(lit===false?B.AU:B.AL).push([reg,IM(B,x,y,z,w,h,1,rx||0,ry||0,0)]);
const WP=(B,lx,ly,lz)=>new THREE.Vector3(lx,ly,lz).applyMatrix4(B.M);
const lampAt=(B,lx,ly,lz,col,kind)=>{const v=WP(B,lx,ly,lz);B.lamps.push([v.x,v.y,v.z,col||'#ffc27a',kind||0]);};
const hangAt=(B,lx,lz,ymin)=>{const v=WP(B,lx,0,lz);B.hang.push([v.x,v.z,ymin]);};
const tallAt=(B,it,h)=>B.tall.push([it.x,it.y,it.x+it.w,it.y+it.h,h]);
// Bücherreihe auf einem Brett
function books(B,x0,x1,y,z,d,seed,pal){const r=prng(seed);let x=x0;pal=pal||['#b8463a','#3f6fae','#d9a43a','#4c8f5a','#7a4a8a','#e8dcc0','#2f5a6a','#c26a3a'];
 while(x<x1-.05){const w=.04+r()*.05,h=.2+r()*.13,lean=r()<.12&&x>x0+.1;if(r()<.08){x+=.08;continue;}
  bxr(B,x+w/2+(lean?.03:0),y+h/2-(lean?.01:0),z,w,h,d*(.75+r()*.2),pal[Math.floor(r()*pal.length)],0,0,0,lean?-.25:0);x+=w+.004;}}
function plantPot(B,x,z,s,seed,kind){const r=prng(seed),pc=['#c46a4a','#d98a5a','#e8e0d0','#6a8aa8'][Math.floor(r()*4)];
 cy(B,x,.2*s,z,.21*s,.4*s,pc,0,12,1.25);cy(B,x,.4*s,z,.2*s,.03*s,'#5a3a26',0,12);
 if(kind==='baum'){cy(B,x,.75*s,z,.03*s,.75*s,'#6b4a2e',3,6);P_(B,'F',crownGeo('b'+(seed&1)),'#6cb466',x,.82*s,z,1.15*s,1.25*s,1.15*s,0,0,r()*6,0);}// Welt-Grafik 6: Büschel-Krone wie draußen
 else{const n=7;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+r(),h=.55+r()*.5,l=.22+r()*.12;P_(B,'F',iSph(10,7),i%2?'#4cab5c':'#3a9150',x+Math.cos(a)*l*s*.8,h*s,z+Math.sin(a)*l*s*.8,.2*s,.05*s,.11*s,0,0,-a,.5);}
  sp(B,x,.62*s,z,.14*s,.18*s,.14*s,'#46a052',0);if(kind==='bluete')for(let i=0;i<4;i++)sp(B,x+Math.cos(i*1.6)*.14*s,(.82+r()*.2)*s,z+Math.sin(i*1.6)*.14*s,.05*s,.05*s,.05*s,['#ff8aa8','#ffd84a','#ffffff','#c79bff'][i],0);}}

// ---------- Atlas (eine Leinwand je Raum: Bilder, Bildschirme, Schild, Teppich, Emblem) ----------
const AREG={p0:[4,4,200,148],p1:[212,4,200,148],p2:[420,4,200,148],p3:[628,4,196,148],pt:[832,4,188,240],s0:[4,160,256,160],s1:[268,160,256,160],s2:[532,160,292,160],
 sign:[4,328,508,104],rug:[520,328,304,180],em:[832,252,188,188],rug2:[4,440,250,68],sm:[262,440,250,68]};
function atlasUV(r){return[r[0]/1024,1-(r[1]+r[3])/512,(r[0]+r[2])/1024,1-r[1]/512];}
function paint(c,R,kind,seed){const[x,y,w,h]=R,r=prng(seed);c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
 const sky=(a,b)=>{const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;c.fillRect(x,y,w,h);};
 const hill=(yy,col,amp)=>{c.fillStyle=col;c.beginPath();c.moveTo(x,y+h);for(let i=0;i<=20;i++){const t=i/20;c.lineTo(x+t*w,y+yy*h-Math.sin(t*3+seed)*amp*h-Math.sin(t*7+seed*2)*amp*.3*h);}c.lineTo(x+w,y+h);c.fill();};
 if(kind==='land'){sky('#8fc4ec','#f6e6c8');c.fillStyle='#fff6d0';c.beginPath();c.arc(x+w*.72,y+h*.3,h*.11,0,7);c.fill();hill(.62,'#8ab86a',.07);hill(.75,'#5f9a50',.05);
  for(let i=0;i<5;i++){const tx=x+w*(.1+r()*.8),ty=y+h*(.66+r()*.12);c.fillStyle='#3f7a46';c.beginPath();c.arc(tx,ty,h*.06,0,7);c.fill();}}
 else if(kind==='meer'){sky('#9ccfee','#ffe6c0');c.fillStyle='#3d8fc0';c.fillRect(x,y+h*.6,w,h*.4);c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<9;i++)c.fillRect(x+r()*w,y+h*(.65+r()*.3),w*.08,2);
  c.fillStyle='#f4ead8';c.beginPath();c.moveTo(x+w*.4,y+h*.62);c.lineTo(x+w*.6,y+h*.62);c.lineTo(x+w*.56,y+h*.68);c.lineTo(x+w*.44,y+h*.68);c.fill();c.fillStyle='#fffaf0';c.beginPath();c.moveTo(x+w*.5,y+h*.25);c.lineTo(x+w*.5,y+h*.6);c.lineTo(x+w*.63,y+h*.58);c.fill();}
 else if(kind==='berg'){sky('#b8d4ee','#eef2f6');c.fillStyle='#7f93ac';c.beginPath();c.moveTo(x,y+h*.8);c.lineTo(x+w*.3,y+h*.3);c.lineTo(x+w*.5,y+h*.55);c.lineTo(x+w*.7,y+h*.22);c.lineTo(x+w,y+h*.7);c.lineTo(x+w,y+h);c.lineTo(x,y+h);c.fill();
  c.fillStyle='#f4f8fb';c.beginPath();c.moveTo(x+w*.7,y+h*.22);c.lineTo(x+w*.63,y+h*.34);c.lineTo(x+w*.77,y+h*.33);c.fill();hill(.84,'#6a9a6a',.03);}
 else if(kind==='blume'){sky('#f4ead8','#e6d4bc');c.fillStyle='#7aa0c0';c.beginPath();c.moveTo(x+w*.42,y+h*.92);c.lineTo(x+w*.58,y+h*.92);c.lineTo(x+w*.62,y+h*.62);c.lineTo(x+w*.38,y+h*.62);c.fill();
  for(let i=0;i<7;i++){const fx=x+w*(.3+r()*.4),fy=y+h*(.18+r()*.4);c.strokeStyle='#4c8a4a';c.lineWidth=2;c.beginPath();c.moveTo(x+w*.5,y+h*.64);c.lineTo(fx,fy);c.stroke();c.fillStyle=['#ff8aa8','#ffd84a','#ffffff','#c79bff','#ff9a4a'][i%5];c.beginPath();c.arc(fx,fy,h*.07,0,7);c.fill();c.fillStyle='#ffd23a';c.beginPath();c.arc(fx,fy,h*.025,0,7);c.fill();}}
 else if(kind==='stern'){sky('#18204a','#3a3a7a');for(let i=0;i<60;i++){c.fillStyle='rgba(255,255,255,'+(.4+r()*.6)+')';c.fillRect(x+r()*w,y+r()*h,1.5+r()*1.5,1.5+r()*1.5);}
  c.strokeStyle='rgba(255,230,160,.8)';c.lineWidth=1.5;c.beginPath();let px=x+w*.2,py=y+h*.7;c.moveTo(px,py);for(let i=0;i<5;i++){px+=w*.13;py-=h*(r()*.2-.05);c.lineTo(px,py);}c.stroke();c.fillStyle='#f6f0d0';c.beginPath();c.arc(x+w*.8,y+h*.25,h*.1,0,7);c.fill();c.fillStyle='#18204a';c.beginPath();c.arc(x+w*.84,y+h*.22,h*.09,0,7);c.fill();}
 else if(kind==='kristall'){sky('#e8e0f6','#c8d8f0');c.fillStyle='#9a7ad8';c.beginPath();c.moveTo(x+w*.5,y+h*.12);c.lineTo(x+w*.66,y+h*.5);c.lineTo(x+w*.5,y+h*.9);c.lineTo(x+w*.34,y+h*.5);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.moveTo(x+w*.5,y+h*.12);c.lineTo(x+w*.56,y+h*.5);c.lineTo(x+w*.5,y+h*.9);c.fill();}
 else if(kind==='familie'){sky('#f6dcc0','#e8c8a8');[[.36,'#d97a8a',.26],[.6,'#5a8ab0',.3],[.5,'#e8a040',.18]].forEach(([fx,col,s])=>{c.fillStyle=col;c.beginPath();c.ellipse(x+w*fx,y+h*(1-s*1.1),w*s*.32,h*s*1.2,0,0,7);c.fill();c.fillStyle='#f3cfae';c.beginPath();c.arc(x+w*fx,y+h*(1-s*2.5),h*s*.42,0,7);c.fill();});
  c.fillStyle='#ffffff';c.globalAlpha=.4;c.fillRect(x,y,w,h*.08);c.globalAlpha=1;}
 else if(kind==='karte'){sky('#e8dcc0','#d8c8a4');c.fillStyle='#8ab86a';for(let i=0;i<4;i++){c.beginPath();c.ellipse(x+w*(.2+r()*.6),y+h*(.25+r()*.5),w*(.1+r()*.1),h*(.08+r()*.1),r()*3,0,7);c.fill();}
  c.strokeStyle='#b8463a';c.setLineDash([4,3]);c.lineWidth=2;c.beginPath();c.moveTo(x+w*.15,y+h*.8);c.bezierCurveTo(x+w*.4,y+h*.3,x+w*.6,y+h*.9,x+w*.85,y+h*.2);c.stroke();c.setLineDash([]);}
 c.restore();c.strokeStyle='rgba(60,40,30,.35)';c.lineWidth=3;c.strokeRect(x+1.5,y+1.5,w-3,h-3);}
function screen(c,R,kind,acc){const[x,y,w,h]=R;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#0e2a36');g.addColorStop(1,'#123c44');c.fillStyle=g;c.fillRect(x,y,w,h);
 c.strokeStyle='rgba(120,230,220,.12)';c.lineWidth=1;for(let i=0;i<w;i+=16){c.beginPath();c.moveTo(x+i,y);c.lineTo(x+i,y+h);c.stroke();}for(let i=0;i<h;i+=16){c.beginPath();c.moveTo(x,y+i);c.lineTo(x+w,y+i);c.stroke();}
 const r=prng(w+h+kind.length);c.lineWidth=2.5;
 if(kind==='graph'){[['#5ff2d0',.4],['#ffc24a',.65],['#ff7aa8',.85]].forEach(([col,b])=>{c.strokeStyle=col;c.beginPath();for(let i=0;i<=40;i++){const t=i/40;c.lineTo(x+t*w,y+h*b-Math.sin(t*9+b*7)*h*.12-r()*h*.04);}c.stroke();});}
 else if(kind==='scan'){c.strokeStyle='#5ff2d0';for(let i=1;i<5;i++){c.beginPath();c.arc(x+w*.5,y+h*.55,i*h*.1,0,7);c.stroke();}c.fillStyle='#c79bff';c.beginPath();c.moveTo(x+w*.5,y+h*.18);c.lineTo(x+w*.58,y+h*.5);c.lineTo(x+w*.5,y+h*.86);c.lineTo(x+w*.42,y+h*.5);c.fill();
  c.fillStyle='#5ff2d0';c.font='bold 16px sans-serif';c.fillText('RESONANZ 87 %',x+10,y+22);}
 else if(kind==='karte'){c.fillStyle='rgba(95,242,208,.35)';for(let i=0;i<6;i++){c.beginPath();c.ellipse(x+w*(.15+r()*.7),y+h*(.2+r()*.6),w*(.06+r()*.08),h*(.06+r()*.1),r()*3,0,7);c.fill();}
  c.fillStyle='#ffc24a';for(let i=0;i<5;i++){c.beginPath();c.arc(x+w*(.15+r()*.7),y+h*(.2+r()*.6),4,0,7);c.fill();}c.strokeStyle='#ff7aa8';c.beginPath();c.arc(x+w*.55,y+h*.5,12,0,7);c.stroke();}
 else if(kind==='box'){c.fillStyle='#5ff2d0';c.font='bold 18px sans-serif';c.fillText('KREATURENBOX',x+12,y+24);for(let j=0;j<3;j++)for(let i=0;i<6;i++){const f=r()<.6;c.fillStyle=f?'rgba(95,242,208,.55)':'rgba(95,242,208,.15)';c.fillRect(x+12+i*(w-24)/6,y+38+j*(h-50)/3,(w-24)/6-6,(h-50)/3-6);}}
 else if(kind==='herz'){c.strokeStyle='#5ff2d0';c.lineWidth=3;c.beginPath();for(let i=0;i<=60;i++){const t=i/60,ph=(t*3)%1;const v=ph>.45&&ph<.5?-.35:ph>.5&&ph<.55?.25:0;c.lineTo(x+t*w,y+h*(.45+v));}c.stroke();
  c.fillStyle='#ffc24a';c.font='bold 18px sans-serif';c.fillText('TEAM OK',x+12,y+h-16);for(let i=0;i<6;i++){c.fillStyle='rgba(95,242,208,.7)';c.fillRect(x+w*.5+i*18,y+h-30,12,14);}}
 else if(kind==='text'){c.fillStyle=acc||'#5ff2d0';c.font='bold 20px sans-serif';c.fillText('WILLKOMMEN',x+14,y+30);c.fillStyle='rgba(95,242,208,.5)';for(let i=0;i<4;i++)c.fillRect(x+14,y+48+i*20,w*(.4+r()*.45),8);}
 c.restore();}
function signPaint(c,R,txt,bg,fg,font){const[x,y,w,h]=R;c.save();const g=c.createLinearGradient(0,y,0,y+h);g.addColorStop(0,bg);g.addColorStop(1,shade(bg,.82));c.fillStyle=g;c.beginPath();c.roundRect?c.roundRect(x+2,y+2,w-4,h-4,18):c.rect(x+2,y+2,w-4,h-4);c.fill();
 c.strokeStyle=fg;c.globalAlpha=.6;c.lineWidth=4;c.stroke();c.globalAlpha=1;c.fillStyle=fg;let fs=Math.min(h*.6,w/Math.max(4,txt.length)*1.7);c.font=(font||'bold')+' '+fs+'px "Trebuchet MS",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,x+w/2,y+h/2+2);c.restore();}
function rugPaint(c,R,cols,round){const[x,y,w,h]=R,[a,b,d]=cols;c.save();c.beginPath();if(round)c.ellipse(x+w/2,y+h/2,w/2-2,h/2-2,0,0,7);else c.rect(x+2,y+2,w-4,h-4);c.clip();c.fillStyle=a;c.fillRect(x,y,w,h);
 const ring=(k,col,lw)=>{c.strokeStyle=col;c.lineWidth=lw;c.beginPath();if(round)c.ellipse(x+w/2,y+h/2,w/2-k,h/2-k,0,0,7);else c.rect(x+k,y+k,w-2*k,h-2*k);c.stroke();};
 ring(10,b,8);ring(22,d,4);ring(32,b,3);c.fillStyle=b;c.beginPath();c.ellipse(x+w/2,y+h/2,w*.18,h*.18,0,0,7);c.fill();c.fillStyle=d;for(let i=0;i<8;i++){const t=i/8*Math.PI*2;c.beginPath();c.ellipse(x+w/2+Math.cos(t)*w*.28,y+h/2+Math.sin(t)*h*.28,w*.035,h*.035,0,0,7);c.fill();}
 c.globalAlpha=.08;for(let i=0;i<w;i+=3){c.fillStyle=i%6?'#000':'#fff';c.fillRect(x+i,y,1,h);}c.restore();}
function emblemPaint(c,R,el,col){const[x,y,w,h]=R,cx=x+w/2,cyy=y+h/2,rr=Math.min(w,h)/2-4;c.save();c.beginPath();c.arc(cx,cyy,rr,0,7);c.fillStyle=shade(col,.55);c.fill();c.lineWidth=8;c.strokeStyle='#f4e6c0';c.stroke();
 c.beginPath();c.arc(cx,cyy,rr-14,0,7);c.lineWidth=3;c.strokeStyle=col;c.stroke();c.fillStyle='#fff6e0';c.strokeStyle='#fff6e0';c.lineWidth=7;c.lineCap='round';
 if(el==='flora'){c.beginPath();c.moveTo(cx,cyy+rr*.55);c.quadraticCurveTo(cx-rr*.6,cyy,cx,cyy-rr*.55);c.quadraticCurveTo(cx+rr*.6,cyy,cx,cyy+rr*.55);c.fill();c.strokeStyle=col;c.lineWidth=4;c.beginPath();c.moveTo(cx,cyy+rr*.5);c.lineTo(cx,cyy-rr*.4);c.stroke();}
 else if(el==='flut'){c.beginPath();c.moveTo(cx,cyy-rr*.58);c.bezierCurveTo(cx+rr*.5,cyy,cx+rr*.42,cyy+rr*.5,cx,cyy+rr*.5);c.bezierCurveTo(cx-rr*.42,cyy+rr*.5,cx-rr*.5,cyy,cx,cyy-rr*.58);c.fill();}
 else if(el==='frost'){for(let i=0;i<6;i++){const t=i/6*Math.PI*2,ex=cx+Math.cos(t)*rr*.55,ey=cyy+Math.sin(t)*rr*.55;c.beginPath();c.moveTo(cx,cyy);c.lineTo(ex,ey);c.stroke();
   const mx=cx+Math.cos(t)*rr*.35,my=cyy+Math.sin(t)*rr*.35;[-.6,.6].forEach(o=>{c.beginPath();c.moveTo(mx,my);c.lineTo(mx+Math.cos(t+o)*rr*.16,my+Math.sin(t+o)*rr*.16);c.stroke();});}}
 else if(el==='schatten'){c.beginPath();c.arc(cx-rr*.05,cyy,rr*.5,0,7);c.fill();c.fillStyle=shade(col,.55);c.beginPath();c.arc(cx+rr*.18,cyy-rr*.1,rr*.44,0,7);c.fill();c.fillStyle='#fff6e0';[[.4,-.4],[.5,.2],[.25,.45]].forEach(([a,b])=>{c.beginPath();c.arc(cx+a*rr,cyy+b*rr,5,0,7);c.fill();});}
 else{for(let i=0;i<8;i++){const t=i/8*Math.PI*2;c.beginPath();c.moveTo(cx+Math.cos(t)*rr*.32,cyy+Math.sin(t)*rr*.32);c.lineTo(cx+Math.cos(t)*rr*.6,cyy+Math.sin(t)*rr*.6);c.stroke();}c.beginPath();c.moveTo(cx,cyy-rr*.3);c.lineTo(cx+rr*.2,cyy);c.lineTo(cx,cyy+rr*.3);c.lineTo(cx-rr*.2,cyy);c.fill();}
 c.restore();}

// ---------- Raumstile ----------
const HSTY={// Wohnhäuser: Wand, Sockel (Holz), Boden, Akzent, Teppich, Bilder, Deko
 haus_spieler:{wall:'#f1e2c9',wain:'#b8895c',floor:'#b98352',acc:'#d97a8a',rug:['#c8564a','#f2d6a0','#4f86ad'],pics:['familie','land','blume'],deco:'familie'},
 haus_nachbar:{wall:'#e9def0',wain:'#8c76a6',floor:'#a3744e',acc:'#9a7ac9',rug:['#7a5aa8','#f0e2c0','#6aa07a'],pics:['blume','stern','land'],deco:'oma'},
 haus_kupfer:{wall:'#e9e3cc',wain:'#8a9e68',floor:'#ab7b4c',acc:'#7fae5a',rug:['#5f8f44','#f0e0b0','#c87a4a'],pics:['land','berg','blume'],deco:'wald'},
 haus_sammler:{wall:'#f2e7d2',wain:'#9a6a4a',floor:'#8d5c3c',acc:'#c9a77c',rug:['#8a3a3a','#f0d8a0','#3a5a7a'],pics:['kristall','karte','berg'],deco:'sammler'},
 haus_moewe1:{wall:'#e3eef0',wain:'#5a8aa8',floor:'#bc9c72',acc:'#3d8fe0',rug:['#2f6f9a','#f2ead8','#e8a040'],pics:['meer','meer','land'],deco:'fischer'},
 haus_moewe2:{wall:'#e9eef0',wain:'#6a90a8',floor:'#b39272',acc:'#7a9ad9',rug:['#3a6a8a','#efe6d4','#c8564a'],pics:['meer','karte','land'],deco:'netz'},
 haus_moewe3:{wall:'#f2ead8',wain:'#3a6a8a',floor:'#a37c54',acc:'#c8463a',rug:['#2a4a6a','#f2ead8','#c8463a'],pics:['meer','stern','karte'],deco:'leucht'},
 huette_glut:{wall:'#e9c9a6',wain:'#7a4a32',floor:'#7d5c46',stone:1,acc:'#e8803a',rug:['#a8442a','#f2c890','#5a3a2a'],pics:['berg','land','kristall'],deco:'glut'},
 huette_fluester:{wall:'#ddd6ea',wain:'#5a4a6a',floor:'#7d6c5a',acc:'#9a7ac9',rug:['#4a3a6a','#e8e0c8','#7aa86a'],pics:['stern','blume','kristall'],deco:'kraeuter'}};
const ARENA_EL={arena1:'flora',arena2:'flut',arena3:'frost',arena4:'schatten'};
const ELC={flora:['#4cb85c','#2f7a3c','#c8f0a8'],flut:['#3d8fe0','#1f5a9a','#bfe6ff'],frost:['#79d6e8','#3a8aa8','#eafaff'],schatten:['#7a5ac8','#3a2a6a','#e0d0ff'],lumen:['#f2c24a','#a8781a','#fff2c0']};
const REG_ACC={heil_kupfer:'#3fd9a6',heil_brise:'#2cc4d8',heil_frost:'#8fd8f2',heil_schatt:'#b48aff',heil_sieg:'#f2c24a',heil_moewe:'#2cc4d8',
 laden_kupfer:'#7fae5a',laden_brise:'#2cc4d8',laden_frost:'#8fd8f2',laden_schatt:'#a77bff',laden_moewe:'#3d8fe0'};
function innStyle(m){const I=INTERIORS[m.id]||{},k=I.k,id=m.id;
 const base={k,HC:3.0,floor:'wood',fcol:'#b07a4c',wall:'#efe3cf',wain:'#a8794e',acc:'#d97a8a',light:[1,.95,.35],hemi:['#fff2dc','#5e4432',.78],lamp:'#ffc27a'};
 if(k==='house')return Object.assign(base,HSTY[id]||HSTY.haus_kupfer,{floor:(HSTY[id]||{}).stone?'stone':'wood',fcol:(HSTY[id]||HSTY.haus_kupfer).floor});
 if(k==='lab')return Object.assign(base,{HC:3.2,floor:'tile',fcol:'#e6ecee',fcol2:'#d4dee2',wall:'#eef3f2',wain:'#9fc8c4',acc:'#2fa89a',light:[-.4,.95,.5],hemi:['#f2fbff','#4a5a60',.8],lamp:'#e8f6ff',pics:['karte','kristall','berg']});
 if(k==='shop')return Object.assign(base,{floor:'wood',fcol:'#c09062',wall:'#f2e6cf',wain:'#9a6a44',acc:REG_ACC[id]||'#e8913a',light:[.55,.95,.55],pics:['land','meer','karte'],rug:['#3d6a8a','#f2e2c0',REG_ACC[id]||'#e8913a']});
 if(k==='heal')return Object.assign(base,{HC:3.2,floor:'tile',fcol:'#f2f7f5',fcol2:'#d6efe8',wall:'#eaf6f2',wain:'#a6dccd',acc:REG_ACC[id]||'#3fd9a6',light:[.5,.95,.6],hemi:['#f2fffa','#4a6058',.82],lamp:'#eafff6',pics:['blume','land','meer'],rug:['#3a9a84','#eafaf4','#7ad8c0']});
 if(k==='arena'){const el=ARENA_EL[id]||'flora';return Object.assign(base,{HC:5.0,floor:'stone',fcol:'#cfc6b6',wall:'#e4dccd',wain:'#8a7a68',acc:ELC[el][0],el,light:[.35,1.4,.45],hemi:['#fff4e2','#5a4a40',.8]});}
 if(k==='liga')return Object.assign(base,{HC:6.0,floor:'stone',fcol:'#e8e2d6',wall:'#eae4d8',wain:'#b8a888',acc:'#f2c24a',light:[.75,1.2,.2],hemi:['#fff6e6','#5a5040',.82]});
 return base;}

// ---------- Raumhülle: Boden, Wände (Sockel, Leisten), Decke mit Balken, Fenster, Ausgang ----------
const VZD=1.7;// Tiefe des Vorraums hinter der Brüstung (nicht begehbar, Platz für die Kamera beim Eintreten)
function innShell(B){const R=B.room,S=B.sty,W=R.w,H=R.h,x0=1,x1=W-1,z0=1,z1=H-1,zv=z1+VZD,HC=S.HC;B.M=new THREE.Matrix4();
 // Boden (inkl. Vorraum)
 if(S.floor==='tile'){bx(B,W/2,-.05,(z0+zv)/2,x1-x0+.4,.1,zv-z0+.4,shade(S.fcol2||S.fcol,.86),0,0,'H');
  for(let z=z0;z<zv-.01;z++)for(let x=x0;x<x1;x++){const d=Math.min(1,zv-z);P_(B,'H',iBox(),(x+z)%2?S.fcol:(S.fcol2||S.fcol),x+.5,.005,z+d/2,.965,.01,d-.035,0);}}
 else if(S.floor==='stone'){for(let z=z0;z<zv-.01;z++)for(let x=x0;x<x1;x++){const d=Math.min(1,zv-z);P_(B,'H',iBox(),shade(S.fcol,.93+hs(x*7,z*3)*.12),x+.5,-.05,z+d/2,1.002,.1,d+.002,4);}}
 else for(let z=z0;z<zv-.01;z++){const d=Math.min(1,zv-z);P_(B,'H',iBox(),shade(S.fcol,.92+hs(z,5)*.14),W/2,-.05,z+d/2,x1-x0+.3,.1,d+.001,3);}
 // Wände (Putz, nach oben dunkler → weiches Abdunkeln), Sockel, Leisten
 const wall=(cx,cz,w,d)=>P_(B,'H',iBoxS(),S.wall,cx,HC/2,cz,w,HC,d,1),Lz=zv-z0,cz=(z0+zv)/2;wall(W/2,z0-.2,W,.4);wall(W/2,zv+.2,W,.4);wall(x0-.2,cz,.4,Lz+.8);wall(x1+.2,cz,.4,Lz+.8);
 const wh=S.k==='arena'||S.k==='liga'?1.15:.92,wk=S.k==='lab'||S.k==='heal'?0:S.k==='arena'||S.k==='liga'?4:3;
 [[W/2,z0+.02,x1-x0,.04],[W/2,zv-.02,x1-x0,.04],[x0+.02,cz,.04,Lz],[x1-.02,cz,.04,Lz]].forEach(([cx,cz2,w,d])=>{
  P_(B,'H',iBox(),S.wain,cx,wh/2,cz2,w,wh,d,wk);P_(B,'H',iBox(),shade(S.wain,.82),cx,wh+.03,cz2,w+(d<.1?0:.04),.06,d+.05,3);
  P_(B,'H',iBox(),shade(S.wain,.7),cx,.06,cz2,w,.12,d+.04,3);P_(B,'H',iBox(),shade(S.wall,.9),cx,HC-.08,cz2,w,.16,d+.06,1);});
 // Decke + Balken
 bx(B,W/2,HC+.05,cz,W,.1,Lz+1,shade(S.wall,.88),1,0,'H');
 if(S.k==='house'||S.k==='shop'){for(let x=x0+.9;x<x1;x+=1.6)bx(B,x,HC-.12,cz,.16,.22,Lz,shade(S.wain,.82),3,0,'H');}
 else if(S.k==='lab'||S.k==='heal'){for(let z=z0+1.5;z<z1-.5;z+=2)for(let x=x0+1.5;x<x1-.5;x+=3){bx(B,x,HC-.02,z,1.6,.04,.5,'#ffffff',0,0,'H');gl(B,iBox(),'#f6fbff','#fff6e0',x,HC-.05,z,1.4,.02,.36);B.ceilL.push([x,HC-.3,z]);}}
 else{for(let z=z0+1;z<zv;z+=2.5){bx(B,W/2,HC-.25,z,x1-x0,.3,.3,shade(S.wain,.8),3,0,'H');}}
 // Brüstung auf der Ausgangsreihe (Wandfelder) mit Durchgang über Feld E, dahinter der Vorraum mit Außentür
 const ex=5.5,pc=S.k==='lab'||S.k==='heal'?'#f2f6f6':shade(S.wain,.95),ph=.72;
 [[x0,ex-.5],[ex+.5,x1]].forEach(([a,b])=>{bx(B,(a+b)/2,ph/2,z1,b-a,ph,.18,pc,wk||3,0,'H');bx(B,(a+b)/2,ph+.03,z1,b-a+.04,.06,.26,shade(S.wain,.8),3,0,'H');});
 B.tall.push([x0,z1-.1,ex-.5,z1+.1,ph],[ex+.5,z1-.1,x1,z1+.1,ph]);[ex-.56,ex+.56,x0+.1,x1-.1].forEach(x=>{bx(B,x,(ph+.18)/2,z1,.16,ph+.18,.24,shade(S.wain,.8),3,0,'H');sp(B,x,ph+.22,z1,.09,.07,.09,shade(S.wain,.7),3,'H');});
 bx(B,ex-.62,1.15,zv-.04,.14,2.3,.14,shade(S.wain,.8),3,0,'H');bx(B,ex+.62,1.15,zv-.04,.14,2.3,.14,shade(S.wain,.8),3,0,'H');bx(B,ex,2.3,zv-.04,1.38,.16,.16,shade(S.wain,.8),3,0,'H');
 gl(B,iBox(),'#fbf3dc','#26304e',ex,1.1,zv-.012,1.1,2.2,.01);bx(B,ex,.008,z1-.35,1.0,.016,.5,shade(S.acc,.7),0,0,'H');bx(B,ex,.008,zv-.5,1.1,.016,.7,shade(S.acc,.6),0,0,'H');
 // Vorraum: Garderobe, Bank, Pflanze, Lampe (nur Ansicht – das Feld dahinter ist Wand)
 const vz=z1+VZD/2+.15;bx(B,2.4,.42,zv-.25,1.4,.06,.4,'#a8784a',3,0,'H');[1.8,3.0].forEach(x=>bx(B,x,.2,zv-.25,.06,.4,.36,'#7a5a3a',3,0,'H'));
 bx(B,2.4,1.55,zv-.06,1.5,.08,.06,'#7a5a3a',3,0,'H');[1.9,2.4,2.9].forEach((x,i)=>{sp(B,x,1.5,zv-.1,.04,.04,.04,'#c8a060',0,'H');if(i!==1)bx(B,x,1.15,zv-.16,.34,.62,.12,i?'#4f86ad':S.acc,0,0,'H');});
 plantPot(B,8.6,zv-.4,.9,W*3+H,'baum');cy(B,7.6,.3,zv-.3,.14,.6,'#4a6a8a',0,10,1,'H');for(let i=0;i<3;i++)cy(B,7.55+i*.05,.75,zv-.3,.012,.6,['#c8463a','#3d6ab0','#2a2a2a'][i],0,4,1,'H');
 cy(B,ex,HC-.2,vz,.18,.06,'#f4ead8',0,12,1,'H');gl(B,iSph(10,7),'#fff2c8','#fff0c0',ex,HC-.26,vz,.13,.05,.13);B.lamps.push([ex,HC-.5,vz,'#ffd9a0',0]);
 // Fenster je Raumtyp
 const winL=S.k==='house'?[['n',4.7,1.5,1.1,1.0],['e',4.5,1.5,1.0,1.0],['w',6.2,1.5,.9,1.0]]:S.k==='lab'?[['w',3.0,1.6,1.4,1.0],['e',3.5,1.6,1.4,1.0]]:S.k==='shop'?[['e',3.2,1.6,1.2,1.0],['w',3.0,1.6,1.0,1.0]]:
  S.k==='heal'?[['e',3.0,1.6,1.3,1.1],['w',3.2,1.6,1.1,1.1]]:S.k==='arena'?[['w',3.5,3.6,1.1,1.6],['w',7.5,3.6,1.1,1.6],['e',3.5,3.6,1.1,1.6],['e',7.5,3.6,1.1,1.6]]:
  [['w',4,4.2,1.0,2.2],['w',8,4.2,1.0,2.2],['w',12,4.2,1.0,2.2],['e',4,4.2,1.0,2.2],['e',8,4.2,1.0,2.2],['e',12,4.2,1.0,2.2]];
 for(const[sd,pos,y,w,h]of winL)innWindow(B,sd,pos,y,w,h);}
function innWindow(B,sd,pos,y,w,h){const R=B.room,S=B.sty,W=R.w,H=R.h,M0=B.M;let cx,cz,ry,n;
 if(sd==='n'){cx=pos;cz=1;ry=0;n=[0,0,1];}else if(sd==='s'){cx=pos;cz=H-1;ry=Math.PI;n=[0,0,-1];}else if(sd==='w'){cx=1;cz=pos;ry=Math.PI/2;n=[1,0,0];}else{cx=W-1;cz=pos;ry=-Math.PI/2;n=[-1,0,0];}
 B.M=new THREE.Matrix4().compose(new THREE.Vector3(cx,0,cz),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1));
 const fc=S.k==='lab'||S.k==='heal'?'#f4f8f8':shade(S.wain,.95);
 gl(B,iBox(),'#cfe6f6','#1c2a52',0,y,.03,w,h,.02,1);
 bx(B,0,y+h/2+.04,.06,w+.16,.08,.1,fc,3,0,'H');bx(B,0,y-h/2-.04,.08,w+.24,.07,.16,fc,3,0,'H');bx(B,-w/2-.04,y,.06,.08,h+.16,.1,fc,3,0,'H');bx(B,w/2+.04,y,.06,.08,h+.16,.1,fc,3,0,'H');
 bx(B,0,y,.06,.04,h,.05,fc,3,0,'H');bx(B,0,y+h*.12,.06,w,.04,.05,fc,3,0,'H');
 if(S.k!=='lab'&&S.k!=='arena'&&S.k!=='liga'){const cc=S.acc;[-1,1].forEach(s=>{for(let i=0;i<3;i++)bx(B,s*(w/2+.12+i*.06),y+.05,.12+i*.01,.08,h+.45,.06,shade(cc,.9+i*.06),0,0,'H');});bx(B,0,y+h/2+.24,.16,w+.6,.04,.04,'#6a4a32',0,0,'H');
  if(sd==='n'||hs(cx*3,cz*7)<.6)plantPot(B,w*.25,0,.38,cx*5+cz,'bluete');B.F[B.F.length-1];}
 // Lichteinfall: Fenster zur Sonne → Lichtbalken + Fensterkreuz am Boden
 const Ld=B.ld,dn=n[0]*Ld.x+n[2]*Ld.z;if(dn>.12){const C=[[-w/2,y-h/2],[w/2,y-h/2],[w/2,y+h/2],[-w/2,y+h/2]].map(([a,b])=>WP(B,a,b,.05));B.beams.push(C);}
 B.M=M0;}

// ---------- Möbel (lokaler Rahmen: Breite lw entlang der Wand, Tiefe ld, Rückseite bei −ld/2) ----------
const FB={
 herd(B,lw,ld){bx(B,0,.45,-.19,.94,.9,.6,'#ebe5da',0);bx(B,0,.915,-.19,.94,.03,.6,'#3a3532',0);[-.2,.2].forEach(x=>cy(B,x,.94,-.25,.12,.02,'#222026',0,12));
  bx(B,0,.45,.115,.7,.42,.02,'#2b2a30',0);cyr(B,0,.7,.13,.012,.6,'#c8c0b0',0,6,0,0,Math.PI/2);
  cy(B,-.2,1.03,-.25,.13,.14,'#c8463a',0,12);cy(B,-.2,1.11,-.25,.135,.02,'#a8362a',0,12);sp(B,-.2,1.13,-.25,.025,.025,.025,'#222',0);
  bx(B,0,1.95,-.33,.9,.12,.36,'#d8cfc0',0);bx(B,0,2.3,-.4,.4,.6,.2,'#d8cfc0',0);},
 spuele(B,lw,ld){bx(B,0,.43,-.19,.96,.86,.6,'#c79a6a',3);bx(B,0,.88,-.19,1,.04,.64,'#ece6da',0);bx(B,0,.895,-.15,.5,.012,.34,'#8fa3ae',0);
  cy(B,0,1.0,-.42,.018,.22,'#b8c0c8',0,6);bx(B,0,1.1,-.36,.03,.03,.14,'#b8c0c8',0);bx(B,-.25,.6,.12,.004,.4,.01,'#7a5a3a',0);bx(B,.25,.6,.12,.004,.4,.01,'#7a5a3a',0);
  bx(B,0,1.75,-.33,.94,.6,.32,'#d7b48a',3);[-.22,.22].forEach(x=>bx(B,x,1.6,-.165,.04,.1,.02,'#6a4a32',0));
  for(let i=0;i<3;i++){cy(B,-.3+i*.12,2.12,-.36,.04,.1,['#e8e0d0','#c8463a','#4f86ad'][i],0,8);}},
 anrichte(B,lw,ld){bx(B,0,.43,-.19,.96,.86,.6,'#c79a6a',3);bx(B,0,.88,-.19,1,.04,.64,'#ece6da',0);bx(B,-.15,.91,-.18,.36,.03,.24,'#c89a62',3);sp(B,-.15,.96,-.18,.12,.06,.08,'#d9a05a',0);
  cy(B,.22,.95,-.22,.13,.08,'#e8e2d6',0,12);[[.18,1.0,-.2,'#e85a4a'],[.26,1.0,-.24,'#f2c24a'],[.22,1.03,-.18,'#7ac04a']].forEach(([x,y,z,c])=>sp(B,x,y,z,.045,.045,.045,c,0));
  bx(B,0,1.75,-.33,.94,.6,.32,'#d7b48a',3);for(let i=0;i<4;i++)cy(B,-.32+i*.2,2.12,-.36,.05,.14,['#f2e6c8','#d97a8a','#7aa0c0','#e8c060'][i],0,8);},
 regal(B,lw,ld,it){const c='#8a5a3a',d=.38,z=-ld/2+d/2+.02,S=B.sty;bx(B,-lw/2+.04,1.0,z,.06,2.0,d,c,3);bx(B,lw/2-.04,1.0,z,.06,2.0,d,c,3);bx(B,0,1.0,-ld/2+.03,lw-.06,2.0,.03,shade(c,.75),3);bx(B,0,2.02,z,lw,.05,d+.04,c,3);
  [.06,.48,.9,1.32,1.72].forEach((y,i)=>{bx(B,0,y,z,lw-.1,.035,d,shade(c,1.1),3);if(i<4){if(S.deco==='sammler'&&i>0){for(let j=0;j<3;j++){const x=-lw/2+.22+j*(lw-.4)/2;cy(B,x,y+.03,z,.07,.03,'#e8e0d0',0,10);sp(B,x,y+.12,z,.07,.09,.07,['#f2753a','#3d8fe0','#4cb85c','#c79bff','#ffd84a'][(i*3+j)%5],0);}}
   else books(B,-lw/2+.08,lw/2-.08,y+.02,z,d*.9,it.x*31+i*7);}});
  plantPot(B,lw/2-.22,z,.42,it.x*9+3,'bluete');B.F[B.F.length-1];},
 schrank(B,lw,ld){const c=B.sty.deco==='leucht'?'#3a6a8a':'#9a6a44',z=-ld/2+.3;bx(B,0,1.05,z,lw-.06,2.1,.56,c,3);bx(B,0,2.13,z,lw+.02,.06,.62,shade(c,.8),3);bx(B,0,1.05,z+.285,.012,1.9,.01,shade(c,.6),0);
  [-.08,.08].forEach(x=>sp(B,x,1.05,z+.29,.022,.022,.022,'#e8c060',0));bx(B,0,.12,z+.29,lw-.1,.02,.01,shade(c,.6),0);bx(B,0,2.3,z-.05,.42,.3,.34,B.sty.acc,0);
  if(B.sty.deco==='leucht'){cy(B,-.2,2.45,z,.08,.3,'#f2ead8',0,8);cy(B,-.2,2.62,z,.1,.06,'#c8463a',0,8);glS(B,-.2,2.66,z,.05,'#ffe08a','#fff0b0');}},
 bett(B,lw,ld){const S=B.sty,c='#8a5a3a';bx(B,0,.2,0,lw-.08,.24,ld-.12,c,3);bx(B,0,.38,0,lw-.16,.16,ld-.2,'#f6f2ea',0);bx(B,.15,.48,0,lw-.6,.06,ld-.16,S.acc,0);bx(B,.15,.49,0,lw-.62,.06,.12,shade(S.acc,1.2),0);
  bx(B,-lw/2+.18,.5,0,.26,.08,ld-.36,'#e8dcc8',0);sp(B,-lw/2+.3,.52,0,.14,.07,.26,'#fbf8f2',0);
  bx(B,-lw/2+.05,.55,0,.08,1.0,ld-.08,c,3);bx(B,lw/2-.05,.4,0,.08,.6,ld-.08,c,3);sp(B,-lw/2+.05,1.06,0,.06,.06,ld*.45,shade(c,1.1),3);},
 kamin(B,lw,ld,it){const S=B.sty,glut=S.deco==='glut',st='#b6a594',HC=S.HC;bx(B,0,.62,-.26,1.0,1.24,.48,st,4);bx(B,0,.36,-.04,.58,.52,.06,'#2a1a14',0);bx(B,0,.06,.12,1.1,.08,.3,shade(st,.9),4);
  bx(B,0,1.26,-.2,1.14,.08,.6,'#7a4a2e',3);bx(B,0,(1.3+HC)/2,-.36,.66,HC-1.3,.3,shade(st,.95),4);
  [-.06,.06].forEach((z,i)=>cyr(B,0,.13+i*.06,-.06+z,.05,.42,'#6a4026',3,6,0,i*.5,Math.PI/2));
  gl(B,iCone(7),'#ff8a3a','#ff8a3a',0,.3,-.06,.16,.3,.12);gl(B,iCone(7),'#ffd24a','#ffd24a',.04,.27,-.04,.08,.2,.07);lampAt(B,0,.5,.2,'#ff9a4a',1);
  if(glut){cy(B,.0,.62,-.06,.14,.16,'#3a3232',0,10);bx(B,0,.78,-.06,.36,.02,.02,'#3a3232',0);}
  [-.4,.4].forEach(x=>{cy(B,x,1.36,-.2,.03,.12,'#f4ead8',0,8);glS(B,x,1.45,-.2,.025,'#ffd88a','#ffe8a0');});bx(B,.12,1.38,-.24,.18,.16,.08,'#c8a060',0);
  ap(B,'p2',0,1.95,-.2,.52,.4);bx(B,0,1.95,-.215,.6,.48,.02,'#8a5a3a',3);tallAt(B,it,HC);},
 sessel(B,lw,ld){const c=B.sty.acc;bx(B,0,.22,.05,.66,.18,.6,shade(c,.85),0);bx(B,0,.38,.08,.56,.12,.5,c,0);bx(B,0,.62,-.22,.66,.62,.16,shade(c,.9),0);
  [-.3,.3].forEach(x=>bx(B,x,.42,.05,.12,.3,.6,shade(c,.8),0));[[-.28,-.2],[.28,-.2],[-.28,.3],[.28,.3]].forEach(([x,z])=>cy(B,x,.07,z,.03,.14,'#5a3a26',0,6));
  bx(B,.1,.5,.02,.24,.24,.06,'#f2e6c8',0);cy(B,-.36,.75,-.36,.02,1.5,'#3a3236',0,6);cy(B,-.36,1.52,-.36,.17,.22,'#f6e6c0',0,12,.6);glS(B,-.36,1.45,-.36,.06,'#ffe6a0','#fff2c0');lampAt(B,-.36,1.4,-.36,'#ffc27a');},
 tisch(B,lw,ld){const S=B.sty,c='#a8744a';bx(B,0,.74,0,1.36,.06,.82,c,3);[[-.6,-.33],[.6,-.33],[-.6,.33],[.6,.33]].forEach(([x,z])=>cy(B,x,.37,z,.04,.72,shade(c,.85),3,8));
  bx(B,0,.775,0,1.0,.008,.3,S.acc,0);[-1,1].forEach(s=>{const x=s*.84;bx(B,x,.44,0,.4,.05,.4,'#9a6a44',3);[[-.16,-.16],[.16,-.16],[-.16,.16],[.16,.16]].forEach(([a,b])=>cy(B,x+a,.22,b,.025,.44,'#8a5a3a',0,6));
   bx(B,x+s*.18,.72,0,.04,.56,.38,'#9a6a44',3);bx(B,x,.475,0,.34,.03,.34,shade(S.acc,1.1),0);});
  [-.32,.32].forEach(x=>{cy(B,x,.79,0,.13,.015,'#f6f2ea',0,14);cy(B,x+.06,.82,.12,.04,.06,'#e8e2d6',0,10);});
  if(S.deco==='oma'){sp(B,0,.86,0,.1,.09,.1,'#f2ead8',0);cy(B,.12,.88,0,.012,.08,'#f2ead8',0,6);}else{cy(B,0,.85,0,.05,.14,'#7aa0c0',0,10);for(let i=0;i<5;i++)sp(B,Math.cos(i*1.3)*.06,.97+(i%2)*.05,Math.sin(i*1.3)*.06,.035,.035,.035,['#ff8aa8','#ffd84a','#ffffff','#c79bff','#ff9a4a'][i],0);}
  cy(B,0,2.3,0,.008,1.4,'#3a3236',0,4,1,'H');cy(B,0,1.72,0,.24,.2,shade(S.acc,1.05),0,14,.45);glS(B,0,1.63,0,.07,'#ffe6a0','#fff2c0');lampAt(B,0,1.55,0,'#ffc27a');hangAt(B,0,0,1.5);},
 kommode(B,lw,ld){const c='#9a6a44',z=-ld/2+.24;bx(B,0,.42,z,.86,.84,.46,c,3);bx(B,0,.86,z,.92,.04,.5,shade(c,.85),3);for(let i=0;i<3;i++){bx(B,0,.18+i*.25,z+.235,.78,.008,.01,shade(c,.6),0);sp(B,0,.27+i*.25,z+.24,.02,.02,.02,'#e8c060',0);}
  cy(B,-.22,.98,z,.07,.18,'#e8e0d0',0,10);cy(B,-.22,1.18,z,.16,.18,'#f6e6c0',0,12,.55);glS(B,-.22,1.12,z,.05,'#ffe6a0','#fff2c0');lampAt(B,-.22,1.1,z,'#ffc27a');
  ap(B,'p1',.18,1.04,z-.02,.26,.2,-.12);bxr(B,.18,1.04,z-.04,.3,.24,.02,'#6a4a32',3,-.12,0,0);plantPot(B,.3,z+.05,.28,71,'bluete');},
 pflanze(B,lw,ld,it){plantPot(B,0,0,1,it.x*13+it.y*7,hs(it.x,it.y)<.5?'baum':'blatt');},
 // ---- Labor ----
 laborregal(B,lw,ld,it){const c='#c8d0d4',d=.4,z=-ld/2+.24;[-lw/2+.04,0,lw/2-.04].forEach(x=>bx(B,x,1.0,z,.05,2.0,d,c,0));bx(B,0,2.02,z,lw,.05,d+.04,c,0);
  [.08,.5,.92,1.34,1.74].forEach((y,i)=>{bx(B,0,y,z,lw-.08,.03,d,'#e8eef0',0);if(i===4)return;const r=prng(it.x*7+i);for(let x=-lw/2+.16;x<lw/2-.1;x+=.16+r()*.08){const t=r();
   if(t<.4){cy(B,x,y+.1,z,.05,.18,'#e8f2f4',0,8);gl(B,iCyl(8),['#5ff2d0','#ff9a5a','#c79bff','#7ad8ff'][Math.floor(r()*4)],null,x,y+.07,z,.042,.1,.042);}
   else if(t<.7)books(B,x-.06,x+.1,y+.02,z,.3,it.x+i*3+Math.floor(x*10),['#3a5a7a','#e8e0d0','#2fa89a','#c8463a']);else gl(B,iOct(),'#b89aff',null,x,y+.1,z,.06,.1,.06);}});
  sp(B,.5,2.18,z,.14,.14,.14,'#7ab0d8',0);cy(B,.5,2.06,z,.06,.06,'#c8a060',0,8);},
 konsole(B,lw,ld){const z=-ld/2+.36;bx(B,0,.74,z,lw-.1,.05,.66,'#f2f5f6',0);[-lw/2+.35,lw/2-.35,0].forEach(x=>bx(B,x,.37,z,.6,.72,.62,'#dfe6ea',0));
  [-1.6,0,1.6].forEach(x=>{bx(B,x,.78,z+.12,.5,.02,.18,'#2b3036',0);bx(B,x+.42,.78,z+.12,.08,.02,.12,'#2b3036',0);});
  [-1.9,1.9].forEach((x,i)=>{bx(B,x,1.02,z-.1,.52,.34,.03,'#2b3036',0);ap(B,i?'s1':'s0',x,1.02,z-.08,.46,.28,0,0,false);bx(B,x,.86,z-.12,.06,.18,.04,'#2b3036',0);});
  bx(B,0,1.75,-ld/2+.04,1.86,1.04,.04,'#2b3036',0);ap(B,'s2',0,1.75,-ld/2+.07,1.76,.96,0,0,false);[-1.6,1.6].forEach((x,i)=>{bx(B,x,1.85,-ld/2+.04,.96,.6,.04,'#2b3036',0);ap(B,i?'s0':'s1',x,1.85,-ld/2+.07,.88,.52,0,0,false);});
  gl(B,iBox(),'#5ff2d0',null,0,1.18,-ld/2+.03,lw-.3,.03,.02);},
 resonator(B,lw,ld,it){const z=-ld/2+.42;cy(B,0,.2,z,.46,.4,'#c8d0d4',0,16);cy(B,0,.42,z,.38,.06,'#8a96a0',0,16);gl(B,iCyl(16),'#4fd8c8','#5ff2e0',0,1.25,z,.27,1.6,.27);
  [.6,1.25,1.9].forEach(y=>P_(B,'F',iTor('f',20),'#9aa6b0',0,y,z,.33,.33,.33,0,Math.PI/2));cy(B,0,2.12,z,.36,.12,'#c8d0d4',0,16);cy(B,0,2.3,z,.1,.3,'#9aa6b0',0,8);
  gl(B,iOct(),'#e0c8ff','#f0e0ff',0,1.3,z,.12,.22,.12);bx(B,.72,.6,z,.38,1.2,.44,'#dfe6ea',0);[.3,.6,.9].forEach(y=>gl(B,iBox(),['#5ff2d0','#ffc24a','#ff7aa8'][Math.round(y*3)%3],null,.72,y+.2,z+.225,.22,.05,.01));
  cy(B,-.6,1.6,z-.1,.05,2.0,'#9aa6b0',0,8);lampAt(B,0,1.3,z+.4,'#7affe8');tallAt(B,it,2.45);},
 labortisch(B,lw,ld){bx(B,0,.88,0,lw-.06,.06,.78,'#f4f6f8',0);for(let i=0;i<lw;i++){const x=-lw/2+.5+i;bx(B,x,.43,0,.9,.82,.68,i%2?'#dfe6ea':'#d4dde2',0);bx(B,x,.6,.345,.6,.008,.01,'#9aa6b0',0);}
  for(let i=0;i<lw;i++){const x=-lw/2+.5+i,k=i%2;if(k){cy(B,x,.93,0,.22,.04,'#e8eef0',0,16);P_(B,'F',iTor('f',24),['#f2753a','#3d8fe0','#4cb85c'][(i-1)/2|0]||'#5ff2d0',x,.955,0,.2,.2,.2,0,Math.PI/2);
    gl(B,iTor('f',24),['#ffb08a','#9fd0ff','#a8f0b0'][(i-1)/2|0]||'#5ff2d0',null,x,.96,0,.16,.16,.16,0,Math.PI/2);continue;}
   if(i===0){bx(B,x,.95,-.1,.24,.06,.2,'#2b3036',0);cy(B,x,1.15,-.14,.03,.36,'#2b3036',0,6);cy(B,x+.02,1.28,-.05,.04,.16,'#4a5058',0,8);}
   else if(i===2){[[-.18,'#5ff2d0'],[0,'#ff9a5a'],[.18,'#c79bff']].forEach(([o,c2])=>{P_(B,'F',iCone(10),'#e8f2f4',x+o,1.0,-.12,.08,.2,.08);gl(B,iCone(10),c2,null,x+o,.97,-.12,.06,.1,.06);});bx(B,x+.1,.93,.18,.3,.02,.2,'#f2ead8',0);}
   else if(i===4){cy(B,x,.95,-.1,.08,.08,'#8a96a0',0,8);gl(B,iOct(),'#c79bff','#e0c8ff',x,1.12,-.1,.07,.14,.07);bx(B,x+.2,.93,.15,.26,.03,.18,'#3a5a7a',0);}
   else{cy(B,x,.94,0,.16,.04,'#2b3036',0,16);gl(B,iTor('f',24),'#5ff2d0',null,x,.98,0,.14,.14,.14,0,Math.PI/2);gl(B,iCone(16),'#3fd9c8',null,x,1.22,0,.14,.42,.14);}}},
 analysetisch(B,lw,ld,it){cy(B,0,.86,0,.82,.06,'#f2f5f6',0,24);cy(B,0,.43,0,.16,.82,'#c8d0d4',0,12);cy(B,0,.06,0,.5,.12,'#c8d0d4',0,16);
  cy(B,0,.92,0,.36,.04,'#2b3036',0,20);gl(B,iTor('f',28),'#5ff2d0',null,0,.95,0,.34,.34,.34,0,Math.PI/2);gl(B,iTor('f',28),'#7affe8',null,0,1.3,0,.3,.3,.3);gl(B,iTor('f',28),'#7affe8',null,0,1.3,0,.3,.3,.3,0,0,Math.PI/2);
  gl(B,iOct(),'#c79bff','#e8d8ff',0,1.3,0,.13,.24,.13);gl(B,iCone(16),'#3fd9c8',null,0,1.1,0,.32,.3,.32);
  bx(B,.5,1.08,-.4,.42,.3,.03,'#2b3036',0);ap(B,'sm',.5,1.08,-.38,.38,.26,0,0,false);cy(B,.5,.95,-.42,.02,.16,'#2b3036',0,6);
  [[-.65,.6],[.65,.6]].forEach(([x,z])=>{cy(B,x,.32,z,.18,.06,'#3a5a7a',0,12);cy(B,x,.16,z,.03,.32,'#9aa6b0',0,6);});lampAt(B,0,1.4,0,'#7affe8');},
 serverschrank(B,lw,ld,it){const z=-ld/2+.32;bx(B,0,1.0,z,.8,2.0,.6,'#3a4048',0);bx(B,0,1.0,z+.305,.7,1.8,.01,'#2b3036',0);for(let j=0;j<9;j++)for(let i=0;i<4;i++)gl(B,iBox(),(i+j)%3?'#5ff2d0':'#ffc24a',null,-.22+i*.08,.3+j*.18,z+.315,.03,.02,.01);tallAt(B,it,2.0);},
 // ---- Laden ----
 warenregal(B,lw,ld,it){const c='#a87850',d=.42,z=-ld/2+.26;for(let i=0;i<=lw;i++)bx(B,-lw/2+.04+i*(lw-.08)/lw,1.0,z,.05,2.0,d,c,3);bx(B,0,2.02,z,lw,.05,d+.04,c,3);bx(B,0,1.0,-ld/2+.03,lw-.06,2.0,.02,shade(c,.75),3);
  const r=prng(it.x*17+3),caps=['#e8584a','#3d8fe0','#4cb85c','#f2c24a','#c79bff','#2cc4d8'];
  [.08,.5,.92,1.34,1.74].forEach((y,i)=>{bx(B,0,y,z,lw-.08,.03,d,shade(c,1.12),3);if(i===4)return;for(let x=-lw/2+.14;x<lw/2-.1;x+=.14){const t=r();
   if(i===1||i===2&&t<.5){const cc=caps[Math.floor(r()*caps.length)];gl(B,iOct(),cc,null,x,y+.11,z,.055,.08,.055);P_(B,'F',iTor('f',12),'#f4ead8',x,y+.11,z,.06,.06,.06,0,Math.PI/2);}
   else if(t<.45){cy(B,x,y+.1,z,.045,.16,['#d84a6a','#4cb85c','#3d8fe0','#f2a03a'][Math.floor(r()*4)],0,8);sp(B,x,y+.21,z,.03,.03,.03,'#f4ead8',0);}
   else if(t<.8){bx(B,x,y+.1,z,.12,.18,.24,['#e8d0a0','#f2e6c8','#c8e0f0','#f0c8c8'][Math.floor(r()*4)],0);bx(B,x,y+.12,z+.121,.08,.06,.002,'#c8463a',0);}
   else sp(B,x,y+.08,z,.06,.06,.06,['#e85a4a','#3d6ab0','#ffb03a'][Math.floor(r()*3)],0);
   bx(B,x,y+.008,z+d/2,.06,.03,.004,'#ffffff',0);}});tallAt(B,it,2.05);},
 seitenregal(B,lw,ld,it){FB.warenregal(B,lw,ld,it);},
 ladentheke(B,lw,ld,it){const S=B.sty,c='#b88a5c';bx(B,0,.46,.05,lw-.1,.92,.66,c,3);bx(B,0,.95,.05,lw,.05,.74,'#f0e2c8',3);bx(B,0,.55,.39,lw-.3,.5,.02,S.acc,0);gl(B,iBox(),shade(S.acc,1.25),null,0,.86,.4,lw-.3,.025,.01);
  bx(B,1.2,1.1,.0,.36,.24,.3,'#3a3a40',0);bx(B,1.2,1.25,-.08,.3,.18,.04,'#2b3036',0);ap(B,'sm',1.2,1.25,-.055,.26,.15,0,0,false);bx(B,1.25,1.0,.14,.3,.03,.14,'#5a5a62',0);
  bx(B,-1.8,.985,.05,.92,.03,.52,'#c8d4d8',0);bx(B,-1.8,1.27,.05,.92,.02,.52,'#e8f4f8',0);[[-2.24,-.19],[-1.36,-.19],[-2.24,.29],[-1.36,.29]].forEach(([x,z])=>bx(B,x,1.13,z,.025,.28,.025,'#c8d4d8',0));for(let i=0;i<4;i++)gl(B,iOct(),['#e8584a','#3d8fe0','#4cb85c','#f2c24a'][i],null,-2.1+i*.2,1.08,.05,.05,.075,.05);
  cy(B,-.4,1.04,.05,.18,.14,'#a87850',0,12,.85);[[-.45,.02],[-.35,.08],[-.42,.12],[-.36,-.03]].forEach(([x,z],i)=>sp(B,x,1.13,z,.05,.05,.05,i%2?'#3d6ab0':'#e85a4a',0));
  sp(B,.35,.98,.18,.05,.04,.05,'#e8c060',0);bx(B,2.6,1.05,.05,.3,.18,.3,'#e8d0a0',0);bx(B,2.6,1.2,.05,.24,.12,.24,'#f0c8c8',0);},
 auslage(B,lw,ld){bx(B,0,.42,0,.8,.06,.7,'#a87850',3);[[-.34,-.3],[.34,-.3],[-.34,.3],[.34,.3]].forEach(([x,z])=>cy(B,x,.2,z,.03,.4,'#7a5a3a',0,6));
  for(let j=0;j<3;j++)for(let i=0;i<3-j;i++)bx(B,-.22+i*.22+j*.11,.55+j*.18,0,.2,.18,.3,['#e8d0a0','#f2e6c8','#c8e0f0'][(i+j)%3],0);gl(B,iOct(),'#f2c24a',null,0,1.15,0,.07,.11,.07);},
 korb(B,lw,ld){cy(B,0,.22,0,.32,.44,'#b8864a',3,14,1.1);for(let i=0;i<3;i++)P_(B,'F',iTor('f',16),'#8a5a2e',0,.1+i*.14,0,.31+i*.01,.31+i*.01,.31,0,Math.PI/2);
  for(let i=0;i<7;i++)sp(B,Math.cos(i*1.9)*.16,.44+(i%3)*.04,Math.sin(i*1.9)*.16,.08,.08,.08,['#e85a4a','#ffb03a','#7ac04a','#3d6ab0'][i%4],0);bx(B,.25,.15,.25,.3,.3,.3,'#c89a62',3);},
 // ---- Kreaturenstation ----
 medizinregal(B,lw,ld,it){const z=-ld/2+.24;bx(B,0,1.0,z,.88,2.0,.44,'#f6fbfa',0);[-.38,.38].forEach(x=>bx(B,x,1.25,z+.225,.04,1.22,.02,'#d8ece6',0));bx(B,0,1.25,z+.225,.02,1.22,.02,'#d8ece6',0);
  for(let j=0;j<3;j++)for(let i=0;i<4;i++)cy(B,-.27+i*.18,.8+j*.4,z+.05,.05,.16,['#ff9aa8','#5ff2d0','#ffc24a','#9fd0ff'][(i+j)%4],0,8);
  bx(B,0,.35,z+.222,.8,.5,.01,'#e0eeea',0);glS(B,0,2.12,z+.1,.08,'#3fd9a6','#7affd0');tallAt(B,it,2.15);},
 heilgeraet(B,lw,ld,it){const S=B.sty,z=-ld/2+.3,a=S.acc;bx(B,0,.46,z+.05,2.8,.92,.5,'#f4fbf8',0);bx(B,0,.94,z+.05,2.9,.06,.56,'#e2f2ee',0);bx(B,0,.55,z+.305,2.6,.5,.01,shade(a,1.15),0);
  P_(B,'F',iTor('h',36),'#ffffff',0,1.0,z-.12,1.3,1.3,1.6);bx(B,0,1.7,z-.2,2.4,1.4,.06,'#e6f6f2',0);
  for(let j=0;j<2;j++)for(let i=0;i<3;i++){const x=(i-1)*.62,zz=z-.06+j*.24;cy(B,x,.975,zz,.13,.02,'#2b3a40',0,16);B.HG.push([iTor('f',24),a,IM(B,x,.99,zz,.12,.12,.12,Math.PI/2,0,0),null,1+j*3+i]);
   B.HG.push([iOct(),'#ffffff',IM(B,x,1.04,zz,.045,.07,.045),null,1+j*3+i]);}
  const drop=w3merge([[new THREE.SphereGeometry(.2,14,10),'#ffffff',w3M(0,-.06,0)],[new THREE.ConeGeometry(.175,.3,14),'#ffffff',w3M(0,.18,0)]]);B.own.push(drop);
  B.HG.push([drop,a,IM(B,0,2.3,z-.1),null,7]);P_(B,'F',iTor('f',28),'#ffffff',0,2.3,z-.12,.34,.34,.5);
  [-1.25,1.25].forEach(x=>{cy(B,x,1.35,z-.05,.07,1.6,'#e2f2ee',0,10);B.HG.push([iCyl(10),a,IM(B,x,1.35,z-.05,.045,1.5,.045),null,8]);});
  bx(B,-.95,1.55,z-.15,.5,.32,.03,'#2b3036',0);ap(B,'s1',-.95,1.55,z-.13,.44,.26,0,0,false);bx(B,.95,1.55,z-.15,.5,.32,.03,'#2b3036',0);ap(B,'s0',.95,1.55,z-.13,.44,.26,0,0,false);
  lampAt(B,0,1.5,z+.6,'#7affd0',2);tallAt(B,it,2.7);B.healDev=WP(B,0,1.2,z);},
 empfang(B,lw,ld,it){const S=B.sty,a=S.acc;bx(B,0,.48,.04,lw-.12,.96,.62,'#f8fcfb',0);bx(B,0,.99,.02,lw,.05,.74,'#e2f2ee',0);bx(B,0,.6,.36,lw-.4,.42,.02,shade(a,1.3),0);gl(B,iBox(),a,null,0,.86,.37,lw-.4,.03,.01);
  for(let i=-3;i<=3;i+=2)bx(B,i,.48,.37,.02,.9,.02,'#e2f2ee',0);bx(B,-1.2,1.24,-.05,.42,.3,.03,'#2b3036',0);ap(B,'s1',-1.2,1.24,-.03,.38,.26,0,0,false);cy(B,-1.2,1.05,-.07,.04,.1,'#2b3036',0,6);
  P_(B,'F',iHemi(),'#e8c060',.3,1.02,.15,.06,.05,.06);cy(B,.3,1.02,.15,.07,.01,'#7a6a5a',0,10);cy(B,2.1,1.12,.05,.06,.18,'#9fd0ff',0,10);for(let i=0;i<4;i++)sp(B,2.1+Math.cos(i*1.6)*.06,1.27+(i%2)*.04,.05+Math.sin(i*1.6)*.06,.04,.04,.04,['#ff8aa8','#ffffff','#ffd84a','#ff8aa8'][i],0);
  bx(B,-2.6,1.12,.1,.3,.22,.08,'#e2f2ee',0);for(let i=0;i<3;i++)bx(B,-2.68+i*.08,1.18,.14,.06,.16,.01,[a,'#ffc24a','#9fd0ff'][i],0);
  ap(B,'sign',0,2.6,-1.95,2.2,.45);},
 wartebank(B,lw,ld){const S=B.sty;bx(B,0,.44,.02,lw-.16,.06,.5,'#c89a62',3);bx(B,0,.78,-.24,lw-.16,.42,.06,'#c89a62',3);[-lw/2+.2,0,lw/2-.2].forEach(x=>{bx(B,x,.22,.02,.05,.44,.44,'#9aa6b0',0);});
  for(let i=0;i<2;i++){bx(B,-.45+i*.9,.5,.04,.74,.06,.42,shade(S.acc,1.25),0);bx(B,-.45+i*.9,.8,-.2,.7,.32,.06,shade(S.acc,1.1),0);}bx(B,.7,.5,.2,.22,.02,.3,'#f2e6c8',0);},
 terminal(B,lw,ld){const z=-ld/2+.36;bx(B,0,.5,z,.5,1.0,.4,'#e6eef0',0);bx(B,0,1.02,z+.05,.6,.06,.5,'#dfe6ea',0);bxr(B,0,1.35,z-.02,.64,.46,.06,'#2b3036',0,-.2,0,0);
  ap(B,'s2',0,1.35,z+.02,.58,.4,-.2,0,false);bx(B,0,1.07,z+.18,.44,.02,.14,'#3a4048',0);gl(B,iTor('f',20),B.sty.acc,null,0,.7,z+.205,.09,.09,.09);cyr(B,0,.7,z+.2,.06,.02,'#2b3a40',0,14,Math.PI/2,0,0);},
 // ---- Arena ----
 emblemwand(B,lw,ld){const S=B.sty,E=ELC[S.el]||ELC.flora;bx(B,0,.18,-.05,lw-.1,.36,.9,shade(S.fcol,.86),4);bx(B,0,.37,.38,lw-.4,.04,.12,E[0],0);
  ap(B,'em',0,2.5,-ld/2+.04,2.2,2.2);P_(B,'F',iTor('f',36),'#f4e6c0',0,2.5,-ld/2+.06,1.16,1.16,.5);
  [-2.7,2.7].forEach(x=>{bx(B,x,3.1,-ld/2+.06,.05,.05,1,'#6a5a4a',0);for(let i=0;i<3;i++)bx(B,x,2.55-i*.02,-ld/2+.1,.9,1.9,.03,i===1?E[1]:E[0],0);P_(B,'F',iCone(3),E[0],x,1.45,-ld/2+.1,.45,.4,.03,0,0,Math.PI);});
  [-3.8,3.8].forEach(x=>{cy(B,x,.6,0,.14,1.2,'#8a7a68',4,10);cy(B,x,1.25,0,.32,.14,'#6a5a4a',0,14,1.3);gl(B,S.el==='flut'?iSph(12,8):iCone(8),E[2],null,x,1.45,0,.22,S.el==='flut'?.12:.4,.22);lampAt(B,x,1.6,0,E[0]);});},
 tribuene(B,lw,ld){const S=B.sty,E=ELC[S.el]||ELC.flora;for(let i=0;i<3;i++){const h=(i+1)*.36,zz=ld/2-.33*i-.165;bx(B,0,h/2,zz,lw,h,.33,shade('#b8ab98',1-i*.05),4);bx(B,0,h+.03,zz+.05,lw-.1,.06,.2,i%2?E[0]:shade(E[0],1.25),0);}
  bx(B,0,.55,ld/2-.02,lw,.06,.05,'#6a5a4a',0);for(let x=-lw/2+.5;x<lw/2;x+=1.5)cy(B,x,.28,ld/2-.02,.025,.56,'#6a5a4a',0,6);
  for(let x=-lw/2+1.5;x<lw/2-1;x+=3){bx(B,x,3.3,-ld/2-.03,.04,.04,.9,'#6a5a4a',0);bx(B,x,2.75,-ld/2+.02,.7,1.1,.03,E[0],0);bx(B,x,2.75,-ld/2+.03,.3,.5,.01,E[2],0);}},
 saeule(B,lw,ld,it){const S=B.sty,E=ELC[S.el]||ELC.flora,el=S.el;cy(B,0,.1,0,.36,.2,'#8a7a68',4,12);cy(B,0,.8,0,.24,1.4,'#d8cfc0',4,12,.85);cy(B,0,1.55,0,.34,.14,'#b8ab98',4,12);
  if(el==='flora'){cy(B,0,1.7,0,.32,.16,'#7a5a3a',3,12,1.2);for(let i=0;i<6;i++)sp(B,Math.cos(i)*.2,1.82,Math.sin(i)*.2,.16,.1,.12,i%2?'#4cab5c':'#3a9150',0);glS(B,0,1.98,0,.1,E[2],E[2]);
   for(let i=0;i<5;i++)sp(B,Math.cos(i*1.3)*.25,.4+i*.22,Math.sin(i*1.3)*.25,.07,.05,.07,'#4cab5c',0);}
  else if(el==='flut'){cy(B,0,1.7,0,.38,.16,'#8aa8c0',4,16,1.15);gl(B,iDisc(16),'#5fb8f0','#7ad0ff',0,1.79,0,.32,.32,.32,0,-Math.PI/2);gl(B,iCone(8),'#bfe6ff',null,0,2.0,0,.05,.4,.05);}
  else if(el==='frost'){gl(B,iOct(),'#bfefff','#dff8ff',0,2.0,0,.16,.42,.16);gl(B,iOct(),'#8fd8f2',null,.14,1.85,.06,.09,.24,.09,0,0,-.5);gl(B,iOct(),'#8fd8f2',null,-.12,1.84,-.05,.08,.22,.08,0,0,.6);}
  else{cy(B,0,2.05,0,.2,.9,'#3a2a4a',0,4,.4);gl(B,iOct(),'#c79bff','#e0c8ff',0,2.62,0,.1,.18,.1);}
  lampAt(B,0,2.0,0,E[0]);},
 // ---- Liga (Kristallturm) ----
 rang(B,lw,ld,it){const S=B.sty,secC=wz=>wz>=11.5?'#e8803a':wz>=8.5?'#8aa3ff':wz>=5.5?'#2a84f0':wz>=3.5?'#7a46c8':'#f2c24a';
  for(let x=-lw/2;x<lw/2-.01;x+=1){const wz=WP(B,x+.5,0,0).z,sc=secC(wz);for(let i=0;i<3;i++){const h=.45+i*.45,zz=ld/2-.75-i*.7;bx(B,x+.5,h/2,zz,1.0,h,.7,shade('#d8d0c0',1-i*.04),4);bx(B,x+.5,h+.03,zz+.12,.96,.06,.3,i%2?sc:shade(sc,1.2),0);}
   bx(B,x+.5,.42,ld/2-.12,1.0,.84,.16,'#efe8da',4);bx(B,x+.5,.85,-ld/2+.6,1.0,1.7,1.2,'#e4dccc',4);bx(B,x+.5,1.72,-ld/2+.6,1.04,.06,1.24,'#cfc6b4',4);}
  for(let x=-lw/2+1;x<lw/2;x+=2){const wz=WP(B,x,0,0).z;gl(B,iOct(),secC(wz),null,x,1.0,ld/2-.12,.08,.16,.08);}
  for(let x=-lw/2+1.5;x<lw/2;x+=3){const wz=WP(B,x,0,0).z,sc=secC(wz);cy(B,x,S.HC/2,-ld/2+.4,.3,S.HC,'#f2ece0',4,14);cy(B,x,.15,-ld/2+.4,.42,.3,'#d8d0c0',4,14);cy(B,x,S.HC-.2,-ld/2+.4,.42,.3,'#d8d0c0',4,14);
   bx(B,x+.75,3.6,-ld/2+.12,.9,2.4,.03,sc,0);bx(B,x+.75,3.6,-ld/2+.13,.4,1.2,.01,'#fff6e0',0);P_(B,'F',iCone(3),sc,x+.75,2.25,-ld/2+.12,.45,.4,.03,0,0,Math.PI);
   B.tall.push([0,0,0,0,0]);}
  B.tall.pop();}
};

// ---------- Merge-Helfer ----------
function innUVMesh(B,list,mat){if(!list.length)return null;const pos=[],nor=[],uv=[];const n0=new THREE.Vector3(),nm=new THREE.Matrix3();
 for(const[reg,M]of list){const[u0,v0,u1,v1]=atlasUV(AREG[reg]||AREG.p0);nm.getNormalMatrix(M);n0.set(0,0,1).applyMatrix3(nm).normalize();
  const C=[[-.5,-.5,u0,v0],[.5,-.5,u1,v0],[.5,.5,u1,v1],[-.5,-.5,u0,v0],[.5,.5,u1,v1],[-.5,.5,u0,v1]];for(const[a,b,u,v]of C){const p=new THREE.Vector3(a,b,0).applyMatrix4(M);pos.push(p.x,p.y,p.z);nor.push(n0.x,n0.y,n0.z);uv.push(u,v);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.receiveShadow=true;B.own.push(g);return m;}
// Abdunkeln nach oben (weicher Deckenübergang) direkt in den Vertexfarben
// Welt-Grafik 6: Möbel-Umriss sehr dünn (6 mm) in abgedunkelter Eigenfarbe statt Schwarz
let INN_OLM=null;function innOlMat(){if(INN_OLM)return INN_OLM;const m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=normalize(normal)*.006;');sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=.4;');};
 m.customProgramCacheKey=()=>'innOl6';return INN_OLM=m;}
// Kontaktschatten unter Möbeln (eine Instanz-Ebene, weicher Fleck, warm-dunkel)
let INN_CM=null;function innContact(S,m,B){const L=(m.furn||[]).filter(it=>it.k!=='teppich');if(!L.length)return;
 const mt=INN_CM||(INN_CM=new THREE.MeshBasicMaterial({map:blobTex(),color:'#2a1a12',transparent:true,opacity:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
 const g=g3('innCt',()=>new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2)),im=new THREE.InstancedMesh(g,mt,L.length),d=new THREE.Object3D();
 L.forEach((it,i)=>{d.position.set(it.x+it.w/2,.016,it.y+it.h/2);d.scale.set(it.w*1.35+.2,1,it.h*1.35+.2);d.updateMatrix();im.setMatrixAt(i,d.matrix);});
 im.renderOrder=3;im.frustumCulled=false;im.name='innContact';S.add(im);}
function innDarkTop(g,y0,y1,k){const p=g.attributes.position,cs=[g.attributes.color,g.attributes.aNight].filter(Boolean);for(let i=0;i<p.count;i++){const t=Math.max(0,Math.min(1,(p.getY(i)-y0)/(y1-y0))),f=1-k*t*t*(3-2*t);for(const c of cs){c.setXYZ(i,c.getX(i)*f,c.getY(i)*f,c.getZ(i)*f);}}}

// ---------- Lichtbalken (Fenster → Boden), Staub, Heilgerät ----------
const BEAM_VS='attribute float aK;varying vec2 vU;varying float vK;varying vec3 vW;void main(){vU=uv;vK=aK;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const BEAM_FS='uniform float uDay;uniform float uT;uniform vec3 uCol;varying vec2 vU;varying float vK;varying vec3 vW;void main(){float a;if(vK>.5){vec2 q=fract(vU*vec2(2.,2.));float bar=smoothstep(.02,.07,q.x)*smoothstep(.98,.93,q.x)*smoothstep(.02,.07,q.y)*smoothstep(.98,.93,q.y);'+
 'float e=smoothstep(0.,.1,vU.x)*smoothstep(1.,.9,vU.x)*smoothstep(0.,.1,vU.y)*smoothstep(1.,.9,vU.y);a=.30*mix(.35,1.,bar)*e;}else{float e=smoothstep(0.,.35,vU.x)*smoothstep(1.,.65,vU.x);a=.06*e*(1.-vU.y*.75)*(.85+.15*sin(uT*.6+vW.x*1.7+vW.z*1.3));}gl_FragColor=vec4(uCol,a*uDay);}';
function innBeams(B){if(!B.beams.length)return null;const Ld=B.ld,pos=[],uv=[],kk=[];const push=(P,U,K)=>{for(const i of[0,1,2,0,2,3]){pos.push(P[i].x,P[i].y,P[i].z);uv.push(U[i][0],U[i][1]);kk.push(K);}};
 for(const C of B.beams){const F=C.map(p=>p.clone().addScaledVector(Ld,(p.y-.02)/-Ld.y));
  for(let i=0;i<4;i++){const j=(i+1)%4;push([C[i],C[j],F[j],F[i]],[[0,0],[1,0],[1,1],[0,1]],0);}push(F,[[0,0],[1,0],[1,1],[0,1]],1);B.patch.push(F);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('aK',new THREE.Float32BufferAttribute(kk,1));
 const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:{uDay:{value:1},uT:{value:0},uCol:{value:new THREE.Color('#ffe2a8')}},vertexShader:BEAM_VS,fragmentShader:BEAM_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
 m.frustumCulled=false;m.renderOrder=5;B.own.push(g,m.material);return m;}
const MOTE_VS='attribute float aS;uniform float uT;varying float vA;void main(){vec3 p=position;p.x+=sin(uT*.31+aS*17.)*.08;p.y+=sin(uT*.23+aS*9.)*.12;p.z+=cos(uT*.27+aS*13.)*.08;vec4 mv=viewMatrix*modelMatrix*vec4(p,1.);vA=.35+.65*fract(aS*7.3);gl_PointSize=clamp(26./-mv.z,1.,10.);gl_Position=projectionMatrix*mv;}';
const MOTE_FS='uniform sampler2D uTex;uniform float uDay;uniform vec3 uCol;varying float vA;void main(){float a=texture2D(uTex,gl_PointCoord).a*vA*uDay*.55;gl_FragColor=vec4(uCol,a);}';
function innMotes(B){if(!B.beams.length)return null;const r=prng(B.room.w*13+B.room.h),Ld=B.ld,pos=[],sd=[];
 for(let i=0;i<46;i++){const C=B.beams[i%B.beams.length],u=r(),v=r(),t=r()*.9,a=C[0].clone().lerp(C[1],u),b=C[3].clone().lerp(C[2],u),p=a.lerp(b,v);p.addScaledVector(Ld,(p.y-.05)/-Ld.y*t);pos.push(p.x,p.y,p.z);sd.push(r());}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('aS',new THREE.Float32BufferAttribute(sd,1));
 const m=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:{uT:{value:0},uDay:{value:1},uTex:{value:dotTex()},uCol:{value:new THREE.Color('#fff2c8')}},vertexShader:MOTE_VS,fragmentShader:MOTE_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
 m.frustumCulled=false;m.renderOrder=6;B.own.push(g,m.material);return m;}
const HEAL_VS='attribute float aMat;varying vec3 vC;varying float vK;\n#include <fog_pars_vertex>\nvoid main(){vC=color;vK=aMat;vec4 mvPosition=viewMatrix*modelMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}';
const HEAL_FS='uniform float uT;uniform float uLit;uniform float uBoost;varying vec3 vC;varying float vK;\n#include <fog_pars_fragment>\nvoid main(){float br=.78+.22*sin(uT*1.7-vK*.8);vec3 c=vC*br;'+
 'if(vK>.5&&vK<6.5){float on=step(vK-.5,uLit);c=mix(vC*(.42+.12*sin(uT*1.3+vK)),vC*(1.25+.35*sin(uT*5.+vK)),on);}c*=1.+uBoost*.8;gl_FragColor=vec4(c,1.);\n#ifdef USE_FOG\nfloat fogFactor=smoothstep(fogNear,fogFar,fogDepth);gl_FragColor.rgb=mix(gl_FragColor.rgb,fogColor,fogFactor);\n#endif\n}';

// ---------- Innenraum aufbauen (Hülle um build3d) ----------
function innBuildRoom(S,m){const sty=innStyle(m),L=new THREE.Vector3(...sty.light).normalize();
 const B={room:m,sty,M:new THREE.Matrix4(),F:[],H:[],GL:[],HG:[],AL:[],AU:[],lamps:[],tall:[],hang:[],beams:[],patch:[],ceilL:[],own:[],tex:[],ld:L.clone().negate(),healDev:null};
 // 09-Kästen (Wände/Regale/Theken/Kisten/Pflanzen) und gemalten Boden entfernen – hier ersetzt
 const kill=new Set(['wallI','shelf','counter','box','plant'].map(k=>W3GEO[k]).filter(Boolean));
 for(const o of S.children.slice()){if(o.isInstancedMesh&&kill.has(o.geometry)){S.remove(o);if(o.dispose)o.dispose();}
  else if(o.isMesh&&o.material&&o.material.map&&o.material.map.isCanvasTexture&&o.geometry&&o.geometry.parameters&&o.geometry.parameters.width===m.w&&o.geometry.parameters.height===m.h){S.remove(o);o.material.map.dispose();o.material.dispose();o.geometry.dispose();}}
 innShell(B);
 for(const it of m.furn||[]){const W=m.w,H=m.h;let side='f';
  if(it.y===1&&it.w>=it.h)side='n';else if(it.x===1&&it.h>=it.w)side='w';else if(it.x+it.w===W-1&&it.h>=it.w)side='e';else if(it.y+it.h===H-1)side='s';else if(it.y===1)side='n';else if(it.x===1)side='w';else if(it.x+it.w===W-1)side='e';
  const ry={n:0,f:0,w:Math.PI/2,e:-Math.PI/2,s:Math.PI}[side],rot=side==='w'||side==='e',lw=rot?it.h:it.w,ld=rot?it.w:it.h;
  B.M=new THREE.Matrix4().compose(new THREE.Vector3(it.x+it.w/2,0,it.y+it.h/2),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1));
  const f=FB[it.k];if(f)try{f(B,lw,ld,it);}catch(e){console.error('Innenraum',it.k,e);}
  if(it.t==='B'&&!B.tall.some(q=>q[0]===it.x&&q[1]===it.y&&q[2]===it.x+it.w))tallAt(B,it,it.k==='rang'?1.5:it.k==='tribuene'?1.15:it.k==='emblemwand'?.4:2.15);}
 // Teppiche / Spielfeld (flach, auf freien Feldern ≤ 0,02 hoch)
 B.M=new THREE.Matrix4();const sty2=sty;
 if(sty.k==='house'){ap(B,'rug',3.6,.012,5.4,2.6,1.7,-Math.PI/2);ap(B,'rug2',7,.011,6.4,1.8,.6,-Math.PI/2);}
 else if(sty.k==='shop'||sty.k==='heal'){ap(B,'rug',5.5,.012,5.6,2.6,1.6,-Math.PI/2);}
 else if(sty.k==='lab'){ap(B,'rug2',5.5,.012,2.6,3.2,.8,-Math.PI/2);}
 else if(sty.k==='arena'){ap(B,'em',5.5,.012,6.5,2.8,2.8,-Math.PI/2);const E=ELC[sty.el]||ELC.flora,lc='#f6f0e2';
  [[5.5,2.15,6.9,.06],[5.5,10.85,6.9,.06],[2.05,6.5,.06,8.7],[8.95,6.5,.06,8.7],[5.5,6.5,6.9,.05]].forEach(([x,z,w,d])=>bx(B,x,.006,z,w,.012,d,lc,0,0,'H'));
  [[5.5,3.4],[5.5,9.6]].forEach(([x,z])=>bx(B,x,.008,z,1.2,.012,.08,E[0],0,0,'H'));
  if(sty.el==='frost')for(let i=0;i<26;i++){const x=1.3+hs(i,3)*8.4,z=1.2+hs(i,9)*.5;gl(B,iCone(5),'#dff8ff',null,x,sty.HC-.35,z+hs(i,5)*10,.05,.5+hs(i,7)*.4,.05,0,0,0,Math.PI);}
  if(sty.el==='schatten')for(let i=0;i<40;i++)gl(B,iSph(6,4),'#e0d0ff',null,1.4+hs(i,4)*8.2,sty.HC-.08,1.4+hs(i,8)*10.2,.03,.03,.03);
  if(sty.el==='flora')for(let i=0;i<14;i++){const x=1.05,z=1.6+i*.72;sp(B,x,3.0+hs(i,2)*1.2,z,.18,.12,.16,i%2?'#4cab5c':'#3a9150',0);sp(B,9.95,3.0+hs(i,6)*1.2,z,.18,.12,.16,i%2?'#3a9150':'#4cab5c',0);}
  if(sty.el==='flut')[[1.06,'w'],[9.94,'e']].forEach(([x])=>{gl(B,iBox(),'#5fb8f0','#7ad0ff',x,.9,6.5,.04,.05,9.2);});
  for(let z=3;z<=10;z+=3.5)for(const x of[3,8]){bx(B,x,sty.HC-.6,z,.04,1.2,.04,'#6a5a4a',0,0,'H');cy(B,x,sty.HC-1.25,z,.3,.3,'#3a3236',0,10,.5);glS(B,x,sty.HC-1.36,z,.12,'#fff2d0','#ffe8b0');lampAt(B,x,sty.HC-1.5,z,'#ffe2b0');B.hang.push([x,z,sty.HC-1.5]);}
  for(let z=2.5;z<11;z+=3)gl(B,iBox(),'#dff0ff','#22305a',5.5,sty.HC+.0,z,3,.02,1.2,1);}
 else if(sty.k==='liga'){bx(B,5.5,.008,8.5,.8,.016,15.2,'#b8463a',0,0,'H');bx(B,5.5,.01,8.5,.56,.016,15.2,'#e8c060',0,0,'H');
  for(let z=2;z<16;z+=3){cy(B,5.5,sty.HC-.9,z,.02,1.8,'#c8a060',0,6,1,'H');P_(B,'F',iTor('f',20),'#e8c060',5.5,sty.HC-1.8,z,.5,.5,.5,0,Math.PI/2);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;gl(B,iOct(),'#fff6d8','#fff0c0',5.5+Math.cos(a)*.5,sty.HC-1.95,z+Math.sin(a)*.5,.05,.1,.05);}lampAt(B,5.5,sty.HC-2.1,z,'#ffe8b8');B.hang.push([5.5,z,sty.HC-2.1]);}
  [[5.5,3.2,.42,.9],[4.95,2.7,.24,.5],[6.05,2.7,.24,.5],[5.2,3.9,.18,.4],[5.8,3.9,.18,.4]].forEach(([x,y,s,h])=>gl(B,iOct(),'#f6e6a8','#fff2c0',x,y,1.05,s,h,s*.4));}
 // Deckenlampen (Haus/Laden): Pendel über freien Feldern
 if(sty.k==='house'){[[3.5,2.5],[4.5,5.5]].forEach(([x,z],i)=>{if(i===0){cy(B,x,sty.HC-.35,z,.008,.7,'#3a3236',0,4,1,'H');cy(B,x,sty.HC-.78,z,.2,.18,shade(sty.acc,1.1),0,12,.4);glS(B,x,sty.HC-.86,z,.06,'#ffe6a0','#fff2c0');lampAt(B,x,sty.HC-.95,z,'#ffc27a');B.hang.push([x,z,sty.HC-1]);}});}
 if(sty.k==='shop'){[[3,5],[8,5]].forEach(([x,z])=>{cy(B,x,sty.HC-.3,z,.008,.6,'#3a3236',0,4,1,'H');cy(B,x,sty.HC-.66,z,.22,.2,'#e8913a',0,12,.4);glS(B,x,sty.HC-.74,z,.07,'#ffe6a0','#fff2c0');lampAt(B,x,sty.HC-.85,z,'#ffc27a');B.hang.push([x,z,sty.HC-.9]);});
  for(let i=0;i<9;i++){const x=1.5+i,y=sty.HC-.4-Math.sin(i/8*Math.PI)*.35;gl(B,iOct(),['#e8584a','#3d8fe0','#4cb85c','#f2c24a','#c79bff'][i%5],null,x,y,4.6,.05,.08,.05);}cyr(B,5.5,sty.HC-.6,4.6,.006,9,'#6a4a32',0,4,0,0,Math.PI/2,'H');
  B.M=new THREE.Matrix4();ap(B,'sign',5.5,2.45,1.06,2.6,.54);bx(B,5.5,2.45,1.03,2.76,.66,.04,'#6a4a32',3);ap(B,'s0',2.6,1.65,1.06,.9,.56);bx(B,2.6,1.65,1.03,1.0,.66,.04,'#6a4a32',3);}
 for(const q of B.ceilL)B.lamps.push([q[0],q[1],q[2],sty.lamp,0]);
 // Bilder an freien Wandstellen (Haus, Laden, Labor, Station)
 const PICS={house:[['n',6.4,1.75,.7,.52,'p0'],['w',2.0,1.75,.62,.46,'p1'],['e',6.2,1.85,.5,.62,'pt'],['n',2.5,2.25,.5,.36,'p1']],shop:[['e',5.8,1.75,.7,.5,'p0']],lab:[['e',5.6,1.75,.8,.56,'p0'],['w',5.2,1.75,.7,.5,'p1']],heal:[['e',5.4,1.75,.7,.52,'p0'],['w',4.0,1.95,.6,.44,'p1']]}[sty.k]||[];
 for(const[sd,pos,y,w,h,reg]of PICS){const W=m.w,H=m.h,cx=sd==='w'?1:sd==='e'?W-1:pos,cz=sd==='n'?1:pos,ry=sd==='w'?Math.PI/2:sd==='e'?-Math.PI/2:0;
  B.M=new THREE.Matrix4().compose(new THREE.Vector3(cx,0,cz),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1));
  bx(B,0,y,.03,w+.1,h+.1,.04,sty.k==='lab'||sty.k==='heal'?'#e8eef0':'#8a5a3a',3,0,'H');ap(B,reg,0,y,.055,w,h);}
 B.M=new THREE.Matrix4();
 // Atlas malen
 const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const c=cv.getContext('2d');c.fillStyle='#e8dcc8';c.fillRect(0,0,1024,512);
 const pk=sty.pics||['land','meer','berg'],sd0=(m.id.length*131+m.id.charCodeAt(0))|0;paint(c,AREG.p0,pk[0],sd0);paint(c,AREG.p1,pk[1],sd0+7);paint(c,AREG.p2,pk[2]||'land',sd0+13);paint(c,AREG.p3,'blume',sd0+3);paint(c,AREG.pt,pk[2]||'kristall',sd0+21);
 const kS=sty.k==='heal'?['herz','box','box']:sty.k==='shop'?['text','karte','karte']:['graph','scan','karte'];screen(c,AREG.s0,kS[0]);screen(c,AREG.s1,kS[1]);screen(c,AREG.s2,kS[2]);screen(c,AREG.sm,'graph');
 if(sty.k==='shop'){c.save();c.fillStyle='#2f3a34';c.fillRect(4,160,256,160);c.fillStyle='#f4ead8';c.font='bold 22px sans-serif';c.fillText('Heute frisch:',16,192);c.font='18px sans-serif';['Fangkapseln','Kräutertränke','Beeren'].forEach((t,i)=>c.fillText('· '+t,20,226+i*28));c.restore();}
 signPaint(c,AREG.sign,sty.k==='heal'?'Kreaturenstation':(INTERIORS[m.id]||{}).name||'Laden',sty.k==='heal'?'#f6fffb':'#4a3424',sty.k==='heal'?shade(sty.acc,.7):'#f6e6c0');
 rugPaint(c,AREG.rug,sty.rug||['#8a4a3a','#f2dcb0','#3a6a8a'],true);rugPaint(c,AREG.rug2,(sty.rug||['#8a4a3a','#f2dcb0','#3a6a8a']).slice().reverse(),false);
 const el=sty.el||(sty.k==='liga'?'lumen':'kristall');emblemPaint(c,AREG.em,el,(ELC[el]||ELC.lumen)[0]);
 const tex=new THREE.CanvasTexture(cv);tex.anisotropy=Math.min(4,R3.r.capabilities.getMaxAnisotropy());B.tex.push(tex);
 // Meshes
 const own=B.own,add=(o,sh)=>{if(!o)return;o.castShadow=!!sh;o.receiveShadow=true;o.frustumCulled=false;S.add(o);return o;};
 const gH=w3merge(B.H);innDarkTop(gH,1.6,sty.HC+.1,.42);own.push(gH);add(new THREE.Mesh(gH,townMat()),false).name='innShell';
 if(B.F.length){const gF=w3merge(B.F);innDarkTop(gF,1.8,sty.HC+.1,.22);own.push(gF);const fm=add(new THREE.Mesh(gF,townMat()),true);fm.name='innFurn';const ol=new THREE.Mesh(gF,innOlMat());ol.userData.outline=1;ol.frustumCulled=false;fm.add(ol);innContact(S,m,B);}
 const lit=new THREE.MeshToonMaterial({map:tex,gradientMap:toonGrad(),alphaTest:.4,side:THREE.DoubleSide});const unl=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});own.push(lit,unl);
 add(innUVMesh(B,B.AL,lit),false);add(innUVMesh(B,B.AU,unl),false);
 if(B.GL.length){const gm=glowMesh(B.GL);gm.name='innGlow';own.push(gm.geometry,gm.material);S.add(gm);if(!S.userData.glow)S.userData.glow=gm;else{S.userData.innGlow=gm;}}
 let heal=null;if(B.HG.length){const g=w3merge(B.HG);own.push(g);heal=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:Object.assign({uT:{value:0},uLit:{value:0},uBoost:{value:0}},THREE.UniformsUtils.clone(THREE.UniformsLib.fog)),vertexShader:HEAL_VS,fragmentShader:HEAL_FS,vertexColors:true,fog:true}));
  heal.frustumCulled=false;heal.name='innHeal';own.push(heal.material);S.add(heal);}
 const beams=innBeams(B),motes=innMotes(B);if(beams)S.add(beams);if(motes)S.add(motes);
 const HC=sty.HC;S.userData.inn={kind:'room',sty,HC,bounds:[1,1,m.w-1,m.h-1+VZD],tall:B.tall,hang:B.hang,lamps:B.lamps,sun:L,beams,motes,heal,glow:S.userData.innGlow||S.userData.glow,own,tex:B.tex,
  camD:sty.k==='arena'?3.4:sty.k==='liga'?3.2:2.75,camH:sty.k==='arena'||sty.k==='liga'?2.85:2.5};}

// ---------- Höhlen ----------
const CAVE_ST={
 nebel:{rock:'#5d5262',rock2:'#857890',lid:'#2c2430',crys:'#9fe4f2',crys2:'#c79bff',mist:'#a8d0e0',mistA:.34,pud:0,pudC:'#14303c',pudG:'#6fe0f0',fog:'#1b1724',hemi:['#aa9ad0','#3a2e38',1.0]},
 glut:{rock:'#4c3430',rock2:'#74483a',lid:'#26171a',crys:'#ffb04a',crys2:'#ff6a2a',mist:'#ff9a5a',mistA:.16,pud:1,pudC:'#ff5a1a',pudG:'#ffd070',fog:'#2a1512',hemi:['#ffb08a','#3a1e18',.95]},
 frost:{rock:'#6c8299',rock2:'#b2cce2',lid:'#2a3444',crys:'#bfefff',crys2:'#8ab8ff',mist:'#e6f6ff',mistA:.3,pud:2,pudC:'#7ab4d8',pudG:'#ffffff',fog:'#1a2232',hemi:['#bcd8ff','#2e3a4a',1.05]},
 schatten:{rock:'#3f3549',rock2:'#5e4c70',lid:'#1a1420',crys:'#c79bff',crys2:'#ff8ad8',mist:'#9a7ad8',mistA:.28,pud:3,pudC:'#24143a',pudG:'#c79bff',fog:'#130d1a',hemi:['#9a88cc','#2a2030',.9]}};
function caveStyle(m){const s=(MAPS[m.id]&&MAPS[m.id].caveStyle)||m.caveStyle;if(s&&CAVE_ST[s])return s;const id=m.id||'';return/glut|lava|magma|vulkan/.test(id)?'glut':/frost|eis|gletscher/.test(id)?'frost':/schatt|moor|nacht|daemmer/.test(id)?'schatten':'nebel';}
let CAVE_RMAT=null;function caveRockMat(){return CAVE_RMAT||(CAVE_RMAT=addRim(addDetail(toonFx(new THREE.MeshToonMaterial({color:'#ffffff',vertexColors:true,gradientMap:toonGrad()}),{nf:0}),'rock',.75),'#bfdcff',.2));}// Welt-Grafik 3: Feuchtglanz an den Kanten
const MIST_VS='attribute float aL;varying vec3 vW;varying float vL;varying float vD;void main(){vL=aL;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mv=viewMatrix*w;vD=-mv.z;gl_Position=projectionMatrix*mv;}';
const MIST_FS='uniform sampler2D uC;uniform float uT;uniform vec3 uCol;uniform float uA;varying vec3 vW;varying float vL;varying float vD;void main(){vec2 p=vW.xz*(.07+vL*.03)+vL*.37;'+
 'float n=texture2D(uC,p+vec2(uT*.007,uT*.004)).r*.62+texture2D(uC,p*2.2-vec2(uT*.011,uT*.003)).g*.38;float a=smoothstep(.36,.82,n)*uA*(1.-vL*.45);a*=smoothstep(.6,2.6,vD)*(1.-smoothstep(16.,26.,vD));gl_FragColor=vec4(uCol,a);}';
const PUD_VS='attribute float aS;varying vec2 vU;varying float vS;varying vec3 vW;void main(){vU=uv;vS=aS;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const PUD_FS='uniform float uT;uniform float uK;uniform vec3 uC;uniform vec3 uG;varying vec2 vU;varying float vS;varying vec3 vW;void main(){vec2 q=vU*2.-1.;float r=length(q);if(r>1.)discard;float e=smoothstep(1.,.78,r);'+
 'vec3 V=normalize(cameraPosition-vW);float fr=pow(1.-abs(V.y),2.2);vec3 c;float a=.85*e;'+
 'if(uK<.5){float rip=smoothstep(.92,1.,sin(r*30.-uT*2.2-vS*9.)*.5+.5)*smoothstep(.95,.2,r)*step(.5,fract(vS*3.7+uT*.05));c=uC+uG*(fr*.55+rip*.35)+vec3(.9)*pow(max(0.,1.-length(q-vec2(.3,-.25))*2.4),6.)*.4;}'+
 'else if(uK<1.5){float crust=smoothstep(.45,.6,fract(sin(dot(floor(q*6.+vS*9.),vec2(12.9,78.2)))*437.5)+.25*sin(uT+vS*6.));c=mix(uG*1.25,uC,smoothstep(.0,.9,r))*(1.-crust*.55)+uG*.25*sin(uT*1.6+vS*7.);a=e;}'+
 'else if(uK<2.5){c=mix(uC,uG,fr*.7)+vec3(1.)*smoothstep(.97,1.,sin((q.x+q.y)*10.+vS*8.))*.35;a=.9*e;}'+
 'else{c=uC+uG*(fr*.5+.15*sin(uT*1.2+vS*8.+r*6.));a=.9*e;}gl_FragColor=vec4(c,a);}';
function caveBuild(S,m){const st=caveStyle(m),C=CAVE_ST[st],W=m.w,H=m.h,LID=4.8,T=(x,y)=>tileAt(m,x,y),isX=(x,y)=>{const t=T(x,y);return t===null||t==='X';};
 // 09-Wandfelsen (weich) entfernen – facettierte Felsen ersetzen sie
 const nX=m.rows.reduce((a,r)=>a+[...r].filter(c=>c==='X').length,0);
 for(const o of S.children.slice())if(o.isInstancedMesh&&MAT.rock&&o.material===MAT.rock&&o.count===nX*2){S.remove(o);if(o.dispose)o.dispose();}
 // Tiefe der Wandfelder (Abstand zum begehbaren Boden)
 const D=new Int16Array(W*H).fill(99),q=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!isX(x,y)){D[y*W+x]=0;q.push([x,y]);}
 while(q.length){const[x,y]=q.shift(),d=D[y*W+x];for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const u=x+a,v=y+b;if(u<0||v<0||u>=W||v>=H)continue;if(D[v*W+u]>d+1){D[v*W+u]=d+1;q.push([u,v]);}}}
 const R=[],GLc=[],tall=[],rk=(x,y,z,sx,sy,sz,c,v,ry)=>R.push([iRock(v%8),c,w3M(x,y,z,sx,sy,sz,0,ry||0,0),null,0]),cA=new THREE.Color(C.rock),cB=new THREE.Color(C.rock2);
 const col=i=>'#'+cA.clone().lerp(cB,hs(i,17)*.8).getHexString();
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!isX(x,y))continue;const d=D[y*W+x],i=y*W+x,j1=hs(x*3,y*5),j2=hs(y*7,x*3);
  const h=d<=1?1.9+j1*.9:d===2?3.0+j1*.9:LID+.3;tall.push([x,y,x+1,y+1,d<=1?h*.8:h]);
  {const nL=Math.max(2,Math.round(h/.95)),lh=h/nL;for(let k=0;k<nL;k++){const jk=hs(i+k*7,k*13),jz=hs(k*5,i+3);// Welt-Grafik 3: Felswand in Schichten (gerundete Bänke, leicht versetzt)
   rk(x+.5+(j1-.5)*.25+(jk-.5)*.16,(k+.5)*lh-.05,y+.5+(j2-.5)*.25+(jz-.5)*.16,(.8+j2*.14)*(1-k*.05),lh*.66,(.8+j1*.14)*(1-k*.05),col(i+k*3),i+k,j1*6+k*1.3);}}
  if(d<=1){rk(x+.5+(j2-.5)*.3,h*.95,y+.5+(j1-.5)*.3,.42,.38+j2*.2,.42,col(i+3),i+5,j2*6);
   for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){if(isX(x+a,y+b)||hs(x*11+a,y*13+b)>.45)continue;const px=x+.5+a*.46,pz=y+.5+b*.46;
    R.push([iCone(6),col(i+7),w3M(px,.28,pz,.16+j1*.08,.6+j2*.5,.16+j2*.08,0,j1*3,0),null,0]);
    if(hs(x*5+a,y*3+b)<.35)GLc.push([iOct(),C.crys,w3M(px+(j2-.5)*.2,.18,pz,.07,.18+j1*.12,.07,0,j1*3,(j2-.5)*.6),C.crys2,0]);}}}
 // Ausgänge am Kartenrand: Tunnel mit Tageslicht (Kamera darf hinein – Blick beim Betreten in die Höhle)
 const tun=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=T(x,y);if(!/[0-9]/.test(t||''))continue;if(y===H-1)tun.push({s:'s',x0:x-.3,x1:x+1.3,z0:H-.05,z1:H+2.4});else if(y===0)tun.push({s:'n',x0:x-.3,x1:x+1.3,z0:-2.4,z1:.05});}
 const segs=(a0,a1,gaps)=>{const out=[];let a=a0;for(const[g0,g1]of gaps.sort((u,v)=>u[0]-v[0])){if(g0>a)out.push([a,g0]);a=Math.max(a,g1);}if(a<a1)out.push([a,a1]);return out;};
 for(const[sd,zc]of[['n',-1.2],['s',H+1.2]])for(const[a,b]of segs(-3,W+3,tun.filter(q=>q.s===sd).map(q=>[q.x0,q.x1])))R.push([iBox(),C.lid,w3M((a+b)/2,LID/2,zc,b-a,LID+.4,2.4),null,0]);
 [[-1.2,H/2,2.4,H+6],[W+1.2,H/2,2.4,H+6]].forEach(([x,z,w,d])=>R.push([iBox(),C.lid,w3M(x,LID/2,z,w,LID+.4,d),null,0]));
 for(const q of tun){const zf=q.s==='s'?q.z1:q.z0,zm=(q.z0+q.z1)/2,len=q.z1-q.z0;R.push([iBox(),C.lid,w3M((q.x0+q.x1)/2,(2.9+LID)/2,zm,q.x1-q.x0+.2,LID-2.9+.2,len),null,0]);
  for(let k=0;k<5;k++){const zz=q.z0+(k+.5)*len/5;rk(q.x0-.4,1.3,zz,.42,1.5,.55,col(k*11+3),k+2,k);rk(q.x1+.4,1.3,zz,.42,1.5,.55,col(k*7+5),k+4,k*2);R.push([iRock((k+6)%8),col(k*3),w3M((q.x0+q.x1)/2+(hs(k,4)-.5)*.6,2.95,zz,.6,.35,.55,0,k,0),null,0]);}
  GLc.push([iBox(),'#fff4d8',w3M((q.x0+q.x1)/2,1.4,zf,q.x1-q.x0,2.8,.02),'#2a3458',0]);}
 R.push([iBox(),C.lid,w3M(W/2,LID+.15,H/2,W+6,.3,H+6),null,0]);
 for(let y=-1;y<=H;y++)for(let x=-1;x<=W;x++){const r=hs(x*17+3,y*29+5);if(r>.62)continue;const over=isX(x,y),d=over?(x<0||y<0||x>=W||y>=H?3:D[y*W+x]):0,j=hs(x*5,y*9);
  const len=over?(d>=2?1.4+j*1.6:.9+j*1.1):.35+j*.35,px=x+.5+(hs(y,x)-.5)*.5,pz=y+.5+(hs(x,y*3)-.5)*.5;R.push([iCone(6),col(x*7+y),w3M(px,LID-len/2,pz,.12+j*.14,len,.12+j*.12,Math.PI,j*4,0),null,0]);
  if(!over&&r<.12)GLc.push([iOct(),C.crys,w3M(px,LID-len-.06,pz,.05,.09,.05,0,j*3,0),C.crys2,0]);}
 if(st==='frost')for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!isX(x,y)||D[y*W+x]!==1||hs(x*9,y*7)>.4)continue;GLc.push([iCone(5),'#dff6ff',w3M(x+.5,LID-.9,y+.5,.07,1.3,.07,Math.PI,0,0),'#eafaff',0]);}
 const g=w3merge(R);// Schichtung: unten dunkler, Mitte heller, oben in den Deckel abdunkeln
 {const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const y=p.getY(i),f=(.72+.28*Math.min(1,y/1.2))*(1-.45*Math.max(0,Math.min(1,(y-2.2)/2.4)))*(.92+.16*Math.sin(y*5.5+p.getX(i)*.7));c.setXYZ(i,c.getX(i)*f,c.getY(i)*f,c.getZ(i)*f);}}
 const own=[g],rm=new THREE.Mesh(g,caveRockMat());rm.castShadow=false;rm.receiveShadow=true;rm.frustumCulled=false;rm.name='innCaveRock';S.add(rm);
 if(st!=='nebel'&&S.userData.glow){const ga=S.userData.glow.geometry,cc=new THREE.Color(C.crys);for(const an of['color','aNight']){const a=ga.attributes[an];if(!a)continue;for(let i=0;i<a.count;i++){const v=new THREE.Color(a.getX(i),a.getY(i),a.getZ(i));if(v.b>v.r*1.05){v.lerp(cc,.75);a.setXYZ(i,v.r,v.g,v.b);}}a.needsUpdate=true;}}
 let glw=null;if(GLc.length){glw=glowMesh(GLc);glw.name='innCaveGlow';own.push(glw.geometry,glw.material);S.add(glw);}
 // Bodennebel (zwei Lagen in einem Mesh)
 {const pos=[],al=[];for(const[L,y]of[[0,.2],[1,.55]]){const x0=-1,x1=W+1,z0=-1,z1=H+1;[[x0,z0],[x1,z0],[x1,z1],[x0,z0],[x1,z1],[x0,z1]].forEach(([x,z])=>{pos.push(x,y,z);al.push(L);});}
  const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));mg.setAttribute('aL',new THREE.Float32BufferAttribute(al,1));
  const mm=new THREE.Mesh(mg,new THREE.ShaderMaterial({uniforms:{uC:{value:w3texCloud()},uT:{value:0},uCol:{value:new THREE.Color(C.mist)},uA:{value:C.mistA}},vertexShader:MIST_VS,fragmentShader:MIST_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  mm.frustumCulled=false;mm.renderOrder=4;mm.name='innMist';S.add(mm);own.push(mg,mm.material);var mist=mm;}
 // Pfützen / Lava / Eis / Tinte auf freien Bodenfeldern (flach)
 let pud=null;{const pos=[],uv=[],ss=[];const occ=new Set((NPCS[m.id]||[]).map(n=>n.x+','+n.y));
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const t=T(x,y);if(t!==':'&&t!=='c')continue;if(occ.has(x+','+y)||hs(x*13,y*17)>(t===':'?.16:.06))continue;
   const r=.28+hs(x,y*5)*.22,cx=x+.5+(hs(y*3,x)-.5)*.3,cz=y+.5+(hs(x*3,y)-.5)*.3;let yy=0;for(const[a,b]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]])yy=Math.max(yy,TER[m.id]?terrH(TER[m.id],cx+a,cz+b):0);yy+=.018;
   const sx=r*(1+hs(x,y)*.6),sz=r,rot=hs(y,x)*3,cs=Math.cos(rot),sn=Math.sin(rot),s=hs(x*7,y*7);
   for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){const lx=a*sx,lz=b*sz;pos.push(cx+lx*cs-lz*sn,yy,cz+lx*sn+lz*cs);uv.push((a+1)/2,(b+1)/2);ss.push(s);}}
  if(pos.length){const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));pg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));pg.setAttribute('aS',new THREE.Float32BufferAttribute(ss,1));
   pud=new THREE.Mesh(pg,new THREE.ShaderMaterial({uniforms:{uT:{value:0},uK:{value:C.pud},uC:{value:new THREE.Color(C.pudC)},uG:{value:new THREE.Color(C.pudG)}},vertexShader:PUD_VS,fragmentShader:PUD_FS,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
   pud.frustumCulled=false;pud.renderOrder=2;pud.name='innPud';S.add(pud);own.push(pg,pud.material);
   if(C.pud===1){const P=[];for(let i=0;i<pos.length;i+=18)P.push([(pos[i]+pos[i+3]+pos[i+6]+pos[i+12])/4,.4,(pos[i+2]+pos[i+5]+pos[i+8]+pos[i+14])/4,'#ff7a2a']);S.userData.torch.push(...P.slice(0,6));}}}
 S.userData.inn={kind:'cave',st,C,LID,W,H,D,tall,tun,own,tex:[],mist,pud,glow:glw,camD:3.3,camH:2.3};}

// ---------- build3d-Hülle ----------
if(typeof build3d==='function'){const _b3Inn=build3d;build3d=function(){const S=_b3Inn.apply(this,arguments);try{const m=cur;
  if(m&&m.inside&&m.furn)innBuildRoom(S,m);else if(m&&m.theme==='cave')caveBuild(S,m);
  if(S.userData.inn){const U=S.userData.inn;let fn=S.onBeforeRender;const wrap=function(r,s,c){try{innFrame(s,c);}catch(e){console.error('Innen',e);}return fn&&fn.call(this,r,s,c);};
   Object.defineProperty(S,'onBeforeRender',{configurable:true,get(){return wrap;},set(f){fn=f;}});U.frame=0;}}catch(e){console.error('Innenraum-Aufbau',e);}return S;};}

// ---------- je Bild (innerste Stufe): Kamera, Licht, Animation ----------
const _iv=new THREE.Vector3(),_iv2=new THREE.Vector3(),_ic=new THREE.Color();
// Blick so ausrichten, dass der Kopf knapp unter der Bildmitte steht (nie im unteren Drittel); sehr nah → flacher Blick nach vorn, Figur aus
function innAim(c,p,dx,dz){const hy=p.y+1.45,hd=Math.hypot(p.x-c.position.x,p.z-c.position.z),ph=INN.cd>.7?Math.atan2(c.position.y-hy,Math.max(.2,hd))-.05:.32,pt=Math.max(.1,Math.min(1.0,ph));
 _iv.set(c.position.x+dx*Math.cos(pt)*4,c.position.y-Math.sin(pt)*4,c.position.z+dz*Math.cos(pt)*4);c.lookAt(_iv);}
function innFrame(S,c){const U=S.userData.inn;if(!U||!R3||S!==R3.scene)return;const now=performance.now(),t=now/1000,h=G?G.time/60:12,K=typeof skyAt==='function'?skyAt(h):{day:1},day=K.day,night=1-day;
 const dt=Math.min(.1,Math.max(.001,(now-(U.lt||now-16))/1000));U.lt=now;U.frame++;const pl=R3.player;
 if(U.kind==='room'){const sty=U.sty;
  // Licht: Fensterlicht am Tag (Sonnenrichtung durchs Fenster), abends warme Lampen, nachts Mondblau
  R3.hemi.color.set(sty.hemi[0]).lerp(_ic.set('#9aa8d8'),night*.35);R3.hemi.groundColor.set(sty.hemi[1]);R3.hemi.intensity=sty.hemi[2]*(.72+.45*day);// Welt-Grafik 6: mehr Raumlicht, weichere Sonne
  R3.sun.color.set('#fff0d6').lerp(_ic.set('#8fa6ff'),night*.85);R3.sun.intensity=.14+.46*day;const tg=R3.sun.target.position;R3.sun.position.set(tg.x+U.sun.x*14,U.sun.y*14,tg.z+U.sun.z*14);R3.sun.updateMatrixWorld();
  const px=pl.position.x,pz=pl.position.z;let b0=null,b1=null,d0=1e9,d1=1e9;for(const q of U.lamps){const dd=(q[0]-px)**2+(q[2]-pz)**2;if(dd<d0){b1=b0;d1=d0;b0=q;d0=dd;}else if(dd<d1){b1=q;d1=dd;}}
  R3.pl.forEach((l,i)=>{const q=i?b1:b0;if(!q||!SET.light){l.intensity=0;return;}l.color.set(q[3]);l.position.set(q[0],q[1],q[2]);l.distance=q[4]===1?6:6.5;
   l.intensity=(q[4]===1?1.15+Math.sin(t*11)*.12+Math.sin(t*7.3)*.08:q[4]===2?.7+.25*(INN.heal.boost||0):.42+.95*night);});
  if(U.beams){const u=U.beams.material.uniforms;u.uDay.value=Math.max(0,day*1.15-.15);u.uT.value=t;u.uCol.value.set('#ffe6b0').lerp(_ic.set('#ffb070'),Math.max(0,1-Math.abs(h-18)/2.5)*.6);}
  if(U.motes){const u=U.motes.material.uniforms;u.uDay.value=Math.max(0,day*1.15-.15);u.uT.value=t;}
  if(U.heal){const u=U.heal.material.uniforms,H_=INN.heal;u.uT.value=t;u.uLit.value=H_.on?H_.lit:0;H_.boost=Math.max(0,(H_.boost||0)-dt*.6*(H_.on?0:1));u.uBoost.value=H_.boost;}
  // Kamera (nur 3. Person, Erkundung): Abstand/Höhe für kleine Räume, Kopf im mittleren Bilddrittel; immer: innerhalb der Wände, unter der Decke, nicht in hohen Möbeln
  const cm=typeof camMode==='function'?camMode():'explore',save=c===R3.cam&&!INN.cam;if(save)INN.cam={p:c.position.clone(),q:c.quaternion.clone()};
  const[bx0,bz0,bx1,bz1]=U.bounds,mg=.32,HC=U.HC;
  if(c===R3.cam&&cm==='explore'&&view==='third'){const p=pl.position,gy=p.y;let dx=p.x-c.position.x,dz=p.z-c.position.z;const L0=Math.hypot(dx,dz);if(L0<.05){dx=-Math.sin(R3.yaw);dz=-Math.cos(R3.yaw);}else{dx/=L0;dz/=L0;}
   // freie Strecke hinter der Figur bis zur Wand (Raum-AABB)
   let Dm=9;const ex=-dx,ez=-dz;if(ex>1e-4)Dm=Math.min(Dm,(bx1-mg-p.x)/ex);if(ex<-1e-4)Dm=Math.min(Dm,(bx0+mg-p.x)/ex);if(ez>1e-4)Dm=Math.min(Dm,(bz1-mg-p.z)/ez);if(ez<-1e-4)Dm=Math.min(Dm,(bz0+mg-p.z)/ez);
   Dm=Math.max(.35,Dm);const D=Math.min(U.camD,Dm),short=U.camD-D,Hh=Math.min(HC-.38,Math.max(2.05,U.camH-short*.18)),snap=R3.snap||INN.room!==S.uuid;INN.room=S.uuid;
   const V=INN.V;INN.cd=snap||INN.cd==null?D:(D<INN.cd?INN.cd+(D-INN.cd)*(1-Math.exp(-14*dt)):sdamp(INN.cd,D,V,'d',.45,dt));INN.ch=snap||INN.ch==null?Hh:sdamp(INN.ch,Hh,V,'h',.4,dt);
   c.position.set(p.x-dx*INN.cd,gy+INN.ch,p.z-dz*INN.cd);innAim(c,p,dx,dz);U.dx=dx;U.dz=dz;pl.visible=INN.cd>.7;}
  // Sicherheitsklemme (alle Kameras/Modi)
  const cp=c.position;let moved=false;const cl=(v,a,b)=>Math.max(a,Math.min(b,v));const nx=cl(cp.x,bx0+mg-.1,bx1-mg+.1),nz=cl(cp.z,bz0+mg-.1,bz1-mg+.1),ny=cl(cp.y,.4,HC-.3);
  if(nx!==cp.x||nz!==cp.z||ny!==cp.y){cp.set(nx,ny,nz);moved=true;}
  for(const[a0,b0_,a1,b1_,th]of U.tall){if(cp.y>th+.12)continue;const e=.14;if(cp.x>a0-e&&cp.x<a1+e&&cp.z>b0_-e&&cp.z<b1_+e){const o=[[a0-e-cp.x,0],[a1+e-cp.x,0],[0,b0_-e-cp.z],[0,b1_+e-cp.z]].sort((u,v)=>Math.abs(u[0]+u[1])-Math.abs(v[0]+v[1]))[0];
    const tx=cl(cp.x+o[0]*1.01,bx0+mg-.1,bx1-mg+.1),tz=cl(cp.z+o[1]*1.01,bz0+mg-.1,bz1-mg+.1);if(tx>a0-e+.001&&tx<a1+e-.001&&tz>b0_-e+.001&&tz<b1_+e-.001)cp.y=Math.min(HC-.3,th+.2);else{cp.x=tx;cp.z=tz;}moved=true;}}
  for(const[hx,hz,hy]of U.hang){if(cp.y<hy-.25)continue;const ddx=cp.x-hx,ddz=cp.z-hz,dd=Math.hypot(ddx,ddz);if(dd<.5){const k=.5/Math.max(.01,dd);cp.x=hx+(dd<.01?.5:ddx*k);cp.z=hz+(dd<.01?0:ddz*k);moved=true;}}
  if(moved&&c===R3.cam&&cm==='explore'&&view==='third')innAim(c,pl.position,U.dx,U.dz);
  c.updateMatrixWorld(true);INN.camW=c.position.clone();}
 else if(U.kind==='cave'){const C=U.C;
  if(S.fog){S.fog.color.set(C.fog);}if(S.background&&S.background.isColor)S.background.set(C.fog);R3.hemi.color.set(C.hemi[0]);R3.hemi.groundColor.set(C.hemi[1]);R3.hemi.intensity=C.hemi[2];
  if(U.mist)U.mist.material.uniforms.uT.value=t;if(U.pud)U.pud.material.uniforms.uT.value=t;
  // Kamera: unter dem Deckel, nicht in hohen Felsen (Tiefe ≥ 2) – sonst zur Figur heranziehen und etwas anheben
  const cp=c.position,save=c===R3.cam&&!INN.cam;if(save)INN.cam={p:cp.clone(),q:c.quaternion.clone()};let moved=false;
  if(cp.y>U.LID-.4){cp.y=U.LID-.4;moved=true;}
  const p=pl.position,cm=typeof camMode==='function'?camMode():'explore';
  const free=(x,z)=>{for(const q of U.tun)if(x>q.x0+.25&&x<q.x1-.25&&z>q.z0-.3&&z<q.z1-.3)return true;const t=tileAt(cur,Math.floor(x),Math.floor(z));return t!==null&&t!=='X';};
  if(c===R3.cam&&cm==='explore'&&view==='third'){let dx=p.x-cp.x,dz=p.z-cp.z;const L0=Math.hypot(dx,dz);if(L0<.05){dx=-Math.sin(R3.yaw);dz=-Math.cos(R3.yaw);}else{dx/=L0;dz/=L0;}
   let Dm=.35;for(let s=.3;s<=U.camD+.2;s+=.08){if(!free(p.x-dx*s,p.z-dz*s))break;Dm=s;}Dm=Math.max(.35,Dm-.18);
   const D=Math.min(U.camD,Dm),short=U.camD-D,Hh=Math.min(U.LID-.6,Math.max(1.95,U.camH-short*.12)),snap=R3.snap||INN.room!==S.uuid,V=INN.V,gy=p.y;INN.room=S.uuid;
   INN.cd=snap||INN.cd==null?D:(D<INN.cd?INN.cd+(D-INN.cd)*(1-Math.exp(-14*dt)):sdamp(INN.cd,D,V,'d',.45,dt));INN.ch=snap||INN.ch==null?Hh:sdamp(INN.ch,Hh,V,'h',.4,dt);
   cp.set(p.x-dx*INN.cd,gy+INN.ch,p.z-dz*INN.cd);innAim(c,p,dx,dz);pl.visible=INN.cd>.7;c.updateMatrixWorld(true);INN.camW=cp.clone();return;}
  const inRock=(x,z)=>{const tx=Math.floor(x),tz=Math.floor(z);if(tx<0||tz<0||tx>=U.W||tz>=U.H)return 9;const d=U.D[tz*U.W+tx];return d>=2&&d<99?d:0;};
  if(inRock(cp.x,cp.z)){const sx=cp.x,sz=cp.z;let k=1;for(;k>.05;k-=.05){const x=p.x+(sx-p.x)*k,z=p.z+(sz-p.z)*k;if(!inRock(x,z))break;}const lost=Math.hypot(sx-p.x,sz-p.z)*(1-k);
   cp.x=p.x+(sx-p.x)*k;cp.z=p.z+(sz-p.z)*k;cp.y=Math.min(U.LID-.4,cp.y+lost*.5);moved=true;}
  cp.x=Math.max(.25,Math.min(U.W-.25,cp.x));cp.z=Math.max(.25,Math.min(U.H-.25,cp.z));
  if(moved){if(c===R3.cam&&R3.lk)c.lookAt(R3.lk);}c.updateMatrixWorld(true);INN.camW=cp.clone();}}

// ---------- draw3d-Hülle: Kamera zurücksetzen, GPU-Freigabe beim Szenenwechsel, Höhlen-Hall ----------
function innRelease(S){const U=S&&S.userData&&S.userData.inn;if(!U)return;for(const o of U.own)try{o.dispose();}catch(e){}for(const t of U.tex)try{t.dispose();}catch(e){}U.released=1;}
if(typeof draw3d==='function'){const _d3Inn=draw3d;draw3d=function(){
  // eigene Kamera-Änderung aus onBeforeRender zurücknehmen, falls kein äußerer Render-Wrapper (17/36) das schon getan hat
  if(INN.cam&&R3&&R3.cam&&INN.camW&&R3.cam.position.distanceToSquared(INN.camW)<1e-10){R3.cam.position.copy(INN.cam.p);R3.cam.quaternion.copy(INN.cam.q);}INN.cam=null;INN.camW=null;
  const r=_d3Inn.apply(this,arguments);try{const S=R3&&R3.scene;if(S!==INN.scene){if(INN.scene)innRelease(INN.scene);INN.scene=S;INN.room=null;}innAudio(S);}catch(e){console.error(e);}return r;};}
// Höhle: gelegentliche Wassertropfen mit Hall (nur wenn Audio schon läuft und Effekte an sind)
function innAudio(S){const U=S&&S.userData&&S.userData.inn;if(!U||U.kind!=='cave'||mode!=='world')return;if(typeof AC==='undefined'||!AC||AC.state!=='running'||!SET.sfx||!SET.vol)return;
 const now=performance.now();if(now<INN.drip)return;INN.drip=now+2600+Math.random()*4200;if(INN.drip-now>9000)return;
 try{const A=AC,out=typeof master==='function'?master():A.destination;if(!INN.au){const d=A.createDelay(1),fb=A.createGain(),lp=A.createBiquadFilter(),wet=A.createGain();d.delayTime.value=.27;fb.gain.value=.42;lp.type='lowpass';lp.frequency.value=1800;wet.gain.value=.55;
   d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(wet);wet.connect(out);INN.au={d};}
  const v=SET.vol/100*.16*(U.C.pud===1?.5:1),t0=A.currentTime+.01,o=A.createOscillator(),g=A.createGain(),f=1100+Math.random()*700;o.type='sine';o.frequency.setValueAtTime(f,t0);o.frequency.exponentialRampToValueAtTime(f*.45,t0+.09);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(v,t0+.004);g.gain.exponentialRampToValueAtTime(.0005,t0+.16);o.connect(g);g.connect(out);g.connect(INN.au.d);o.start(t0);o.stop(t0+.2);}catch(e){}}

// ---------- Projektion (Namen/Marker über Figuren) mit der tatsächlich gezeigten Kamera ----------
if(typeof worldPt==='function'){const _wpInn=worldPt;worldPt=function(){const U=R3&&R3.scene&&R3.scene.userData&&R3.scene.userData.inn;if(U&&R3.shown&&R3.cam&&view!=='2d'){const c=R3.cam;R3.cam=R3.shown;try{return _wpInn.apply(this,arguments);}finally{R3.cam=c;}}return _wpInn.apply(this,arguments);};}

// ---------- Heil-Sequenz (ersetzt SEQ.heal aus 25-evolve, gleiche Schnittstelle) ----------
if(typeof talk==='function'){const _talkInn=talk;talk=function(n){try{if(n&&n.t==='nurse'&&!n.hook&&G&&G.team)INN.snap={t:performance.now(),hp:G.team.map(m=>Math.max(0,Math.min(1,m.hp/Math.max(1,stat(m,'hp')))))};}catch(e){}return _talkInn.apply(this,arguments);};}
function innClock(el,scale){if(typeof seqClock==='function')return seqClock(el,scale);const S={scale,now:()=>performance.now(),w:[],stop(){}};S.wait=ms=>new Promise(r=>setTimeout(r,ms*scale));return S;}
function innPic(m,size){try{if(typeof cardMini==='function')return cardMini(m.s,size,{shiny:!!m.shiny,field:true});}catch(e){}try{if(typeof mini==='function')return mini(m.s,size);}catch(e){}const s=document.createElement('span');s.style.cssText=`display:block;width:${size}px;height:${size}px`;return s;}
SEQ.heal=async o=>{o=o||{};const team=((G&&G.team)||[]).slice(0,6);const host=$('#screen')||document.body,pm=mode,short=SET.banim===0||RED;mode='wait';held=null;
 const n=Math.max(1,team.length),snap=INN.snap&&performance.now()-INN.snap.t<60000?INN.snap.hp:null;INN.snap=null;
 const ov=document.createElement('div');ov.className='healOv inn'+(short?' short':'');ov.setAttribute('role','status');
 ov.innerHTML=`<div class="hoCard"><i class="hoArc" aria-hidden="true"><b class="hoDrop"></b></i><p class="healTx">Kreaturenstation · Einen Moment bitte …</p><div class="hoGrid" style="--n:${Math.min(3,n)}"></div><i class="hoSweep" aria-hidden="true"></i></div>`;
 host.appendChild(ov);const grid=ov.querySelector('.hoGrid'),tx=ov.querySelector('.healTx'),slots=[];
 team.forEach((m,i)=>{const M=MONS[m.s]||{},el=document.createElement('div');el.className='hoSlot';const tc=(TYPES[(M.t||['kern'])[0]]||{}).c||'#3fd9a6';el.style.setProperty('--tc',tc);el.style.setProperty('--d',(i*.07)+'s');
  const pic=document.createElement('div');pic.className='hoPic';pic.appendChild(innPic(m,68));const f0=snap&&snap[i]!=null?snap[i]:Math.max(.08,Math.min(1,m.hp/Math.max(1,stat(m,'hp'))))*.6;
  el.appendChild(pic);el.insertAdjacentHTML('beforeend',`<b class="hoName">${(typeof mname==='function'?mname(m):M.n)||''}</b><span class="hoHp"><i style="width:${Math.round(f0*100)}%"></i></span><i class="hoRing" aria-hidden="true"></i>`);grid.appendChild(el);slots.push(el);});
 const S=innClock(ov,short?.3:1),notes=[523,587,659,784,880,1046];INN.heal.on=1;INN.heal.lit=0;INN.heal.boost=.4;
 try{requestAnimationFrame(()=>ov.classList.add('on'));if(typeof sfx==='function')sfx('tap');await S.wait(short?120:260);slots.forEach(s=>s.classList.add('in'));await S.wait(short?80:180+n*60);
  for(let i=0;i<n;i++){const s=slots[i];if(s){s.classList.add('lit');const b=s.querySelector('.hoHp>i');if(b)b.style.width='100%';}INN.heal.lit=i+1;INN.heal.boost=.6;
   SFX.healNote=[['sine',notes[i],notes[i],.14,.035]];if(typeof sfx==='function')sfx('healNote');if(typeof vib==='function')vib(5);await S.wait(short?60:240);}
  INN.heal.boost=1;if(typeof jingle==='function')jingle('heal','healJ');else if(typeof sfx==='function')sfx('healJ');tx.textContent='Alle Kreaturen sind wieder topfit!';ov.classList.add('shine');await S.wait(short?220:820);
  ov.classList.add('out');await S.wait(short?120:300);
 }finally{S.stop&&S.stop();INN.heal.on=0;INN.heal.lit=0;ov.classList.add('out');setTimeout(()=>ov.remove(),RED?0:220);if(mode==='wait')mode=pm==='dialog'?'world':pm;}
 if(typeof compReact==='function')try{compReact('heal');}catch(e){}return{ok:true};};
