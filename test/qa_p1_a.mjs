import {boot} from './qa_p1_lib.mjs';
const {b,p,errs}=await boot();
const ids=await p.evaluate(()=>[...Object.keys(MAPS),...Object.keys(INTERIORS)]);
console.log('Karten',ids.length);
const WX=['klar','regen','schnee','sand','nebel','gewitter'],TM=[360,720,1110,1380];
let i=0;
for(const id of ids){
  for(const v of ['2d','third']){
    const n=errs.length;
    await p.evaluate(([id,v,wx,tm])=>{G.ret={map:'morgenau',x:7,y:11};G.time=tm;mode='world';loadMap(id);setView(v,true);setWeatherVisual(wx);},[id,v,WX[i%6],TM[i%4]]);
    await p.waitForTimeout(v==='2d'?150:500);
    i++;
    if(errs.length>n)console.log('FEHLER',id,v,WX[(i-1)%6],TM[(i-1)%4],errs.slice(n).join(' | ').slice(0,300));
  }
}
// Wetter x Zeit auf einer Karte (3D)
for(const w of WX)for(const t of TM){const n=errs.length;await p.evaluate(([w,t])=>{G.time=t;loadMap('route1',9,12);mode='world';setView('third',true);setWeatherVisual(w);},[w,t]);await p.waitForTimeout(350);if(errs.length>n)console.log('FEHLER wx',w,t,errs.slice(n).join('|').slice(0,300));}
await p.evaluate(()=>setWeatherVisual(null));
console.log('errs',errs.length,[...new Set(errs)].slice(0,10));
await b.close();
