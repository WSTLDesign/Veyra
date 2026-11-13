// QA Loop B3 – Prüfung 6 (und 3c): Vollbild-Layout von Intro (Hochformat), Dialog mit Porträt, Kapitel-Karte, Missionsseite (rQuest) in 860×400 und 390×844 (Hochformat erlaubt).
//   node test/qa_b_ui.mjs          Screenshots: test/qa_b_ui_<B>x<H>_<name>.png      Ergebnis: test/qa_b_ui.json
// Messungen per DOM-Geometrie: im Bild, nichts abgeschnitten (scrollWidth ≤ clientWidth), Porträt-Kreis überdeckt keine Textzeile, Touch-Ziele ≥ 44 px, Kapitel-Karte überlappt weder Dialog noch Panel.
import { chromium } from 'playwright';
import { serve } from './art_serve.mjs';
import { writeFileSync } from 'fs';
const S = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let ok = 0, bad = 0; const RES = [];
const VPS = [{ w: 860, h: 400, mobile: false }, { w: 390, h: 844, mobile: true }];
for (const v of VPS) {
  const tag = v.w + 'x' + v.h, shot = (p, n) => p.screenshot({ path: new URL('./qa_b_ui_' + tag + '_' + n + '.png', import.meta.url).pathname });
  const R = { vp: tag, checks: [] };
  const mk = async (demo) => {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, hasTouch: v.mobile, isMobile: v.mobile, serviceWorkers: 'block' });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await page.route(/fonts\.googleapis|fonts\.gstatic/, r => r.fulfill({ body: '', contentType: 'text/css' }));
    await page.addInitScript(() => { try { localStorage.setItem('veyra_set', JSON.stringify({ portrait: 'allow', res: '720' })); } catch (e) { } });
    if (demo) await page.addInitScript(() => { window.VEYRA_DEMO = 1; });
    await page.goto(S.url + 'index.html', { waitUntil: 'load' }); return { ctx, page, errs };
  };
  const check = (n, c, info) => { R.checks.push({ n, ok: !!c, info: c ? undefined : info }); if (c) { ok++; console.log('✓', `[${tag}]`, n); } else { bad++; console.log('✗', `[${tag}]`, n, info === undefined ? '' : (typeof info === 'string' ? info : JSON.stringify(info)).slice(0, 700)); } };
  const helpers = page => ({
    ev: c => page.evaluate(c), wait: ms => page.waitForTimeout(ms),
    rect: sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right, b: r.bottom, vis: r.width > 0 && r.height > 0 && !e.closest('[hidden]') }; }, sel),
  });
  const inView = r => r && r.vis && r.x >= -1 && r.y >= -1 && r.r <= v.w + 1 && r.b <= v.h + 1;
  // ---------- A) Intro im Hochformat (nur 390×844; Querformat deckt qa_b_intro.mjs ab)
  if (v.mobile) {
    const { ctx, page, errs } = await mk(true); const { ev, wait, rect } = helpers(page);
    try { await page.click('#iPrompt', { timeout: 4000 }); await wait(700); await page.click('#iSkip', { timeout: 3000 }); await wait(700); } catch (e) { }
    await ev("SET.res='720';SET.portrait='allow';saveSet();typeof fsLayout==='function'&&fsLayout()");
    try { await page.click('#tNew', { timeout: 4000 }); } catch (e) { await ev('newGame();0'); } await wait(2500);
    const box = () => ev("(()=>{const b=document.querySelector('.sqBox');return b&&!b.hidden?document.querySelector('.sqText').textContent:''})()");
    const tap = async () => { const r = await rect('.sqBox'); if (r && r.vis) await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); await wait(130); };
    const until = async (re, max = 60) => { for (let i = 0; i < max; i++) { const t = await box(); if (re.test(t)) return t; await tap(); await wait(100); } return await box(); };
    await until(/sieben große Elemente/); await wait(1200); await shot(page, 'intro_1_veyran');
    const bx = await rect('.sqBox'), sk = await rect('.sqSkip'); check('Intro Hochformat: Textkasten und „Überspringen“ im Bild, ohne Überlappung', inView(bx) && inView(sk) && !(sk.x < bx.r && bx.x < sk.r && sk.y < bx.b && bx.y < sk.b), { bx, sk });
    check('Intro Hochformat: kein Hinweis „Bitte Gerät drehen“ im Weg', await ev("document.querySelector('#rotOv').hidden"));
    await until(/Wer bist du/); await tap(); await tap(); await wait(1500);
    const pan = await rect('.fgCC'), go = await rect('.ccGo'), nm = await rect('#ccName'); await page.fill('#ccName', 'Pia'); await wait(300); await shot(page, 'intro_2_wer_bist_du');
    check('Intro Hochformat: „Wer bist du?“-Panel, Namensfeld und „Los geht’s!“ im Bild', inView(pan) && inView(go) && inView(nm), { pan, go, nm });
    const noClip = await ev("(()=>{const p=document.querySelector('.fgCC');return[...p.querySelectorAll('.ccRow,.fgBody button,.ccAct button')].filter(e=>{const r=e.getBoundingClientRect(),q=p.getBoundingClientRect();return r.right>q.right+1||r.left<q.left-1}).length})()");
    check('Intro Hochformat: nichts ragt seitlich aus dem Panel (Farbreihen scrollen horizontal)', noClip === 0, noClip);
    await page.click('.ccGo'); await wait(900); await until(/zuerst wählen/); await tap(); await tap();
    await page.waitForSelector('.fgPick .asCard', { timeout: 15000 }); await wait(500); await shot(page, 'intro_3_starter');
    const cards = await Promise.all([1, 2, 3].map(i => rect(`.fgPick .asCard:nth-child(${i})`))), pk = await rect('.fgPick'), bx2 = await rect('.sqBox');
    check('Intro Hochformat: Starterkarten (3) im Bild, ≥ 44 px, Textkasten überlappt nicht', cards.every(c => inView(c) && c.w >= 44 && c.h >= 44) && inView(pk) && !(pk.y < bx2.b && bx2.y < pk.b && bx2.vis), { cards, pk, bx2 });
    check('Intro Hochformat: keine Seitenfehler', !errs.length, errs); await ctx.close();
  }
  // ---------- B) Welt: Dialog mit Porträt, Kapitel-Karte, Missionsseite (Kurzpfad ohne Intro)
  {
    const { ctx, page, errs } = await mk(false); const { ev, wait, rect } = helpers(page);
    try { await page.click('#iPrompt', { timeout: 4000 }); await wait(500); await page.click('#iSkip', { timeout: 3000 }); await wait(900); await page.click('#tNew', { timeout: 4000 }); await wait(500); } catch (e) { console.log('  Hinweis Titelpfad:', e.message.split('\n')[0]); await ev('newGame();0').catch(() => { }); await wait(500); }
    await ev("SET.res='720';SET.portrait='allow';saveSet();typeof fsLayout==='function'&&fsLayout();advDlg();G.team.push(mk(2,18));G.time=10*60;G.flags.starter=1;G.flags.firstcatch=1;G.flags.s1_rivalen=1;loadMap('labor',5,6);mode='world';0");
    await wait(1500);
    // Dialog mit Porträt (Bild: Kael/Veyran; prozedural: Rayan, Brann) – Text aus den Sprüchen, plus lange Zeile
    const dlg = async (code, name, wantFig) => {
      await ev("mode='world';$('#dlg').hidden=true;" + code); await wait(1500); await ev('TW&&TW.finish&&TW.finish()'); await wait(500);
      await shot(page, 'dialog_' + name);
      const m = await ev(`(()=>{const d=document.querySelector('#dlg'),f=document.querySelector('#dlgFace'),t=document.querySelector('#dlgText'),n=document.querySelector('#dlgName');if(d.hidden)return{hidden:1};
        const R=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,r:r.right,b:r.bottom,w:r.width,h:r.height}};const fr=R(f),cx=(fr.x+fr.r)/2,cy=(fr.y+fr.b)/2,rad=fr.w/2;
        const rg=document.createRange();rg.selectNodeContents(t);const lines=[...rg.getClientRects()].map(r=>({x:r.x,y:r.y,r:r.right,b:r.bottom}));
        // Kreis ∩ Rechteck
        const hit=lines.filter(l=>{const px=Math.max(l.x,Math.min(cx,l.r)),py=Math.max(l.y,Math.min(cy,l.b));return Math.hypot(px-cx,py-cy)<rad-1});
        return{dlg:R(d),face:fr,faceVis:!f.hidden&&fr.w>0,name:n.hidden?null:R(n),nameTxt:n.textContent,nLines:lines.length,hit:hit.length,textClipped:t.scrollWidth>t.clientWidth+1||d.scrollHeight>d.clientHeight+2,fw:f._fw,vw:innerWidth,vh:innerHeight}})()`);
      check(`Dialog „${name}“: Porträt sichtbar (${m.fw})`, m.faceVis && (!wantFig || (m.fw || '').startsWith(wantFig)), m);
      check(`Dialog „${name}“: Porträt-Kreis überdeckt keine Textzeile, Name-Tab nicht über dem Porträt`, m.hit === 0 && (!m.name || m.name.x >= m.face.r - 4 || m.name.y >= m.face.b - 4 || m.name.b <= m.face.y + 4), m);
      check(`Dialog „${name}“: Box und Porträt vollständig im Bild, Text nicht abgeschnitten`, m.dlg.x >= 0 && m.dlg.r <= m.vw + 1 && m.dlg.b <= m.vh + 1 && m.face.y >= -1 && m.face.x >= 0 && !m.textClipped, m);
    };
    await dlg("DLG.pend={fig:'kael',t:'trainer'};say([figSay('kael','gruss',2)])", 'kael', 'kael');
    await dlg("DLG.pend={fig:'veyran',t:'talk'};say(['Professor Veyran: Die Kristalle flackern. Wir müssen sie gemeinsam beschützen, sonst wird es dunkel.'])", 'veyran_lang', 'veyran');
    await dlg("DLG.pend={fig:'rayan',t:'talk'};say([figSay('rayan','niederlage',3)])", 'rayan', 'rayan');
    await dlg("DLG.pend={fig:'ardena',t:'talk'};say([figSay('ardena','gruss',1)])", 'ardena', 'ardena');
    // Dialog mit Antwortknöpfen
    await ev("mode='world';$('#dlg').hidden=true;DLG.pend={fig:'mirael',t:'talk'};ask('Mirael: Willkommen in der Kreaturenstation!\\nSoll ich deine Kreaturen heilen?',['Ja, bitte!','Nein, danke'],()=>{})"); await wait(1500); await ev('TW&&TW.finish&&TW.finish()'); await wait(600); await shot(page, 'dialog_fragen');
    const q = await ev("(()=>{const b=[...document.querySelectorAll('#dlgOpts button')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,r:r.right,b:r.bottom,w:r.width,h:r.height}});const d=document.querySelector('#dlg').getBoundingClientRect();return{b,d:{y:d.y,b:d.bottom},vw:innerWidth,vh:innerHeight}})()");
    check('Dialog mit Antworten: Knöpfe ≥ 44 px hoch, im Bild', q.b.length === 2 && q.b.every(b => b.h >= 44 && b.x >= 0 && b.r <= q.vw + 1 && b.b <= q.vh + 1), q);
    await ev("mode='world';$('#dlg').hidden=true;DLG.pend=null;0");
    // Kapitel-Karte
    await ev("storyCard(STORY[1])"); await wait(1400); await shot(page, 'kapitelkarte');
    const sc = await ev("(()=>{const e=document.querySelector('#stCard');const r=e.getBoundingClientRect();return{x:r.x,y:r.y,r:r.right,b:r.bottom,w:r.width,h:r.height,clip:e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1,on:e.classList.contains('on'),vw:innerWidth,vh:innerHeight,txt:e.textContent}})()");
    check('Kapitel-Karte: im Bild, nichts abgeschnitten, eingeblendet', sc.on && sc.x >= 0 && sc.r <= sc.vw + 1 && sc.y >= 0 && sc.b <= sc.vh + 1 && !sc.clip, sc);
    // Überlappung mit HUD-Elementen am oberen Rand (Gebiet/Uhr, Minikarte, Medaillen)
    const ov = await ev(`(()=>{const c=document.querySelector('#stCard').getBoundingClientRect();const sel=['#hud','#hudBadges','#hq','#mini','#minimap','.hudTop','#hudMap','#clock'];const out=[];for(const s of sel){const e=document.querySelector(s);if(!e||e.closest('[hidden]'))continue;const r=e.getBoundingClientRect();if(r.width&&r.height&&r.x<c.right&&c.x<r.right&&r.y<c.bottom&&c.y<r.bottom&&r.width<innerWidth*.9)out.push(s+' '+Math.round(r.x)+','+Math.round(r.y)+' '+Math.round(r.width)+'×'+Math.round(r.height));}return out})()`);
    R.stCardOverlap = ov; console.log('  Info: Kapitel-Karte überlappt HUD-Elemente:', JSON.stringify(ov));
    check('Kapitel-Karte: höchstens ein kleines HUD-Element wird teilweise überdeckt (3,8 s sichtbar)', ov.length <= 1, ov);
    await wait(3800);
    // Missionsseite: Anfang des Spiels, Mitte, Ende
    const quest = async (name, flags) => {
      await ev(`G.flags={starter:1};Object.assign(G.flags,${JSON.stringify(flags)});G.badges=[${flags.badge1 ? "'Floramedaille'" : ''}${flags.badge2 ? ",'Flutmedaille'" : ''}];mode='world';openMenu('quest');0`); await wait(900);
      await shot(page, 'missionen_' + name);
      const m = await ev(`(()=>{const mn=document.querySelector('#menu'),body=document.querySelector('#mBody')||mn;const r=mn.getBoundingClientRect();const sc=[...mn.querySelectorAll('*')].filter(e=>e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='visible'&&e.clientWidth>0&&!/^(SVG|CANVAS|PATH)$/i.test(e.tagName)&&e.children.length===0&&getComputedStyle(e).textOverflow!=='ellipsis').slice(0,5).map(e=>e.className+':'+e.textContent.slice(0,30));
        const items=[...mn.querySelectorAll('.quest,.stCrys span,.badge')].filter(e=>{const q=e.getBoundingClientRect();return q.right>r.right+1||q.left<r.left-1}).length;
        const tg=[...mn.querySelectorAll('button,.tab,.mt')].filter(e=>{const q=e.getBoundingClientRect();return q.width>0&&q.height>0&&(q.height<40||q.width<40)}).map(e=>e.className+' '+Math.round(e.getBoundingClientRect().width)+'×'+Math.round(e.getBoundingClientRect().height)).slice(0,6);
        return{hidden:mn.hidden,r:{x:r.x,y:r.y,r:r.right,b:r.bottom},clip:sc,spill:items,small:tg,hscroll:mn.scrollWidth>mn.clientWidth+1,n:{quest:mn.querySelectorAll('.quest').length,chap:mn.querySelectorAll('.stch').length,crys:mn.querySelectorAll('.stCrys span').length,badges:mn.querySelectorAll('.badge').length},vw:innerWidth,vh:innerHeight}})()`);
      check(`Missionsseite „${name}“: Menü im Bild, kein seitliches Überlaufen, kein abgeschnittener Text`, !m.hidden && m.r.x >= -1 && m.r.r <= m.vw + 1 && !m.hscroll && m.spill === 0 && m.clip.length === 0, m);
      check(`Missionsseite „${name}“: 8 Kristalle, 8 Medaillen, Kapitelliste, Nebenmissionen vorhanden`, m.n.crys === 8 && m.n.badges === 8 && m.n.chap >= 3 && m.n.quest >= 14, m.n);
      R['small_' + name] = m.small;
      // nach unten scrollen: Medaillen/Gelernt sichtbar
      await ev("(()=>{const s=document.querySelector('#mBody')||document.querySelector('#menu');const sc=[s,...s.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+20);if(sc)sc.scrollTop=sc.scrollHeight;})()"); await wait(400); await shot(page, 'missionen_' + name + '_unten');
      await ev('closeMenu()'); await wait(500);
    };
    await quest('anfang', { firstcatch: 1 });
    await quest('mitte', { firstcatch: 1, s1_rivalen: 1, s1_kaine: 1, s1_elowen: 1, s2_elara: 1, badge1: 1, grunt1: 1, s2_seraphine: 1, s2_kristall: 1, badge2: 1 });
    await ev("G.story=G.story||{ch:0,help:{},seen:{}};STEPS.forEach(s=>{G.story.help[s.f]=1;if(s.help)G.story.help['k_'+s.help]=1});0");
    await quest('ende', Object.fromEntries([['firstcatch', 1], ...[].concat(JSON.parse(await ev('JSON.stringify(STEPS.map(s=>s.f))'))).map(f => [f, 1])]));
    check('Keine Seitenfehler (Dialog/Karte/Missionen)', !errs.length, errs); await ctx.close();
  }
  RES.push(R);
}
writeFileSync(new URL('./qa_b_ui.json', import.meta.url), JSON.stringify(RES, null, 1));
console.log(`\nUI-QA: ${ok} ✓, ${bad} ✗`); await browser.close(); S.close(); process.exit(bad ? 1 : 0);
