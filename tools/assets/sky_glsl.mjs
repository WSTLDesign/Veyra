// Veyra – Offline-Himmel (Hybrid H1): GLSL-Bausteine für Skybox, Kampfhintergrund-Himmel und Wolkenmeer.
// Richtungskonvention = three.js equirect (PMREM-tauglich): u = atan(d.z,d.x)/2π + .5, v = asin(d.y)/π + .5 (v=1 oben).
// Alle Farb-Uniforms linear (sRGB → linear in scene.html), Ausgabe: weiche Schulter + sRGB + Dither.
export const NOISE = `
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float hash13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}
float vn2(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*f*(f*(f*6.-15.)+10.);
 float a=hash12(i),b=hash12(i+vec2(1.,0.)),c=hash12(i+vec2(0.,1.)),d=hash12(i+vec2(1.,1.));return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float vn3(vec3 p){vec3 i=floor(p),f=fract(p);vec3 u=f*f*(3.-2.*f);
 float a=hash13(i),b=hash13(i+vec3(1,0,0)),c=hash13(i+vec3(0,1,0)),d=hash13(i+vec3(1,1,0));
 float e=hash13(i+vec3(0,0,1)),g=hash13(i+vec3(1,0,1)),h=hash13(i+vec3(0,1,1)),k=hash13(i+vec3(1,1,1));
 return mix(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),mix(mix(e,g,u.x),mix(h,k,u.x),u.y),u.z);}
const mat2 ROT=mat2(.8,-.6,.6,.8);
float fbm2(vec2 p,int o){float s=0.,a=.5,t=0.;for(int i=0;i<8;i++){if(i>=o)break;s+=a*vn2(p);t+=a;p=ROT*p*2.03+vec2(1.7,9.2);a*=.5;}return s/t;}
float fbm3(vec3 p,int o){float s=0.,a=.5,t=0.;for(int i=0;i<7;i++){if(i>=o)break;s+=a*vn3(p);t+=a;p=p*2.02+vec3(1.7,9.2,4.1);a*=.5;}return s/t;}
float billow3(vec3 p,int o){float s=0.,a=.5,t=0.;for(int i=0;i<6;i++){if(i>=o)break;s+=a*(1.-abs(vn3(p)*2.-1.));t+=a;p=p*2.05+vec3(3.1,1.3,5.7);a*=.5;}return s/t;}
float billow(vec2 p,int o){float s=0.,a=.5,t=0.;for(int i=0;i<8;i++){if(i>=o)break;s+=a*(1.-abs(vn2(p)*2.-1.));t+=a;p=ROT*p*2.07+vec2(3.1,1.3);a*=.5;}return s/t;}
`;

