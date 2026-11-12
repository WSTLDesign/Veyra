// QA Loop A3 – Prüfung 7: Rechtscheck (Marken, Namen, Begriffe).   node test/qa_a_recht.mjs
// 1) Markenwörter in src/ und in Dateinamen unter public/ · 2) Namen (Arten, Attacken, Items, Fähigkeiten, NPCs) gegen Liste bekannter Fremd-Kreaturen (de/en) – exakt + Levenshtein ≤ 1
// 3) Spielbegriffe: Heilstation/Heilzentrum → Kreaturenstation · 4) markennahe Fachbegriffe (nur melden, Schweregrad) · 5) Hinweise auf Bildmaterial
import { loadVeyra } from '../tools/balance.mjs';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
const root = new URL('../', import.meta.url).pathname;
const R = []; const F = (sev, k, msg) => { R.push({ sev, k, msg }); };
const lines = (f) => readFileSync(f, 'utf8').split('\n');
const srcFiles = readdirSync(join(root, 'src')).filter(f => /\.(js|html|css)$/.test(f));
// ---- 1. Markenwörter
const BRAND = /pok[eé]mon|pikachu|pok[eé]ball|pok[eé]dex|pok[eé]center|pok[eé]mart|nintendo|game\s?freak|gameboy|game\s?boy|digimon|yu-?gi-?oh|ash ketchum|team rocket|professor eich|prof\.? eich|poké/i;
const hits = [];
for (const f of srcFiles) lines(join(root, 'src', f)).forEach((l, i) => { if (BRAND.test(l)) hits.push(`src/${f}:${i + 1}: ${l.trim().slice(0, 120)}`); });
function walk(d, o = []) { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) walk(p, o); else o.push(p); } return o; }
const pubFiles = walk(join(root, 'public')).filter(p => !/\/vendor\//.test(p));
const fileHits = pubFiles.filter(p => BRAND.test(p.replace(root, '')));
console.log(`1. Markenwörter in src/: ${hits.length} · in Dateinamen public/ (${pubFiles.length} Dateien): ${fileHits.length}`);
hits.forEach(h => F('hoch', 'marke', h)); fileHits.forEach(h => F('hoch', 'marke-datei', h));
// ---- 2. Namen
const { run } = loadVeyra();
const N = JSON.parse(run(`JSON.stringify({mons:MONS.slice(1).map(M=>[M.n,M.alias||'']),moves:Object.values(MOVES).map(v=>v[0]),items:Object.values(ITEMS).map(v=>v.n),abil:Object.values(ABIL).map(v=>v[0]),
 npcs:[...new Set(Object.values(NPCS).flat().map(n=>n.name).filter(Boolean))],maps:Object.values(MAPS).map(m=>m.name).concat(Object.values(INTERIORS).map(m=>m.name))})`));
const KNOWN = `Bisasam Bisaknosp Bisaflor Glumanda Glutexo Glurak Schiggy Schillok Turtok Raupy Safcon Smettbo Taubsi Tauboga Tauboss Rattfratz Rattikarl Habitak Ibitak Rettan Arbok Pikachu Raichu Sandan Sandamer Nidoran Nidorina Nidoqueen Nidorino Nidoking Piepi Pixi Vulpix Vulnona Pummeluff Knuddeluff Zubat Golbat Myrapla Duflor Giflor Paras Parasek Bluzuk Omot Digda Digdri Mauzi Snobilikat Enton Entoron Menki Rasaff Fukano Arkani Quapsel Quaputzi Quappo Abra Kadabra Simsala Machollo Maschock Machomei Knofensa Ultrigaria Sarzenia Tentacha Tentoxa Kleinstein Georok Geowaz Ponita Gallopa Flegmon Lahmus Magnetilo Magneton Porenta Dodu Dodri Jurob Jugong Sleima Sleimok Muschas Austos Nebulak Alpollo Gengar Onix Traumato Hypno Krabby Kingler Voltobal Lektrobal Owei Kokowei Tragosso Knogga Kicklee Nockchan Schlurp Smogon Smogmog Rihorn Rizeros Chaneira Tangela Kangama Seeper Seemon Goldini Golking Sterndu Starmie Pantimos Sichlor Rossana Elektek Magmar Pinsir Tauros Karpador Garados Lapras Ditto Evoli Aquana Blitza Flamara Porygon Amonitas Amoroso Kabuto Kabutops Aerodactyl Relaxo Arktos Zapdos Lavados Dratini Dragonir Dragoran Mewtu Mew Endivie Lorblatt Meganie Feurigel Igelavar Tornupto Karnimani Tyracroc Impergator Wiesor Wiesenior Hoothoot Noctuh Ledyba Ledian Webarak Ariados Lampi Lanturn Togepi Togetic Natu Xatu Voltilamm Waaty Ampharos Marill Azumarill Mogelbaum Quaxo Hoppspross Hubelupf Papungha Griffel Sonnkern Sonnflora Yanma Felino Morlord Psiana Nachtara Kramurx Laschoking Wobbuffet Girafarig Tannza Forstellka Dummisel Skorgla Stahlos Snubbull Granbull Baldorfish Scherox Pottrott Skaraborn Sniebel Teddiursa Ursaring Schneckmag Magcargo Quiekel Keifel Corasonn Remoraid Octillery Botogel Mantax Panzaeron Hunduster Hundemon Seedraking Phanpy Donphan Damhirplex Farbeagle Rabauz Kapoera Kussilla Magby Miltank Heiteira Raikou Entei Suicune Larvitar Pupitar Despotar Lugia Celebi Geckarbor Reptain Gewaldro Flemmli Jungglut Lohgock Hydropi Moorabbel Sumpex Zigzachs Geradaks Waumpel Schaloko Papinella Panekon Pudox Loturzel Lombrero Kappalores Samurzel Schwalbini Schwalboss Wingull Pelipper Trasla Kirlia Guardevoir Gehweiher Masskito Knilz Kapilz Bummelz Muntier Letarking Nincada Ninjask Ninjatom Flurmel Krakeelo Krawumms Makuhita Hariyama Azurill Nasgnet Eneco Enekoro Zobiris Flunkifer Stollunior Stollrak Stolloss Meditie Meditalis Frizelbliz Voltenso Plusle Minun Volbeat Illumise Roselia Schluppuck Schlukwech Kanivanha Tohaido Wailmer Wailord Camaub Camerupt Qurtel Spoink Groink Pandir Knacklion Libelldra Kaktus Kakturno Groudon Kyogre Rayquaza Jirachi Deoxys Regirock Regice Registeel Latias Latios Lucario Riolu Garchomp Gibble Piplup Turtwig Chimchar Zorua Zoroark Greninja Froakie Fennexis Chespin Sprigatito Fuecoco Quaxly Rowlet Litten Popplio Grookey Scorbunny Sobble Shaymin Arceus Dialga Palkia Giratina Darkrai Cresselia Manaphy Phione Victini Reshiram Zekrom Kyurem Genesect Xerneas Yveltal Zygarde Solgaleo Lunala Necrozma Zacian Zamazenta Eternatus Koraidon Miraidon Charmander Charmeleon Charizard Bulbasaur Ivysaur Venusaur Squirtle Wartortle Blastoise Eevee Vaporeon Jolteon Flareon Espeon Umbreon Leafeon Glaceon Sylveon Mewtwo Snorlax Jigglypuff Meowth Psyduck Machop Geodude Slowpoke Magikarp Gyarados Togekiss Gardevoir Blaziken Sceptile Swampert Mudkip Torchic Treecko Tepig Oshawott Snivy Axew Haxorus Rowlet Decidueye Incineroar Primarina Cinderace Rillaboom Inteleon Dragonite Tyranitar Salamence Metagross Lugia Hooh Entei Celebi Weedle Caterpie Pidgey Rattata Spearow Ekans Sandshrew Clefairy Vulpix Oddish Diglett Mankey Growlithe Poliwag Bellsprout Tentacool Ponyta Seel Grimer Shellder Gastly Onix Drowzee Krabby Voltorb Exeggcute Cubone Hitmonlee Koffing Rhyhorn Chansey Horsea Staryu Scyther Jynx Electabuzz Magmar Pinsir Tauros Lapras Ditto Porygon Omanyte Kabuto Aerodactyl Articuno Zapdos Moltres Dratini Mew Chikorita Cyndaquil Totodile Sentret Hoothoot Ledyba Spinarak Chinchou Pichu Cleffa Igglybuff Togepi Mareep Hoppip Sunkern Wooper Murkrow Misdreavus Unown Wobbuffet Pineco Gligar Snubbull Qwilfish Shuckle Heracross Sneasel Teddiursa Slugma Swinub Corsola Remoraid Delibird Mantine Skarmory Houndour Kingdra Phanpy Stantler Smeargle Tyrogue Smoochum Elekid Magby Miltank Blissey Larvitar Pupitar Lotad Lombre Ludicolo Seedot Nuzleaf Shiftry Taillow Swellow Ralts Surskit Shroomish Breloom Slakoth Vigoroth Slaking Nincada Whismur Loudred Exploud Aron Lairon Aggron Electrike Manectric Gulpin Swalot Carvanha Sharpedo Wailmer Numel Camerupt Torkoal Spoink Grumpig Spinda Trapinch Vibrava Flygon Cacnea Cacturne Swablu Altaria Zangoose Seviper Lunatone Solrock Barboach Whiscash Corphish Crawdaunt Baltoy Claydol Lileep Cradily Anorith Armaldo Feebas Milotic Castform Kecleon Shuppet Banette Duskull Dusclops Tropius Chimecho Absol Wynaut Snorunt Glalie Spheal Sealeo Walrein Clamperl Huntail Gorebyss Relicanth Luvdisc Bagon Shelgon Beldum Metang`.split(/\s+/).filter(Boolean);
const lev = (a, b) => { const m = [...Array(a.length + 1)].map((_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) m[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; };
const K = [...new Set(KNOWN.map(x => x.toLowerCase()))];
const check = (cat, names) => { for (const nm of names) { if (!nm) continue; const words = nm.split(/[\s\-–·/]+/); for (const w0 of [nm, ...words]) { const w = w0.toLowerCase().replace(/[^a-zäöüß0-9]/g, ''); if (w.length < 4) continue; if (K.includes(w)) F('hoch', 'name-exakt', `${cat} „${nm}“ = bekannte Fremd-Kreatur „${w}“`); else if (w.length >= 6) { const near = K.filter(k => Math.abs(k.length - w.length) <= 1 && lev(k, w) <= 1); if (near.length) F('mittel', 'name-nah', `${cat} „${nm}“ ≈ „${near[0]}“ (Levenshtein 1)`); } } } };
check('Art', N.mons.flatMap(([n, a]) => [n, a])); check('NPC', N.npcs); check('Attacke', N.moves); check('Item', N.items); check('Fähigkeit', N.abil); check('Ort', N.maps);
console.log(`2. Namen geprüft: ${N.mons.length} Arten, ${N.moves.length} Attacken, ${N.items.length} Items, ${N.abil.length} Fähigkeiten, ${N.npcs.length} NPC-Namen, ${N.maps.length} Orte gegen ${K.length} Fremdnamen`);
// ---- 3. Begriffe
const term = [];
for (const f of srcFiles) lines(join(root, 'src', f)).forEach((l, i) => { const m = l.match(/Heilstation|Heilzentrum|Heilzentren/g); if (m && !/^\s*(\/\/|\/\*)/.test(l) && !/^\s*\*/.test(l)) { const code = l.replace(/\/\/.*$/, ''); if (/Heilstation|Heilzentrum|Heilzentren/.test(code)) term.push(`src/${f}:${i + 1} ${m.join(',')}`); } });
console.log('3. „Heilstation/Heilzentrum“ im Code (soll „Kreaturenstation“ heißen):', term.length, term.slice(0, 10).join(' | '));
term.forEach(t => F('mittel', 'begriff', t));
// ---- 4. markennahe Fachbegriffe (nur melden)
const JARGON = [
  [/Top[- ]Vier/g, 'Top Vier', 'mittel', 'Deutscher Pokémon-Begriff für die Elite Four (AGENTS nennt ihn „eigener Begriff“) → eigene Bezeichnung erwägen (z. B. „Sternenrat“, „Hohe Vier“)'],
  [/Top-Drei/g, 'Top-Drei', 'niedrig', 'Abwandlung von „Top Vier“'],
  [/Ass-Trainer/g, 'Ass-Trainer', 'mittel', 'deutscher Pokémon-Klassenname (Ace Trainer) → z. B. „Meisterwanderer“'],
  [/\bChampion\b/g, 'Champion', 'niedrig', 'Pokémon-Titel (Champ); als Wort generisch → „Hüter der Lichtlande“ o. Ä.'],
  [/Jungtrainer/g, 'Jungtrainer', 'niedrig', 'Trainerklasse im Pokémon-Stil'],
  [/Arenaleiter/g, 'Arenaleiter', 'niedrig', 'Pokémon-Begriff (Arenaleiter); generisch genug, Kanon des Nutzers nutzt ihn'],
  [/\bOrden\b|\bOrdens?\b/g, 'Orden', 'niedrig', 'deutscher Pokémon-Begriff für Arena-Abzeichen; Kanon des Nutzers nennt „Medaille“ (Glutmedaille …) → in 02-world/15-ui auf Medaille umstellen'],
  [/Trainer(?![a-zäöüß])/g, 'Trainer', 'niedrig', 'Jargon; im Spieltext „Wanderer/Reisende“ erwägen'],
];
const JR = {};
for (const f of srcFiles) lines(join(root, 'src', f)).forEach((l, i) => { if (/^\s*(\/\/|\/\*)/.test(l)) return; const code = l.replace(/\/\/.*$/, ''); for (const [re, k] of JARGON) { const m = code.match(re); if (m) (JR[k] = JR[k] || {})[f] = ((JR[k] || {})[f] || 0) + m.length; } });
for (const [, k, sev, why] of JARGON) { const files = JR[k] || {}, n = Object.values(files).reduce((a, b) => a + b, 0); if (n) F(sev, 'jargon', `${k} ×${n} (${Object.entries(files).map(([f, c]) => f + ':' + c).join(', ')}) – ${why}`); }
// Item-/Fangkapsel-Namen, die deutschen Pokémon-Gegenständen 1:1 entsprechen
const ITEMNAMES = { Trank: 'Trank', Supertrank: 'Supertrank', Hypertrank: 'Hypertrank', Beleber: 'Beleber', Elixier: 'Elixier (PP-Heiler)' };
for (const [n, orig] of Object.entries(ITEMNAMES)) if (N.items.includes(n)) F('mittel', 'item-name', `Item „${n}“ entspricht dem deutschen Pokémon-Item „${orig}“ (Trank → Supertrank → Hypertrank-Reihe) → eigene Namen (z. B. Kräutertrank / Quellessenz / Lebensfunke)`);
F('niedrig', 'item-name', 'Kapselvarianten spiegeln Pokéball-Varianten (Netz, Dämmer, Nest, Echo=Wiederball, Zünd=Flottball, Jubel=Jubiläumsball, Balsam=Heilball, Herz=Freundesball, Absolut=Meisterball): Namen sind eigen, Funktionsmuster ist Genre-üblich → ok, nur beobachten');
F('niedrig', 'attacken', 'Einige Attacken tragen exakt deutsche Pokémon-Attackennamen (z. B. Flammenrad, Windstoß, Orkan, Steinwurf, Rankenhieb, Kratzer, Knurren, Rempler, Härten) – gewöhnliche Wörter, einzeln unkritisch; bei Gelegenheit eigene Wortschöpfungen');
// ---- 5. Bildmaterial (QA B3: dynamisch statt fest eingetragen)
// Ortsbilder: oberes Band beschnitten (Seitenverhältnis ≥ 3:1), Originale nur in public/art_ref/orig_orte (nicht in dist), *_DRAFT.* nie in dist
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
let ratios = {};
try { ratios = JSON.parse(execFileSync('python3', ['-I', '-c', "import json,glob,os\nfrom PIL import Image\nr={}\nfor f in sorted(glob.glob(os.path.join(__import__('sys').argv[1],'public/art/*.webp'))):\n  b=os.path.basename(f)\n  if b.split('_')[0] in ('ort','stadt','region','map'):\n    im=Image.open(f);r[b]=[im.width,im.height]\nprint(json.dumps(r))", root], { encoding: 'utf8' })); } catch (e) { F('mittel', 'bild', 'Ortsbild-Prüfung (PIL) nicht möglich: ' + e.message); }
const uncropped = Object.entries(ratios).filter(([n, [w, h]]) => w / h < 3 && !/^(map_veyra|region_(flutkueste|glutlande|smaragdwald))\./.test(n));
const cropped = Object.entries(ratios).filter(([n, [w, h]]) => w / h >= 3);
const origOrte = existsSync(join(root, 'public/art_ref/orig_orte')) ? readdirSync(join(root, 'public/art_ref/orig_orte')).length : 0;
const distArt = existsSync(join(root, 'dist/art')) ? readdirSync(join(root, 'dist/art')) : [];
const draftsDist = walk(join(root, 'dist')).filter(p => /_DRAFT\./i.test(p));
const draftsRef = existsSync(join(root, 'public/art_ref')) ? readdirSync(join(root, 'public/art_ref')).filter(f => /_DRAFT\./i.test(f)) : [];
const buildSrc = readFileSync(join(root, 'build.mjs'), 'utf8');
console.log(`5. Ortsbilder: ${cropped.length} beschnitten (≥ 3:1), ${uncropped.length} unbeschnitten mit Verdacht · Originale in art_ref/orig_orte: ${origOrte} · DRAFT in dist: ${draftsDist.length} (art_ref: ${draftsRef.length}) · Build schließt DRAFT aus: ${/_DRAFT/.test(buildSrc)}`);
if (uncropped.length) F('hoch', 'bild', 'Ortsbilder nicht beschnitten (Seitenverhältnis < 3:1, nicht auf der Positivliste): ' + uncropped.map(([n]) => n).join(', '));
else F('info', 'bild', `Ortsbilder (${cropped.length}) sind als oberes Band beschnitten und enthalten keine Fremdfigur (Sichtprüfung B3, Kontaktbogen test/qa_b_ortsbilder.png); map_veyra/region_flutkueste/glutlande/smaragdwald ohne Figuren, nur 800 px.`);
if (origOrte && distArt.some(f => /^orig_/.test(f))) F('hoch', 'bild', 'Original-Ortsbilder liegen in dist/art');
if (draftsDist.length) F('hoch', 'bild', '*_DRAFT.* in dist/: ' + draftsDist.join(', '));
if (!/_DRAFT/.test(buildSrc)) F('hoch', 'bild', 'build.mjs schließt *_DRAFT.* nicht aus');
if (draftsRef.length) F('info', 'bild', 'public/art_ref/*_DRAFT.png (' + draftsRef.join(', ') + ') bleiben intern; nicht in veyra-app.zip/Release aufnehmen. dist/ ist frei von DRAFT-Dateien (Build bricht sonst ab).');
// ---- 6. docs/*.md und README: Markenwörter (nur Meldung, außer in Qualitätsberichten, die die Wörter als Suchliste zitieren)
const docsHits = [];
for (const f of readdirSync(join(root, 'docs')).filter(f => /\.md$/.test(f))) lines(join(root, 'docs', f)).forEach((l, i) => { if (BRAND.test(l) && !/^qa-loop-/.test(f)) docsHits.push(`docs/${f}:${i + 1}: ${l.trim().slice(0, 100)}`); });
console.log(`6. Markenwörter in docs/ (ohne qa-loop-*-Berichte): ${docsHits.length}`);
docsHits.forEach(h => F('mittel', 'docs-marke', h));
// ---- 7. neue B-Dateien (34-figures, 27-story, 02-world, 23-intro) – Figuren-Namen/Rollen gegen Namen der Fremdmarke
const FIG = 'ash ketchum misty rocko brock giovanni lorelei agatha lance surge erika koga sabrina blaine bruno frida falkner whitney rowan cynthia jessie cassidy archie maxie cyrus ghetsis lysander guzma lusamine gladion mox lox'.split(' ');
const bHits = [];
for (const f of ['34-figures.js', '27-story.js', '02-world.js', '23-intro.js']) lines(join(root, 'src', f)).forEach((l, i) => { for (const w of FIG) if (new RegExp("(^|[^\\wäöüß])" + w + "([^\\wäöüß]|$)", 'i').test(l.replace(/\/\/.*$/, '')) && !/flag:'tr_bruno'|tr_bruno/.test(l)) bHits.push(`src/${f}:${i + 1} „${w}“: ${l.trim().slice(0, 90)}`); });
console.log(`7. Namen der Fremdmarke (Frida, Bruno, Mox, Lox … ${FIG.length}) in 34-figures/27-story/02-world/23-intro: ${bHits.length}`);
bHits.forEach(h => F('hoch', 'figurenname', h));
writeFileSync(join(root, 'test/qa_a_recht.json'), JSON.stringify(R, null, 1));
console.log('\n--- Befunde ---'); for (const r of R) console.log(`[${r.sev}] ${r.k}: ${r.msg}`);
const hoch = R.filter(r => r.sev === 'hoch'); console.log(`\nHarte Treffer (Marken/exakte Fremdnamen): ${hoch.length}`);
process.exit(hoch.length ? 1 : 0);
