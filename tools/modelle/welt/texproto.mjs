// Prototyp Bodentextur (Welt-Grafik): erzeugt die Kanäle wie im Spiel und schreibt Vorschau-PNGs (Kacheln 2×2, eingefärbt)
import { writeFileSync } from 'fs'; import { execFileSync } from 'child_process';
function hs(x,y){let h=(x*374761393+y*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function prng(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function w3noise(N,cells,seed){const g=new Float32Array(cells*cells),r=prng(seed);for(let i=0;i<g.length;i++)g[i]=r();
 return(x,y)=>{const u=x/N*cells,v=y/N*cells,i=Math.floor(u),j=Math.floor(v);let fx=u-i,fy=v-j;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
  const I=((i%cells)+cells)%cells,J=((j%cells)+cells)%cells,I1=(I+1)%cells,J1=(J+1)%cells,a=g[J*cells+I],b=g[J*cells+I1],c=g[J1*cells+I],d=g[J1*cells+I1];return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;};}
function w3fbm(N,c0,oct,seed){const L=[];for(let o=0;o<oct;o++)L.push(w3noise(N,c0<<o,seed+o*17));return(x,y)=>{let s=0,a=.5,t=0;for(const f of L){s+=f(x,y)*a;t+=a;a*=.5;}return s/t;};}
function w3voro(N,cells,seed){const r=prng(seed),pt=[];for(let j=0;j<cells;j++)for(let i=0;i<cells;i++)pt.push([(i+.15+r()*.7)*N/cells,(j+.15+r()*.7)*N/cells,r()]);
 return(x,y)=>{let f1=1e9,f2=1e9,v=0;const ci=Math.floor(x/N*cells),cj=Math.floor(y/N*cells);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const I=((ci+di)%cells+cells)%cells,J=((cj+dj)%cells+cells)%cells,p=pt[J*cells+I];
  let dx=Math.abs(x-p[0]),dy=Math.abs(y-p[1]);dx=Math.min(dx,N-dx);dy=Math.min(dy,N-dy);const d=Math.hypot(dx,dy);if(d<f1){f2=f1;f1=d;v=p[2];}else if(d<f2)f2=d;}return[f1,f2,v];};}
// Halm-Striche: kurze, leicht gebogene Linien (kachelbar) – hell/dunkel
function strokes(N,n,seed,len,w){const a=new Float32Array(N*N),r=prng(seed);for(let k=0;k<n;k++){const x0=r()*N,y0=r()*N,an=-Math.PI/2+(r()-.5)*1.3,L=len*(.6+r()*.8),s=(r()<.55?1:-1)*(.5+r()*.5),bend=(r()-.5)*.6;
  for(let t=0;t<=1;t+=.5/L){const aa=an+bend*t,px=x0+Math.cos(aa)*L*t,py=y0+Math.sin(aa)*L*t,ww=w*(1-t*.7);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const qx=Math.floor(px)+dx,qy=Math.floor(py)+dy,dd=Math.hypot(qx+.5-px,qy+.5-py);if(dd>ww+.5)continue;const k2=Math.min(1,ww+.5-dd)*s*(.4+.6*t);const I=((qx%N)+N)%N,J=((qy%N)+N)%N;a[J*N+I]+=k2;}}}
 return(x,y)=>a[y*N+x];}
const T0=Date.now();
const N=+process.argv[2]||512;
const gl=w3fbm(N,4,3,11),gc=w3voro(N,18,13),gc2=w3voro(N,34,14),gs=strokes(N,N*N/90,15,N/48,N/420),gm=w3fbm(N,16,2,12);
const di=w3fbm(N,6,4,21),pb=w3voro(N,12,23),pf=w3fbm(N,32,2,24),cb=w3voro(N,7,31),cn=w3fbm(N,16,2,33),sa=w3fbm(N,32,2,41),sr=w3fbm(N,4,2,43);
const D=new Float32Array(N*N*4);
for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=(y*N+x)*4;
 // R Gras: weiche Büschel (Voronoi-Kuppen, zwei Größen) + Halmstriche + großflächige Wolke
 const c1=gc(x,y),c2=gc2(x,y),R1=N/18*.62,R2=N/34*.62;const tuft=Math.pow(Math.max(0,1-c1[0]/R1),1.3)*(.55+.45*c1[2]),tuft2=Math.pow(Math.max(0,1-c2[0]/R2),1.2)*(.5+.5*c2[2]);
 let g=.42+.22*(gl(x,y)-.5)+.2*tuft+.14*tuft2+.09*(gm(x,y)-.5)+.11*Math.max(-1,Math.min(1,gs(x,y)));D[k]=g;
 // G Erde: weiche Flecken + Kiesel (helle Kuppen mit dunklem Rand) + feine Körnung
 const p=pb(x,y),peb=p[2]>.45?sst(N/12*.42,N/12*.18,p[0]):0,rim=p[2]>.45?sst(N/12*.5,N/12*.4,p[0])*(1-peb):0;
 D[k+1]=.5+.26*(di(x,y)-.5)+.1*(pf(x,y)-.5)+.2*peb-.1*rim;
 const c=cb(x,y),e=c[1]-c[0];D[k+2]=sst(1*N/256,4.5*N/256,e)*(.55+.3*c[2]+.25*cn(x,y))*(1-.25*sst(7*N/256,19*N/256,c[0]))+.08;
 D[k+3]=sa(x,y)*.55+.25+.12*Math.sin((y/N*6+sr(x,y)*1.6)*Math.PI*2);}
console.log('Erzeugung',N,Date.now()-T0,'ms');
const out=(name,fn)=>{const M=N*2,b=Buffer.alloc(M*M*3);for(let y=0;y<M;y++)for(let x=0;x<M;x++){const k=((y%N)*N+(x%N))*4,c=fn(D,k),j=(y*M+x)*3;for(let i=0;i<3;i++)b[j+i]=Math.max(0,Math.min(255,c[i]*255));}
 const f='/tmp/claude-0/-home-claude/0594c846-259d-5c83-bfbb-f494c275b6d8/scratchpad/'+name;writeFileSync(f+'.ppm',Buffer.concat([Buffer.from(`P6 ${M} ${M} 255\n`),b]));execFileSync('convert',[f+'.ppm',f+'.png']);};
const G0=[.42,.66,.3],E0=[.62,.5,.36];
out('tex_gras',(D,k)=>{const v=.74+.5*D[k];return[G0[0]*v*1.02,G0[1]*v,G0[2]*v*.9];});
out('tex_erde',(D,k)=>{const v=.74+.5*D[k+1];return[E0[0]*v,E0[1]*v,E0[2]*v];});
