import {boot} from './qa_p1_lib.mjs';
const {b,p,errs}=await boot();
const R={};
// Zeit-Offset für Vorspulen
await p.evaluate(()=>{const n=performance.now.bind(performance);window.__off=0;performance.now=()=>n()+window.__off;});
// --- 2: Roamer 60 s simuliert (2D), Tag und Nacht
const sim=async(night)=>p.evaluate(async(night)=>{
  G.time=night?23*60:11*60;loadMap('route1',9,18);mode='world';setView('2d',true);P.run=false;ROAM.list.forEach(r=>0);
  ROAM.want=6;const st={states:{},poses:{},bad:[],n:0,maxList:0,charge:0,flee:0,hide:0,sleep:0};
  // zusätzliche Roamer: je eine Art scheu/aggro/neutral sicherstellen
  const add=(s)=>{addRoamer();const r=ROAM.list[ROAM.list.length-1];if(r){r.s=s;r.nat=monNature(s);r.owl=nightOwl(s);}};
  [5,12,14,30].forEach(add);
  for(let f=0;f<1800;f++){window.__off+=33;
    // Spieler wandert in Zyklen: 10s laufend (Fliehen testen), sonst steht
    if(f%300===150){P.run=true;P.moving=true;}if(f%300===250){P.run=false;P.moving=false;}
    // Spieler-Position gelegentlich an einen Roamer annähern (aggro-Test)
    if(f%450===400&&ROAM.list.length){const r=ROAM.list.find(r=>r.nat==='aggro')||ROAM.list[0];const c=[[r.x+2,r.y],[r.x-2,r.y],[r.x,r.y+2],[r.x,r.y-2]].find(([x,y])=>!blocked(x,y)&&tileAt(cur,x,y)!=='~');if(c){P.x=P.px=c[0];P.y=P.py=c[1];}}
    roamTick(33);
    if(mode!=='world'){ // Angriff hat Kampf gestartet
      st.battle=(st.battle||0)+1;if(B){B=null;}mode='world';document.querySelectorAll('#battle').forEach(e=>e.hidden=true);}
    for(const r of ROAM.list){st.n++;st.states[r.st]=(st.states[r.st]||0)+1;if(r.pose)st.poses[r.pose]=(st.poses[r.pose]||0)+1;
      const t=tileAt(cur,r.x,r.y);if(t===null||SOLID.has(t)||t==='~')st.bad.push([r.s,r.x,r.y,t,r.st]);}
    st.maxList=Math.max(st.maxList,ROAM.list.length);
  }
  return st;},night);
R.day=await sim(false);R.night=await sim(true);
console.log(JSON.stringify(R,null,0).slice(0,1500));
console.log('errs',errs.length,errs.slice(0,5));
await b.close();