export const SKY = `
uniform vec3 uZen,uMid,uHor,uBelow,uHaze,uSunDir,uSunCol,uGlowCol,uMoonDir,uMoonCol,uCloudLit,uCloudShd,uSeaLit,uSeaShd,uAccDir,uAccCol,uAurA,uAurB;
uniform float uSunI,uSunSize,uGlowI,uMoonI,uMoonPhase,uCov,uCloudAmt,uCumAmt,uCumH,uCirrus,uSeaAmt,uSeaCov,uSeaY,uHazeAmt,uHazeK,uRays,uStars,uAurora,uAccI,uSeed,uExpo,uMilky,uTopFade;
// Quellwolken als „Bausch-Feld“: je Zelle ein runder Bausch (Zufallsgröße, Deckung = Zellwahrscheinlichkeit) → klare, weiche Haufenwolken
float puffs(vec2 p,float cov,float wrapN){vec2 i=floor(p),f=fract(p);float m=0.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y)),c=i+g;if(wrapN>0.)c.x=mod(c.x,wrapN);
  vec2 h=vec2(hash12(c+uSeed),hash12(c+uSeed+7.3));float rr=.45+.5*hash12(c+3.1);float on=step(cov,hash12(c+9.7));vec2 dv=g+h-f;float d=clamp(1.-dot(dv,dv)/(rr*rr),0.,1.);
  float b=on*d*d*(3.-2.*d)*(.65+.35*hash12(c+5.5));m=m+b-m*b;}// weiche Vereinigung statt max (keine Krater-Kanten)
 return m;}
float layD(vec2 p){vec2 q=p+.35*vec2(fbm2(p*.3+uSeed,3),fbm2(p*.3+uSeed+5.2,3));
 float big=puffs(q*.55,uCov,0.),mid=puffs(q*1.3+3.7,uCov*.85,0.)*.8,sm=puffs(q*3.1+1.1,.3,0.)*.45;
 float D=big+mid*smoothstep(.0,.3,big+.1)*(1.-big);D=D+sm*smoothstep(.05,.35,D)*(1.-D);return D+(fbm2(q*4.,3)-.5)*.16;}
float cumTop(float phi){float top=0.;// Wolkentürme: Hüllkurve aus 14 Hügeln über dem Azimut (nahtlos)
 for(int k=0;k<14;k++){float fk=float(k);float c=hash12(vec2(fk,uSeed))*6.2831853,w=.12+.3*hash12(vec2(fk,uSeed+1.)),h=uCumH*(.35+.65*pow(hash12(vec2(fk,uSeed+2.)),1.2));
  float dp=abs(mod(phi-c+3.14159265,6.2831853)-3.14159265);top=max(top,h*exp(-dp*dp/(w*w)));}return max(top,uCumH*.08);}
float cumD(vec3 d,float y){float phi=atan(d.z,d.x),az=phi/6.2831853+.5;float top=cumTop(phi);
 float N=30.;vec2 s=vec2(az*N,y*N/6.2831853*1.6);float pf=puffs(s,.0,N)*.6+puffs(s*2.+vec2(0.,1.7),.1,N*2.)*.3+puffs(s*4.+vec2(0.,.7),.3,N*4.)*.1;
 float body=1.-max(y,0.)/top;float edge=1.-abs(body-.3)*2.;return body+.22+(pf-.5)*.6*(.35+.65*clamp(edge,0.,1.))+(fbm3(vec3(d.xz*9.,y*20.),3)-.5)*.06-(y<0.?-y*5.:0.);}
float cloudA(vec3 d){// Deckung der Haufenwolken-Schicht + Türme (für Strahlen/Sterne)
 float y=d.y;if(y<-.03)return 0.;float a=0.;if(y>0.){vec2 p=d.xz/(y+.07)*.9;a=smoothstep(.04,.26,layD(p))*uCloudAmt*smoothstep(0.,.08,y);}
 if(uCumAmt>0.&&y<uCumH*1.5){a=max(a,smoothstep(.42,.56,cumD(d,y))*uCumAmt);}return a;}
vec3 lin2s(vec3 c){c=max(c,0.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
vec3 shoulder(vec3 x){vec3 k=vec3(.78);return mix(x,k+(1.-k)*(1.-exp(-(x-k)/(1.-k))),step(k,x));}
vec3 skyCol(vec3 d,vec2 fragPx){
 d=normalize(d);float y=d.y,mu=dot(d,uSunDir),th=acos(clamp(mu,-1.,1.));
 // 1) Verlauf (drei Stufen) + Licht-Streuung zur Sonne
 float yy=max(y,0.);vec3 c=mix(uHor,uMid,smoothstep(0.,.32,pow(yy,.8)));c=mix(c,uZen,smoothstep(.18,1.,yy));
 if(y<0.)c=mix(uHor,uBelow,smoothstep(0.,.35,-y));
 float hz=exp(-abs(y)*uHazeK);
 c+=uGlowCol*uGlowI*(pow(max(mu,0.),5.)*.35+pow(max(mu,0.),40.)*.55)*(.55+.45*hz);
 c+=uGlowCol*uGlowI*exp(-th*1.6)*hz*.35;
 c+=uAccCol*uAccI*exp(-acos(clamp(dot(normalize(vec3(d.x,0.,d.z)+1e-5),uAccDir),-1.,1.))*2.2)*exp(-abs(y)*7.);
 // 2) Sterne, Milchstraße (hinter Wolken)
 vec3 st=vec3(0.);
 if(uStars>0.&&y>-.02){vec3 p=d*420.;vec3 i=floor(p);float h=hash13(i+uSeed);
  if(h>.9955){vec3 o=vec3(hash13(i+1.3),hash13(i+2.7),hash13(i+4.1))-.5;float r=length(fract(p)-.5-o*.5);float b=(h-.9955)/.0045;
   st+=mix(vec3(.75,.82,1.),vec3(1.,.9,.75),hash13(i+8.1))*smoothstep(.17,0.,r)*(.35+2.2*b*b);}
  vec3 p2=d*900.;vec3 i2=floor(p2);float h2=hash13(i2+uSeed+3.);if(h2>.993){float r=length(fract(p2)-.5);st+=vec3(.7,.78,1.)*smoothstep(.2,0.,r)*.35;}
  vec3 n0=normalize(vec3(.35,.55,-.76));float mb=exp(-pow(dot(d,n0)*3.6,2.));st+=vec3(.55,.6,.85)*mb*uMilky*(fbm3(d*6.,5)*.9+.1)*.22;
  st*=uStars*smoothstep(-.01,.22,y);}
 // 3) Mond (Scheibe mit Kratern, Phase = versetzte Scheibe)
 if(uMoonI>0.){float md=acos(clamp(dot(d,uMoonDir),-1.,1.));float R=.036;
  vec3 mo=normalize(uMoonDir+normalize(cross(uMoonDir,vec3(0,1,0)))*R*(2.05-1.45*uMoonPhase)+vec3(0,R*.3,0));
  float disk=smoothstep(R,R*.93,md),cut=uMoonPhase>0.?smoothstep(R*.98,R*.9,acos(clamp(dot(d,mo),-1.,1.))):0.;
  float cr=fbm3(d*140.,4);vec3 mc=uMoonCol*(.82+.3*cr-.18*smoothstep(.55,.7,cr));
  c+=uMoonCol*uMoonI*(exp(-md*9.)*.16+exp(-md*40.)*.22)*(1.-cut*disk*.6);st*=1.-disk;c=mix(c,mc*1.25,disk*(1.-cut)*uMoonI);}
 c+=st;
 // 4) Polarlicht (Vorhänge in der Projektion, oben violett)
 if(uAurora>0.&&y>0.){vec2 p=d.xz/(y+.18);float cx=p.x*.55+sin(p.y*.7+uSeed)*1.3+.6*fbm2(p*.35,3);
  float band=exp(-pow((p.y*.6-cx*.25-1.2)*1.3,2.))+.7*exp(-pow((p.y*.6-cx*.4+1.4)*1.6,2.));
  float ray=pow(fbm2(vec2(cx*9.,y*1.5),4),2.)*1.8;float vert=smoothstep(.03,.16,y)*(1.-smoothstep(.35,.85,y));
  vec3 ac=mix(uAurA,uAurB,smoothstep(.1,.5,y));c+=ac*band*ray*vert*uAurora;}
 // 5) Sonne: Scheibe, Korona
 float sR=uSunSize;float disc=smoothstep(sR,sR*.82,th);
 c+=uSunCol*uSunI*(exp(-th*30.)*.9+exp(-th*9.)*.32+exp(-th*2.5)*.08);
 // 6) Zirren (hoch, gestreckt)
 if(y>0.&&uCirrus>0.){vec2 p=d.xz/(y+.25)*.8;p+=1.2*vec2(fbm2(p*.5+3.,3),fbm2(p*.5+8.,3));p*=vec2(.7,2.4);float n=fbm2(p+vec2(uSeed*3.,0.),6);
  float a=smoothstep(.56,.8,n)*uCirrus*smoothstep(.05,.35,y);vec3 cc=mix(uCloudShd,uCloudLit,.75)+uSunCol*pow(max(mu,0.),6.)*.25;c=mix(c,cc,a*.55);}
 // 7) Haufenwolken-Schicht mit Lichtkante (Ableitung zur Sonne) und Silberrand
 vec2 sxz=normalize(uSunDir.xz+vec2(1e-4));float occ=0.;
 if(y>0.&&uCloudAmt>0.){vec2 p=d.xz/(y+.07)*.9;float n=layD(p),n2=layD(p+sxz*.12);
  float a=smoothstep(.04,.26,n)*uCloudAmt*smoothstep(0.,.08,y)*(1.-uTopFade*smoothstep(.28,.85,y));float thick=smoothstep(.3,.85,n);
  float lit=clamp(.62+(n-n2)*4.-thick*.38+y*.15,0.,1.);lit=lit*lit*(3.-2.*lit);vec3 cc=mix(uCloudShd,uCloudLit,lit);
  float edge=1.-smoothstep(.04,.3,n);cc+=uSunCol*uSunI*(pow(max(mu,0.),10.)*(.2+edge*1.3)+exp(-th*5.)*edge*.35);
  cc=mix(cc,uHaze,(1.-smoothstep(0.,.3,y))*.5);c=mix(c,cc,a);occ=max(occ,a);}
 // 8) Wolkentürme am Horizont (Kumulus-Wand)
 if(uCumAmt>0.&&y<uCumH*1.5&&y>-.04){float n=cumD(d,y);
  vec3 dn=normalize(d+vec3(0.,.02,0.)*max(uSunDir.y,.15)+normalize(vec3(uSunDir.x,0.,uSunDir.z)+1e-5)*.012);float n2=cumD(dn,dn.y);
  float a=smoothstep(.42,.56,n)*uCumAmt;float lit=clamp(.6+(n-n2)*6.+(n-.6)*.25,0.,1.);lit=lit*lit*(3.-2.*lit);float base=smoothstep(.0,.08,y);
  vec3 cc=mix(uCloudShd,uCloudLit,lit*(.6+.4*base));float edge=1.-smoothstep(.42,.56,n);
  cc+=uSunCol*uSunI*(pow(max(mu,0.),8.)*(.2+edge*1.2)+exp(-th*4.)*edge*.3);cc=mix(cc,uHaze,(1.-smoothstep(-.03,.07,y))*.45);
  c=mix(c,cc,a);occ=max(occ,a);}
 // 9) Wolkenmeer unter dem Horizont (Aufsicht, hell angestrahlte Kuppen)
 if(y<uSeaY+.02&&uSeaAmt>0.){float yd=max(uSeaY-y,.0025);vec2 p=d.xz/(yd+.012)*.42;
  float n=billow(p*.7+uSeed,5)*.55+puffs(p*.9,.1,0.)*.45,n2=billow((p+sxz*.06)*.7+uSeed,5)*.55+puffs((p+sxz*.06)*.9,.1,0.)*.45;float k=smoothstep(uSeaCov,uSeaCov+.22,n);
  float lit=clamp(.42+(n-n2)*11.+(k-.5)*.5,0.,1.);lit=lit*lit*(3.-2.*lit);vec3 sc=mix(uSeaShd,uSeaLit,lit);sc+=uSunCol*uSunI*pow(max(mu,0.),7.)*.35*lit;
  float far=exp(-yd*22.);sc=mix(sc,uHaze*1.02,far*.6);float a=uSeaAmt*mix(k*.85+.15,1.,far)*smoothstep(uSeaY+.02,uSeaY-.01,y);c=mix(c,sc,a);}
 // 10) Dunstband
 c=mix(c,uHaze,hz*uHazeAmt*(1.-occ*.7));
 // 11) Sonnenscheibe über dem Dunst (leicht gedämpft von Wolken), Volumenlicht-Strahlen
 c=mix(c,uSunCol*2.6+vec3(.35),disc*uSunI*(1.-occ*.85));
 if(uRays>0.&&mu>.25){float T=0.;for(int k=0;k<14;k++){float f=float(k)/14.;vec3 q=normalize(mix(d,uSunDir,f*.92));T+=cloudA(q);}T=1.-T/14.;
  vec3 e1=normalize(cross(uSunDir,vec3(0.,1.,.001))),e2=cross(e1,uSunDir);float ang=atan(dot(d,e2),dot(d,e1));
  float sk=pow(vn2(vec2(cos(ang),sin(ang))*9.+uSeed)*.6+vn2(vec2(cos(ang),sin(ang))*23.)*.4,2.2);
  float fall=exp(-th*2.6)*smoothstep(.25,.6,mu);c+=uSunCol*uRays*fall*(sk*.55+max(T-.35,0.)*.9)*.6;}
 c*=uExpo;c=shoulder(c);c=lin2s(c);
 c+=(hash12(fragPx+uSeed*17.)-.5)/255.;// Dither gegen Stufen im Verlauf
 return c;}
`;
