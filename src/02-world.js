// ===== VEYRA – Welt, Story, Missionen =====
// Kacheln: T Baum, R Fels, ~ Wasser, X Höhlenwand, h/P/M/A/L Gebäude, Ziffern Türen,
// . Boden, , Weg, " hohes Gras, F Blumen, = Brücke, c Höhlenboden, : dunkler Höhlenboden
const MAPS={
morgenau:{name:'Morgenau',theme:'default',n:'route1',gate:{n:{f:'starter',m:'Ohne eigene Kreatur ist das hohe Gras zu gefährlich. Geh zuerst ins Labor von Professor Veyran!'}},
 doors:{1:'haus_spieler',2:'haus_nachbar',3:'labor'},rows:[
'TTTTTTTTT,,TTTTTTTTT','TFF......,,......FFT','T..hhhh..,,..hhhh..T','T..hhhh..,,..hhhh..T','T..h1hh..,,..hh2h..T',
'T...,....,,....,...T','T,,,,,,,,,,,,,,,,,,T','T........,,........T','T....LLLLLL........T','T....LLLLLL....FF..T',
'T....LL3LLL....FF..T','T.......,..........T','TFF.....,.....~~~~.T','TTTTTTTTTTTTTTTTTTTT']},
route1:{name:'Route 1',theme:'default',s:'morgenau',n:'kupferhain',
 enc:{day:[[59,2,5],[59,2,5],[112,2,5],[112,3,5],[61,3,5]],night:[[112,2,5],[112,3,5],[76,3,5],[59,2,4]]},rows:[
'TTTTTTTTT,,TTTTTTTTT','T""""....,,....""""T','T""""....,,....""""T','T........,,........T','T..TT....,,....TT..T',
'T,,,,,,,,,,,......FT','T,""""""""".......T','T,""""""""""...TT..T','T,,,,,,,,,,,,,,,...T','T.......TT....,....T',
'T..""""......,,..""T','T..""""......,...""T','T..""""....,,,...""T','TFF........,.......T','T...TT.....,,,,....T',
'T..........,..,....T','T,,,,,,,,,,,..,,,,.T','T,.......""""""""".T','T,.......""""""""".T','T,,,,,,,,,,,,,,,,..T',
'T........,,........T','TTTTTTTTT,,TTTTTTTTT']},
kupferhain:{name:'Kupferhain',theme:'default',s:'route1',e:'route2',
 doors:{1:'arena1',2:'heil_kupfer',3:'laden_kupfer',4:'haus_kupfer'},rows:[
'TTTTTTTTTTTTTTTTTTTT','T....AAAAAA........T','T....AAAAAA...hhhh.T','T....AAA1AA...hh4h.T','T.......,......,...T',
'T,,,,,,,,,,,,,,,,,,,','T.......,......,...,','T.PPPP..,..MMMM,....','T.PPPP..,..MMMM,..FT','T.PP2P..,..MM3M,..FT',
'T...,...,....,,....T','T...,,,,,,,,,,.....T','T........,,........T','TFF......,,......FFT','T........,,........T',
'TTTTTTTTT,,TTTTTTTTT']},
route2:{name:'Route 2',theme:'default',w:'kupferhain',e:'brisenhafen',gate:{e:{f:'grunt1',m:'Geröll versperrt den Weg! Spuren vom Schattenorden führen in die Nebelgrotte.'}},
 doors:{1:'nebelgrotte'},enc:{day:[[72,6,9],[57,6,9],[90,6,9],[59,6,8]],night:[[76,6,9],[72,6,9],[112,6,9]]},rows:[
'TTTTTTTTTTTTTTTTTTTT','T""".....XXXX....""T','T""".....X1XX....""T','T.......,,,......""T','T"""....,.........TT',
',,,,,,,,,,,,,,,,,,,,',',,""""""...""""",,,,','T.""""".TT.""""""...','T.......TT.........T','T..~~~~......""""..T',
'T..~~~~......""""..T','TFF..............FFT','TTTTTTTTTTTTTTTTTTTT']},
nebelgrotte:{name:'Nebelgrotte',theme:'cave',doors:{1:'@out'},enc:{day:[[57,9,12],[76,9,12],[75,10,12]],night:[[76,10,13],[57,9,12],[75,10,13]]},rows:[
'XXXXXXXXXXXXXXXXXXXX','X::::ccccccccc:::::X','X::::cXXXXXXXc:::::X','X::cccX:::::Xccc:::X','X::c::X:::::X::c:::X',
'XcccccX::c::XcccccXX','X:::::XXXcXXX::::::X','X:::::::ccc::::::::X','XXXX::::c::::::XXXXX','X:::::::c:::::::::cX',
'X:::cccccccccc::::cX','X:::c::::::::c::::cX','X:::c::::::::cccccXX','XXXXXXXXc1XXXXXXXXXX']},
brisenhafen:{name:'Brisenhafen',theme:'beach',w:'route2',n:'route3',gate:{n:{f:'badge2',m:'Ein Seemann: „Nach Norden geht es erst mit der Flutmedaille. Frag Neria in der Arena!"'}},
 doors:{1:'heil_brise',2:'laden_brise',3:'arena2',4:'haus_sammler'},rows:[
'TTTTTTTTT,,TTTTTTTTT','T........,,........T','T.PPPP...,,..MMMM..T','T.PP1P...,,..MM2M..T','T...,....,,....,...T',
',,,,,,,,,,,,,,,,,,,,',',,......,,,........T','T..AAAAAA,,..hhhh..T','T..AAAAAA,,..hh4h..T','T..AA3AAA,,....,...T',
'T....,...,,,,,,,...T','T....,,,,,.........T','T..................T','T~~~~~~~~~~~~~~~~~~T','T~~~~~~~~~~~~~~~~~~T',
'TTTTTTTTTTTTTTTTTTTT']},
route3:{name:'Route 3 · Sonnenhang',theme:'default',s:'brisenhafen',n:'frostheim',
 enc:{day:[[37,15,19],[90,15,18],[61,15,18],[59,16,19]],night:[[76,15,19],[75,15,18],[37,15,18]]},rows:[
'TTTTTTTTT,,TTTTTTTTT','T""""""..,,..""""""T','T""""""..,,..""""""T','T........,,.....F..T','T.RR.....,,.....RR.T',
'T.RR..""",,""".....T','T.....""",,"""..F..T','T..FF....,,.........','T..FF....,,,,,,,...T','T~~~~~~~~==~~~~~~~~T',
'T~~~~~~~~==~~~~~~~~T','T........,,........T','T.""""...,,..""""..T','T.""""...,,..""""..T','T.RRR....,,.....RRRT',
'T........,,........T','TTTTTTTTT,,TTTTTTTTT']},
frostheim:{name:'Frostheim',theme:'snow',s:'route3',e:'route4',gate:{e:{f:'badge3',m:'Ein Wächter: „Der Pass nach Osten ist vereist. Komm mit der Frostmedaille wieder."'}},
 doors:{1:'arena3',2:'heil_frost',3:'laden_frost'},enc:{day:[[75,22,25],[37,22,24]],night:[[75,22,25],[76,23,25]]},rows:[
'TTTTTTTTTTTTTTTTTTTT','T..................T','T..AAAAAA....PPPP..T','T..AAAAAA....PP2P..T','T..AA1AAA.....,....T',
'T....,........,....T','T....,,,,,,,,,,,,,,,','T........,,........,','T..MMMM..,,..""""..,','T..MM3M..,,..""""..T',
'T....,...,,..""""..T','T....,,,,,,........T','T........,,........T','T........,,........T','T........,,........T',
'TTTTTTTTT,,TTTTTTTTT']},
route4:{name:'Route 4 · Nebelmarsch',theme:'swamp',w:'frostheim',e:'schattmoor',gate:{e:{f:'boss1',m:'Der Späher Kaine versperrt mit seinen Kreaturen den Weg. Sprich mit ihm!'}},
 enc:{day:[[72,26,30],[58,28,30],[90,26,29],[57,26,29]],night:[[31,27,30],[113,28,30],[76,27,30]]},rows:[
'TTTTTTTTTTTTTTTTTTTT','T""""""""..""""""""T','T""""""""..""""""""T','T....TT........TT..T','T"""".....RR.....""T',
'T""""..........""""T',',,,,,,,,,,,,,,,,,,,,',',,,,,,,,,,,,,,,,,,,,','T""""..........""""T','T"""".....RR...."""T',
'T....TT........TT..T','T""""""""..""""""""T','T""""""""..""""""""T','TTTTTTTTTTTTTTTTTTTT']},
schattmoor:{name:'Schattmoor',theme:'swamp',w:'route4',n:'siegesstrasse',gate:{n:{f:'badge4',m:'Ein Wächter: „Erst mit der Schattenmedaille darfst du zur Siegesstraße."'}},
 doors:{1:'arena4',2:'heil_schatt',3:'laden_schatt'},enc:{day:[[31,30,33],[37,30,32]],night:[[31,31,34],[32,32,34]]},rows:[
'TTTTTTTTT,,TTTTTTTTT','T........,,........T','T.PPPP...,,..MMMM..T','T.PP2P...,,..MM3M..T','T...,....,,....,...T',
'T...,,,,,,,,,,,,...T',',,,,,....,,........T',',,.......,,..~~~~..T','T..AAAAAA,,..~~~~..T','T..AAAAAA,,........T',
'T..AA1AAA,,..""""..T','T....,...,,..""""..T','T....,,,,,,,,,,,,,,,','T..................T','TFF..............FFT',
'TTTTTTTTTTTTTTTTTTTT']},
siegesstrasse:{name:'Siegesstraße',theme:'default',s:'schattmoor',doors:{1:'liga',2:'heil_sieg'},
 enc:{day:[[58,36,40],[76,36,40],[73,37,40],[60,37,40]],night:[[32,37,40],[76,36,40],[113,37,40]]},rows:[
'TTTTTTTTTTTTTTTTTTTT','T..RRR.......RRRR..T','T..R...............T','T....AAAAAAAAAA....T','T....AAAAAAAAAA....T',
'T....AAAAA1AAAA....T','T.........,........T','T"""""....,...""""""','T"""""....,....""""T','T.RR......,......RRT',
'T.RR..""".,."""..RRT','T.....""".,.""".....T','T.........,........T','T..PPPP...,........T','T..PP2P...,........T',
'T.........,,.......T','TTTTTTTTT,,TTTTTTTTT']},
// ===== Erweiterung: Windküste, Möwenbucht, Glutschlucht, Flüstertal =====
windkueste:{name:'Windküsten-Pfad',theme:'beach',w:'brisenhafen',s:'moewenbucht',
 enc:{day:[[25,18,21],[59,18,21],[60,19,22],[37,18,22],[115,19,22],[4,18,21],[26,21,23]],night:[[25,18,21],[37,19,22],[38,20,23],[117,19,23],[53,20,23],[59,18,21]]},rows:[
 'TTTTTTTTTTTTTTTTTTTT','TTT""""""~~"""""""TT','TT"""""F"~~""""""RTT','T"F""""""~~""F""""RT','T""""""""~~""""""""T',
 ',,,,,,,,,==,,,,,,,.T','T""""""""~~""""""F.T','T""F"RR""~~""R""",.T','T""""R"""~~"F"""",.T','T""""""""~~"""""",.T',
 'T..,,,,,,,,,,,,,,,.T','T.R,"""""~~"""""""TT','TF.,"""""~~""RR""FTT','TR.,"""""~~"""R""""T','T.F,"""""~~""""""""T',
 'T..,,,,,,==,,,,,,..T','T..."""""~~""""",..T','T...""RR"~~"""F",RRT','T..."""R"~~"F""",.RT','T..."""""~~""""",..T',
 'T........,,,,,,,,..T','T"""""""F,,.RRRRRRRT','T"F""""R",,R~~~~~~~T','T"""RR""",,R~~~~~~~T','T""""R""",,R~~~~~~~T',
 'T"""""""",,R~~~~~~~T','TTT"""""",,R~~~~~~~T','TTTTTTTTT,,TTTTTTTTT']},
moewenbucht:{name:'Möwenbucht',theme:'beach',n:'windkueste',
 doors:{1:'heil_moewe',2:'haus_moewe1',3:'haus_moewe2',4:'laden_moewe',5:'haus_moewe3'},rows:[
 'TTTTTTTTT,,TTTTTTTTT','TTFF.....,,.....FFTT','TT.PPPP..,,..hhhh.TT','T..PP1P..,,..hh2h..T','T....,...,,....,...T',
 'T....,,,,,,,,,,,...T','T.hhhh...,,..MMMM..T','T.hh3h...,,..MM4M..T','T...,....,,....,...T','TR..,,,,,,,,,,,,..RT',
 'T......F.,,..hhhh..T','T........,,..hh5h..T','TF..,,,,,,,,,,,,,.FT','T.R...F...,...F..R.T','T~~~~~~~~~=~~~~~~~~T',
 'T~~~~~~~~~=~~~~~~~~T','T~~~~~~~~~~~~~~~~~~T','TTTTTTTTTTTTTTTTTTTT']},
glutschlucht:{name:'Glutschlucht',theme:'ember',w:'route3',
 doors:{1:'huette_glut'},enc:{day:[[2,24,28],[34,25,29],[22,24,28],[58,25,29],[57,24,27],[23,28,30]],night:[[34,26,30],[2,25,29],[22,25,29],[113,25,28],[32,28,30],[31,24,27]]},rows:[
 'XXXXXXXXXXXXXXXXXXXX','X........X.........X','X....."""X.""".""""X','X.hhhh"""X.""".""""X','X.hh1h"""X.""".""""X',
 'X...,....X.""".""""X','X...,....X.""".....X',',,,,,,,,,.,,,,,..RRX','X..F.....X....,.F..X','X.""""...X..F.,""""X',
 'XR""""F..X..R.,""""X','X.""""...X....,""""X','X."""".RRX.R..,""""X','X........X....,....X','XXXXXXXXXXXXXX.XXXXX',
 'X........X.""",....X','X.F....RRX.""",."""X','X........X.R..,."""X','X..,,,,,,.,,,,,."""X','XR.......X.R...."""X',
 'X...F...RX.........X','XXXXXXXXXXXXXXXXXXXX']},
fluestertal:{name:'Flüstertal',theme:'whisper',w:'schattmoor',
 doors:{1:'huette_fluester'},enc:{day:[[61,32,35],[62,33,37],[53,33,37],[8,32,35],[91,34,37],[122,36,38]],night:[[31,32,35],[32,34,38],[117,33,37],[113,32,36],[6,36,38],[61,32,35]]},rows:[
 'TTTTTTTTTTTTTTTTTTTT','T""""".""~~...R....T','T""""".""~~.R.,.R..T','T""F"".""~~...,..F.T','T""""".""~~.R.,.R..T',
 'T"""""..F~~...,....T','TT"""",,,==,,,,...TT','TTF""",""~~"""....TT','T""""",""~~"""...FTT','T""""",""~~..F.....T',
 'T""""",""~~.~~~~~..T','TT....,""...~~~~~..T',',,,F,,,.....~~~~~..T','T.....,..T.R.....R.T','T""""",.FT.....""""T',
 'T""""",........""""T','T"""F",...hhhh."F""T','T""""",.R.hh1h.""""T','T""""",.....,..""""T','T""""",....F,..""""T',
 'TT....,,,,,,,,...TTT','T""""""""""""""""""T','T"F""""R""""""""F""T','T""""""""""""""""""T','TT"""""""""""""""T"T',
 'TTTTTTTTTTTTTTTTTTTT']}
};

// Innenräume (werden generiert)
const INTERIORS={
 haus_spieler:{k:'house',name:'Dein Zuhause'},haus_nachbar:{k:'house',name:'Haus der Nachbarn'},labor:{k:'lab',name:'Labor'},
 heil_kupfer:{k:'heal',name:'Kreaturenstation'},laden_kupfer:{k:'shop',name:'Laden',stock:['kapsel','trank','supertr']},
 haus_kupfer:{k:'house',name:'Wohnhaus'},arena1:{k:'arena',name:'Arena Kupferhain'},
 heil_brise:{k:'heal',name:'Kreaturenstation'},laden_brise:{k:'shop',name:'Hafenmarkt',stock:['kapsel','superk','netz','trank','supertr','beleber','donnerstein','froststein','blattstein']},
 arena2:{k:'arena',name:'Arena Brisenhafen'},haus_sammler:{k:'house',name:'Haus des Sammlers'},
 arena3:{k:'arena',name:'Arena Frostheim'},heil_frost:{k:'heal',name:'Kreaturenstation'},
 laden_frost:{k:'shop',name:'Laden',stock:['superk','ultra','daemmer','supertr','hypertr','beleber','elixier','lichtstein','dunkelstein']},
 arena4:{k:'arena',name:'Arena Schattmoor'},heil_schatt:{k:'heal',name:'Kreaturenstation'},
 laden_schatt:{k:'shop',name:'Laden',stock:['superk','ultra','daemmer','netz','hypertr','beleber','elixier','dunkelstein','lichtstein','blattstein','froststein','donnerstein']},
 liga:{k:'liga',name:'Liga von Veyra'},heil_sieg:{k:'heal',name:'Kreaturenstation'},
 heil_moewe:{k:'heal',name:'Kreaturenstation'},laden_moewe:{k:'shop',name:'Möwenmarkt',stock:['superk','ultra','netz','supertr','hypertr','beleber','elixier','blattstein','froststein','donnerstein']},
 haus_moewe1:{k:'house',name:'Fischerhaus'},haus_moewe2:{k:'house',name:'Netzflickerei'},haus_moewe3:{k:'house',name:'Haus des Leuchtturmwärters'},
 huette_glut:{k:'house',name:'Hütte am Schluchteingang'},huette_fluester:{k:'house',name:'Kräuterhütte'}
};
// Detailing Innenräume (docs/innen.md): Möbel-Felder je Raumtyp – [x,y,b,h,Kachel,Möbel]. Die Kachel blockiert (B hoch, K/C niedrig, R Pflanze/Säule),
// das Möbel zeichnet 51-innen.js genau auf diese Felder (Kollision = Darstellung). Figuren-Felder und Eingang (5,h-2) bleiben frei.
const INNEN_FURN={
 house:[[1,1,1,1,'K','herd'],[2,1,1,1,'K','spuele'],[3,1,1,1,'K','anrichte'],[7,1,1,1,'B','regal'],[8,1,1,1,'B','schrank'],[9,1,1,2,'K','bett'],
  [1,3,1,1,'B','kamin'],[1,5,1,1,'K','sessel'],[6,4,2,1,'K','tisch'],[9,6,1,1,'K','kommode'],[1,7,1,1,'R','pflanze'],[9,7,1,1,'R','pflanze']],
 lab:[[1,1,2,1,'B','laborregal'],[3,1,5,1,'K','konsole'],[8,1,2,1,'B','resonator'],[2,4,7,1,'K','labortisch'],[8,6,2,2,'K','analysetisch'],
  [1,6,1,1,'B','serverschrank'],[1,7,1,1,'R','pflanze']],
 shop:[[1,1,3,1,'B','warenregal'],[7,1,3,1,'B','warenregal'],[2,3,7,1,'C','ladentheke'],[1,5,1,2,'B','seitenregal'],[9,5,1,1,'K','auslage'],
  [9,6,1,1,'K','korb'],[1,7,1,1,'R','pflanze'],[9,7,1,1,'R','pflanze']],
 heal:[[1,1,1,1,'B','medizinregal'],[4,1,3,1,'B','heilgeraet'],[9,1,1,1,'B','medizinregal'],[2,3,7,1,'C','empfang'],[1,5,1,2,'K','wartebank'],
  [9,5,1,1,'K','terminal'],[1,7,1,1,'R','pflanze'],[9,7,1,1,'R','pflanze']],
 arena:[[1,1,9,1,'B','emblemwand'],[1,2,1,9,'B','tribuene'],[9,2,1,9,'B','tribuene'],[2,3,1,1,'R','saeule'],[8,3,1,1,'R','saeule'],[2,6,1,1,'R','saeule'],
  [8,6,1,1,'R','saeule'],[2,9,1,1,'R','saeule'],[8,9,1,1,'R','saeule'],[1,11,1,1,'R','pflanze'],[9,11,1,1,'R','pflanze']],
 liga:[[1,1,4,15,'B','rang'],[6,1,4,15,'B','rang']]};
function buildInterior(id){
 const I=INTERIORS[id];let w=11,h=9;if(I.k==='arena')h=13;if(I.k==='liga')h=17;
 const r=[];for(let y=0;y<h;y++){let s='';for(let x=0;x<w;x++){
  if(y===0||x===0||x===w-1)s+='W';else if(y===h-1)s+=(x===5?'E':'W');else s+='o';}r.push(s);}
 const set=(x,y,c)=>{r[y]=r[y].slice(0,x)+c+r[y].slice(x+1);};
 const furn=[];for(const[x,y,b,hh,t,k]of INNEN_FURN[I.k]||[]){for(let j=0;j<hh;j++)for(let i=0;i<b;i++)set(x+i,y+j,t);furn.push({x,y,w:b,h:hh,t,k});}
 return {name:I.name,theme:'inside',rows:r,doors:{},inside:1,id,furn};
}

// NPCs je Karte. t: talk|trainer|nurse|shop|starter|legend|item
// B2 Story: hook = Gesprächslogik in 27-story.js · fig = Figuren-ID (docs/figuren.md, 34-figures.js) · sOn = nur sichtbar, wenn alle Flags gesetzt · sOff = verschwindet, sobald ein Flag gesetzt ist
const NPCS={
 haus_spieler:[{x:3,y:3,c:'#d97a8a',t:'talk',hook:'mama',fig:'mama',txt:['Mama: Heute ist dein großer Tag! Professor Veyran wartet im Labor auf dich.','Mama: Komm zwischendurch nach Hause. Dann ruht ihr euch aus.'],heal:1}],
 haus_nachbar:[{x:4,y:3,c:'#9a7ac9',t:'talk',hook:'elowen',fig:'elowen',txt:['Oma Elowen: Komm ruhig herein, Kind. Ich koche gerade Fliedertee.']}],
 labor:[{x:5,y:2,c:'#e8e8e8',t:'talk',prof:1,hook:'veyran',fig:'veyran'},
  {x:3,y:4,c:'#f2753a',t:'starter',mon:1},{x:5,y:4,c:'#3d8fe0',t:'starter',mon:4},{x:7,y:4,c:'#4cb85c',t:'starter',mon:7},
  {x:8,y:2,c:'#2f6f5a',t:'talk',hook:'tarek',fig:'tarek'},
  {x:3,y:6,c:'#c8463a',t:'talk',hook:'rayan_labor',fig:'rayan',sOn:'starter',sOff:'s1_rivalen'},
  {x:7,y:6,c:'#3d8fe0',t:'talk',hook:'mira_labor',fig:'mira',sOn:'starter',sOff:'s1_rivalen'}],
 morgenau:[{x:15,y:7,c:'#c9a77c',t:'talk',txt:['In Veyra wechseln Tag und Nacht. Manche Kreaturen zeigen sich nur im Mondlicht!']}],
 route1:[{x:5,y:9,c:'#5cc8b4',t:'trainer',d:'right',name:'Wanderer Jonas',team:[[59,4],[112,5]],flag:'tr_jonas',pre:'He, du! Lass uns kämpfen!',post:'Wow, du bist gut!',money:120},
  {x:17,y:3,c:'#e8c22e',t:'sparkle',item:'trank',n:2,flag:'it_r1'},
  {x:12,y:2,c:'#3a2f4a',t:'talk',hook:'kaine1',fig:'kaine',sOn:'firstcatch',sOff:'s1_kaine'}],
 kupferhain:[{x:12,y:12,c:'#c96b5a',t:'talk',txt:['Arenaleiter Lior liebt Flora-Kreaturen. Glut und Frost helfen gegen sie!']},
  {x:16,y:12,c:'#2f6b3c',t:'talk',hook:'elara',fig:'elara',sOn:'s1_elowen'},
  {x:3,y:12,c:'#7fae5a',t:'talk',hook:'wilma',fig:'wilma',name:'Gärtnerin Wilma'}],
 haus_kupfer:[{x:4,y:3,c:'#8aa86a',t:'talk',txt:['Tipp: Attacken, die zum Element deiner Kreatur passen, sind 50 % stärker.','Tipp: Im Team-Menü kannst du jeder Kreatur bis zu 4 Attacken geben.']}],
 arena1:[{x:5,y:2,c:'#4cb85c',t:'trainer',name:'Arenaleiter Lior',fig:'lior',team:[[19,12],[8,14]],flag:'badge1',leader:'Floramedaille',pre:['Lior: Willkommen in meinem Garten-Tempel!','Lior: Meine Kreaturen wachsen mit jedem Kampf. Wächst du mit?'],post:'Du hast ein gutes Herz. Nimm die Floramedaille!',money:1400,gift:['superk',3]},
  {x:5,y:7,c:'#8ac46a',t:'trainer',d:'down',name:'Gärtner Pim',team:[[112,9],[90,10]],flag:'tr_pim',pre:'An mir kommst du nicht vorbei!',post:'Na gut, geh zu Lior.',money:180}],
 route2:[{x:13,y:5,c:'#e8c22e',t:'trainer',d:'left',name:'Wanderin Juna',team:[[72,9],[57,10]],flag:'tr_mia',pre:'Die Route gehört mir!',post:'Unglaublich…',money:300},
  {x:18,y:6,c:'#5a4a6a',t:'talk',txt:['Ein Bauarbeiter: Leute in dunklen Mänteln haben Felsen auf den Weg gerollt!','Ein Bauarbeiter: Sie sind in die Nebelgrotte gelaufen. Sie suchen einen Kristall.'],hideIf:'grunt1'}],
 nebelgrotte:[{x:8,y:8,c:'#4a3a63',t:'trainer',d:'down',name:'Ordensrekrut Knut',fig:'orden',team:[[31,13],[112,14]],flag:'grunt1',vanish:1,pre:['Knut: Halt! Hier kommt keiner durch!','Knut: Äh… ich meine: Der Schattenorden braucht diesen Kristall!'],post:'Oh nein. Ich hab verloren. Und mich verlaufen.',money:500},
  {x:9,y:4,t:'legend',mon:147,lvl:45,flag:'leg_noct',night:1,req:'badge3',txt:'Ein kühler Hauch liegt in der Luft… Nachts soll hier etwas erwachen.'},
  {x:18,y:11,c:'#e8c22e',t:'item',item:'dunkelstein',n:1,flag:'it_grotte'},
  {x:10,y:7,c:'#5a2f6a',t:'talk',hook:'seraphine1',fig:'seraphine',sOn:'grunt1',sOff:'s2_seraphine'}],
 brisenhafen:[{x:10,y:12,c:'#3d8fe0',t:'talk',txt:['Neria kennt jede Welle. Volt und Flora helfen gegen ihre Flut-Kreaturen!']},
  {x:6,y:12,c:'#3d8fe0',t:'trainer',name:'Rivalin Mira',fig:'mira',hook:'mira1',flag:'s3_mira',sOn:'s2_kristall',team:[[4,16],[59,15]],pre:['Mira: Da bist du ja! Ich hab schon auf dich gewartet.','Mira: Bevor du zu Neria gehst: ein Probekampf?'],post:'Puh! Du bist echt stark geworden.',money:700},
  {x:16,y:12,c:'#2a5f9a',t:'talk',hook:'marlene',fig:'marlene',name:'Kapitänin Marlene'},
  {x:16,y:6,c:'#b8864a',t:'talk',hook:'borwin',fig:'borwin',name:'Händler Borwin'}],
 haus_sammler:[{x:4,y:3,c:'#c9a77c',t:'talk',collector:1}],
 arena2:[{x:5,y:2,c:'#3d8fe0',t:'trainer',name:'Arenaleiterin Neria',fig:'neria',team:[[37,18],[5,20],[38,22]],flag:'badge2',leader:'Flutmedaille',pre:['Neria: Willkommen im Wasserpalast.','Neria: Das Meer ist ruhig und stark. Zeig mir deine Wellen!'],post:'Du schwimmst mit dem Strom. Die Flutmedaille gehört dir!',money:2200,gift:['netz',3]},
  {x:5,y:7,c:'#5ab0e0',t:'trainer',d:'down',name:'Matrose Kuno',team:[[37,16],[59,17]],flag:'tr_kuno',pre:'Volle Kraft voraus!',post:'Schiffbruch…',money:400}],
 route3:[{x:9,y:6,c:'#c8463a',t:'trainer',d:'down',name:'Rivale Rayan',fig:'rayan',team:[[60,21],[61,20],[57,21]],flag:'tr_lio',pre:['Rayan: Da bist du ja, {name}! Ich hab schon zwei Medaillen.','Rayan: Zeig mal, ob du mithalten kannst!'],post:'Grr… Nächstes Mal gewinne ich! Auf der Brücke steht übrigens jemand vom Orden.',money:900},
  {x:16,y:3,t:'legend',mon:142,lvl:42,flag:'leg_sol',day:1,req:'badge2',txt:'Der Boden ist warm, als hätte hier eben noch die Sonne geschlafen… Komm tagsüber wieder.'},
  {x:3,y:15,c:'#e8c22e',t:'item',item:'ultra',n:2,flag:'it_r3'},
  {x:9,y:9,c:'#5a2f6a',t:'trainer',name:'Seraphine',fig:'seraphine',hook:'seraphine2',flag:'s4_seraphine',vanish:1,sOn:'tr_lio',team:[[103,21],[32,20],[113,20]],pre:['Seraphine: Wir sehen uns wieder, kleiner Held.','Seraphine: Der Böen-Kristall kommt mit uns. Lord Varkon braucht ihn.'],post:'Du bist stärker, als ich dachte. Behalte den Kristall… vorerst.',money:1200},
  {x:14,y:3,c:'#5ec8c8',t:'trainer',name:'Arenaleiterin Sylva',fig:'sylva',hook:'sylva',flag:'badge_boe',leader:'Böenmedaille',sOn:'tr_lio',team:[[25,19],[43,19],[26,21]],pre:['Sylva: Der Wind hat mir von dir erzählt!','Sylva: Jetzt zeig mir, wie hoch du fliegen kannst!'],post:'Hui! Du fliegst wie der Wind. Hier, die Böenmedaille!',money:2600,gift:['ultra',2]}],
 frostheim:[{x:12,y:12,c:'#79d6e8',t:'talk',txt:['Eira trainiert ihre Kreaturen im ewigen Eis. Glut und Fels schmelzen ihre Verteidigung!']},
  {x:16,y:12,c:'#9a7ac9',t:'talk',hook:'elowen2',fig:'elowen',sOn:'badge3',sOff:'s5_elowen'},
  {x:17,y:1,c:'#bfe8f5',t:'item',item:'trank',n:1,flag:'s5_ruinen',hook:'eisruine',sOn:'s5_elowen'},
  {x:15,y:1,c:'#3a2f4a',t:'talk',hook:'kaine2',fig:'kaine',sOn:'s5_ruinen',sOff:'s5_kaine'},
  {x:17,y:5,c:'#f2a0b0',t:'talk',hook:'mirael',fig:'mirael',name:'Heilerin Mirael'}],
 arena3:[{x:5,y:2,c:'#79d6e8',t:'trainer',name:'Arenaleiterin Eira',fig:'eira',team:[[75,26],[38,27],[76,30]],flag:'badge3',leader:'Frostmedaille',pre:['Eira: Kälte macht klar im Kopf.','Eira: Bist du bereit für das ewige Eis?'],post:'Nimm die Frostmedaille. Du hast sie verdient.',money:3000,gift:['hypertr',2]},
  {x:5,y:7,c:'#9fe4f2',t:'trainer',d:'down',name:'Eisläuferin Ylva',team:[[75,24],[37,24]],flag:'tr_ylva',pre:'Rutsch nicht aus!',post:'Brrr…',money:600}],
 route4:[{x:8,y:6,c:'#3a2f4a',t:'trainer',d:'right',name:'Späher Kaine',fig:'kaine',team:[[103,31],[32,31],[63,32]],flag:'boss1',vanish:1,pre:['Kaine: Wir sehen uns wieder.','Kaine: Ich soll den Weg für Lord Varkon frei halten. Tut mir leid.'],post:'Du kämpfst mit Herz. Warte… ich muss dir etwas sagen.',money:3000},
  {x:15,y:2,c:'#d9a05a',t:'trainer',d:'down',name:'Pilzsammlerin Hanna',team:[[75,27],[37,27]],flag:'tr_hanna',pre:'Hier wachsen die besten Moorpilze!',post:'Ach, schade.',money:700},
  {x:8,y:5,c:'#3a2f4a',t:'talk',hook:'kaine3',fig:'kaine',sOn:'boss1',sOff:'s8_kaine'}],
 schattmoor:[{x:12,y:13,c:'#7d5aa6',t:'talk',txt:['Nymera hütet die Schatten-Kreaturen. Lumen-Attacken treffen sie hart!']},
  {x:16,y:13,c:'#352a4a',t:'talk',hook:'corvin',fig:'corvin',name:'Sternendeuter Corvin'}],
 arena4:[{x:5,y:2,c:'#5a3a8a',t:'trainer',name:'Arenaleiterin Nymera',fig:'nymera',team:[[63,33],[31,34],[32,36]],flag:'badge4',leader:'Schattenmedaille',pre:['Nymera: Willkommen im Mondtempel.','Nymera: Schatten sind nicht böse. Sie schützen das Licht. Zeig mir dein Herz!'],post:'Du hast keine Angst vor dem Dunkeln. Die Schattenmedaille ist dein.',money:3600,gift:['ultra',5]},
  {x:5,y:7,c:'#5a4a6a',t:'trainer',d:'down',name:'Mystikerin Nox',team:[[31,31],[32,32]],flag:'tr_nox',pre:'Die Schatten flüstern deinen Namen…',post:'Sie haben geflunkert.',money:800}],
 siegesstrasse:[{x:10,y:9,c:'#b08850',t:'trainer',d:'down',name:'Veyra-Profi Anselm',team:[[58,38],[73,38],[62,38]],flag:'tr_bruno',pre:'Nur die Besten kommen hier durch!',post:'Du bist bereit für den Palast.',money:1500},
  {x:15,y:2,t:'legend',mon:144,lvl:55,flag:'leg_temp',req:'champion',txt:'Dunkle Wolken kreisen über dem Gipfel. Nur wer die Kristallkrone trägt, darf hinauf.'},
  {x:4,y:12,c:'#f2d27a',t:'trainer',name:'Arenaleiter Solan',fig:'solan',hook:'solan',flag:'badge_lumen',leader:'Lumenmedaille',sOn:'s8_hain',team:[[28,37],[61,38],[29,39],[62,40]],pre:['Solan: Willkommen am Sonnentor, {name}.','Solan: Das Licht zeigt, was in dir steckt. Bereit?'],post:'Dein Licht ist hell und warm. Nimm die Lumenmedaille!',money:4000,gift:['ultra',3]},
  {x:12,y:7,c:'#5a2f6a',t:'trainer',name:'Seraphine',fig:'seraphine',hook:'seraphine3',flag:'sf_seraphine',sOn:'badge_lumen',team:[[104,40],[32,39],[64,39],[113,39]],pre:['Seraphine: Hier sind die Kristallkammern. Hier endet dein Weg.','Seraphine: Lord Varkon will Veyra retten. Ich helfe ihm.'],post:'Du hast gewonnen… und ich habe nachgedacht.',money:3000},
  {x:12,y:6,c:'#2a1f2f',t:'trainer',name:'Lord Varkon',fig:'varkon',hook:'varkon',flag:'sf_varkon',sOn:'sf_seraphine',team:[[104,43],[103,42],[65,42],[58,41],[33,42]],pre:['Varkon: Du bist also {name}.','Varkon: Die Kristalle werden schwach. Ich muss sie retten!'],post:'Du bist stark. Aber die Kristalle… sie flackern trotzdem.',money:5000},
  {x:10,y:6,c:'#e8d28a',t:'talk',hook:'wache',fig:'wache',name:'Palastwache',sOff:['sf_auralis','champion','top1']}],
 liga:[{x:5,y:13,c:'#e8803a',t:'trainer',d:'down',name:'Turmhüter Brann',fig:'brann',team:[[73,40],[72,39],[60,40]],flag:'top1',vanish:1,pre:['Brann: Willkommen im Kristallturm! Ich bin Brann vom Turmrat.','Brann: Mein Saal heißt Morgenrot. Bist du wach genug?'],post:'Du strahlst wie die Morgensonne. Geh weiter!',money:4000},
  {x:5,y:10,c:'#8aa3ff',t:'trainer',d:'down',name:'Turmhüterin Zaria',fig:'zaria',team:[[58,42],[38,41],[3,42]],flag:'top2',vanish:1,pre:'Zaria: Im Mittagslicht weht ein frischer Wind. Halt dich fest!',post:'Hui! Du bist schneller als der Wind.',money:4200},
  {x:5,y:7,c:'#2a84f0',t:'trainer',d:'down',name:'Turmhüterin Ondra',fig:'ondra',team:[[62,44],[9,43],[76,43]],flag:'top3',vanish:1,pre:'Ondra: Die Abendflut ist ruhig und tief. Wie tief ist dein Mut?',post:'Dein Mut reicht bis zum Meeresgrund.',money:4400},
  {x:5,y:5,c:'#7a46c8',t:'trainer',d:'down',name:'Turmhüter Hesper',fig:'hesper',team:[[33,44],[32,44],[64,44]],flag:'top4',vanish:1,pre:'Hesper: Um Mitternacht leuchten die Sterne am hellsten. Zeig mir dein Licht!',post:'Du hast die Nacht zum Leuchten gebracht.',money:4600},
  {x:5,y:3,c:'#f5d983',t:'trainer',d:'down',name:'Kronenhüterin Ardena',fig:'ardena',team:[[60,46],[6,47],[91,46],[32,47],[3,48]],flag:'champion',pre:['Ardena: Du hast die Kristalle gerettet und den Orden verstanden.','Ardena: Jetzt zeig mir alles, was du gelernt hast!'],post:'Wunderbar. Die Kristallkrone gehört jetzt dir!',money:8000,gift:['meister',1]}]
};
// ----- Erweiterung: NPCs der neuen Gebiete (Hooks siehe 16-expansion.js) -----
NPCS.brisenhafen.push({x:13,y:12,c:'#5ab0e0',t:'talk',hook:'hafen'});
NPCS.windkueste=[
 {x:14,y:4,c:'#5ab0a0',t:'trainer',d:'down',name:'Angler Sven',team:[[37,18],[5,19]],flag:'tr_sven',pre:'Die Fische beißen heute nicht, aber du beißt bestimmt an!',post:'Mein Köder war wohl nicht gut genug.',money:380},
 {x:5,y:12,c:'#e8c22e',t:'trainer',d:'left',name:'Seglerin Frauke',team:[[115,20],[60,21],[25,20]],flag:'tr_frauke',pre:'Mit dem Wind im Rücken verliere ich nie!',post:'Flaute… Ich brauche neue Segel.',money:520},
 {x:13,y:18,c:'#c9a77c',t:'trainer',d:'right',name:'Klippenläufer Timo',team:[[38,21],[26,22],[59,23]],flag:'tr_tarek',pre:'Hier oben bläst es dich schneller um, als du denkst!',post:'Ich hab dich unterschätzt.',money:640},
 {x:13,y:9,c:'#e0a0d0',t:'talk',hook:'lene'},
 {x:2,y:13,c:'#d9a05a',t:'talk',hook:'tilda'},
 {x:3,y:6,c:'#7a9ad9',t:'talk',txt:['Seemann Ole: Der Windküsten-Pfad führt in Schleifen nach Möwenbucht. Pass auf die Böen auf!','Seemann Ole: Zum Heilen geh in die Kreaturenstation. Sie liegt links vom Dorfplatz.']},
 {x:15,y:2,c:'#cfdcf7',t:'item',item:'trank',n:1,flag:'sq_woelkchen_found',hook:'woelkchen'},
 {x:2,y:2,c:'#e8c22e',t:'item',item:'supertr',n:2,flag:'it_wk1'},
 {x:18,y:13,c:'#e8c22e',t:'sparkle',item:'netz',n:2,flag:'it_wk2'},
 {x:2,y:25,c:'#e8c22e',t:'item',item:'superk',n:3,flag:'it_wk3'}];
NPCS.moewenbucht=[
 {x:6,y:10,c:'#f2a0c0',t:'talk',hook:'mika'},
 {x:10,y:15,c:'#3d8fe0',t:'talk',hook:'henrik'},
 {x:7,y:13,c:'#c9a77c',t:'talk',txt:['Wiebke: Möwenbucht ist klein, aber unser Fang ist der frischste der ganzen Küste!','Wiebke: Nachts hört man hier nur die Wellen. Und die Möwen, die sich über uns lustig machen.']},
 {x:16,y:5,c:'#5ab0a0',t:'talk',txt:['Fischer Jann: Im Norden liegt der Windküsten-Pfad. Dort treiben Böe- und Flut-Kreaturen ihr Spiel.','Fischer Jann: Wer Netzkapseln mitnimmt, hat auf dem Pfad die besten Karten.']},
 {x:2,y:10,c:'#e8c22e',t:'sparkle',item:'trank',n:3,flag:'it_mb1'}];
NPCS.haus_moewe1=[{x:4,y:3,c:'#d9a05a',t:'talk',txt:['Fischerin Greta: Jeden Morgen um vier raus aufs Meer. Dafür schmeckt der Fisch auch wie nirgends sonst.','Greta: Hinter dem Haus wachsen Beeren. Die sind für Kreaturen genauso gut wie für uns.']}];
NPCS.haus_moewe2=[{x:4,y:3,c:'#7a9ad9',t:'talk',txt:['Netzflicker Arno: Ein Netz hält so lange wie die Geduld dessen, der es knüpft.','Arno: Netzkapseln funktionieren genauso.','Arno: Flut- und Böe-Kreaturen verfangen sich darin besonders leicht.']}];
NPCS.haus_moewe3=[{x:5,y:4,c:'#c9a77c',t:'talk',hook:'ruven',fig:'ruven',txt:['Ruven: Seit vierzig Jahren halte ich das Licht am Brennen.','Ruven: Kein Schiff ist je hier gestrandet.','Ruven: Die Böe-Kreaturen lieben das Licht. Manchmal setzt sich ein ganzer Schwarm aufs Dach.']}];
NPCS.glutschlucht=[
 {x:6,y:6,c:'#c96b5a',t:'talk',hook:'torben'},
 {x:7,y:9,c:'#e8803a',t:'trainer',d:'up',name:'Glutläufer Dario',team:[[2,24],[57,25]],flag:'tr_dario',pre:'Die Hitze hier härtet ab. Spürst du sie?',post:'Du hältst mehr aus als ich dachte.',money:800},
 {x:13,y:10,c:'#b0674a',t:'talk',hook:'ruska'},
 {x:16,y:7,c:'#8a6a58',t:'trainer',d:'left',name:'Schmied Hagen',team:[[58,26],[34,27],[22,26]],flag:'tr_hagen',pre:'Meine Esse ist heiß. Mein Team auch!',post:'Dein Feuer ist heißer als meine Esse.',money:960},
 {x:13,y:13,c:'#d94a4a',t:'trainer',d:'left',name:'Vulkanforscherin Ilka',team:[[34,28],[23,29],[2,30]],flag:'tr_ilka',pre:'Die Messwerte sagen: Gleich wird es heiß!',post:'Faszinierend. Das muss ich notieren.',money:1100},
 {x:1,y:1,c:'#e8c22e',t:'sparkle',item:'supertr',n:2,flag:'it_gs1'},
 {x:18,y:1,c:'#e8c22e',t:'item',item:'ultra',n:2,flag:'it_gs2'},
 {x:18,y:20,c:'#e8c22e',t:'item',item:'elixier',n:1,flag:'it_gs3'},
 {x:2,y:18,c:'#ffd34d',t:'item',item:'ultra',n:5,flag:'sq_schatz',hook:'schatz'}];
NPCS.huette_glut=[{x:4,y:3,c:'#d9a05a',t:'talk',heal:1,hook:'asta',fig:'asta',txt:['Asta: Setz dich ans Feuer. Hier ist es ein gemütliches Feuer.','Asta: Deine Kreaturen sind wieder fit!']}];
NPCS.fluestertal=[
 {x:3,y:10,c:'#9a7ac9',t:'trainer',d:'right',name:'Kräutersammlerin Odile',team:[[9,34],[61,33]],flag:'tr_odile',pre:'Pst! Du trampelst auf meinen Nachtkräutern!',post:'Die Kräuter verzeihen dir. Ich nicht.',money:1300},
 {x:8,y:14,c:'#3a2f5a',t:'trainer',d:'left',name:'Nachtwächter Ansgar',team:[[32,35],[117,34],[113,33]],flag:'tr_ansgar',pre:'Wer wandert im Dunkeln durch mein Tal?',post:'Geh weiter. Aber leise.',money:1480},
 {x:11,y:3,c:'#c8b8f0',t:'trainer',d:'right',name:'Schattenseherin Mireille',team:[[53,36],[31,35],[62,37]],flag:'tr_mireille',pre:'Der Mondstein hat mir deinen Besuch verraten.',post:'Der Mondstein lächelt. Du darfst bleiben.',money:1700},
 {x:15,y:3,c:'#e8e0ff',t:'talk',hook:'sira',nightOnly:1},
 {x:5,y:13,c:'#5a3f80',t:'talk',hook:'nyx',nightOnly:1},
 {x:3,y:11,c:'#c9a77c',t:'talk',dayOnly:1,txt:['Mondgelehrter Fenn: Bei Tag wirkt das Tal friedlich.','Fenn: Doch nachts erwachen Schattenwesen und Flüsterlichter.','Fenn: Wer nachts herkommt, trifft die Mondweberin Sira an ihrem Steinkreis im Norden.']},
 {x:2,y:3,c:'#f5d983',t:'item',item:'trank',n:1,flag:'sq_fl1',hook:'licht',nightOnly:1},
 {x:17,y:10,c:'#f5d983',t:'item',item:'trank',n:1,flag:'sq_fl2',hook:'licht',nightOnly:1},
 {x:4,y:22,c:'#f5d983',t:'item',item:'trank',n:1,flag:'sq_fl3',hook:'licht',nightOnly:1},
 {x:18,y:22,c:'#e8c22e',t:'item',item:'ultra',n:3,flag:'it_ft1'},
 {x:2,y:23,c:'#e8c22e',t:'item',item:'beleber',n:2,flag:'it_ft2'},
 {x:18,y:1,c:'#e8c22e',t:'item',item:'hypertr',n:2,flag:'it_ft3'},
 {x:1,y:15,c:'#e8c22e',t:'item',item:'dunkelstein',n:1,flag:'it_ft4'}];
NPCS.huette_fluester=[{x:4,y:3,c:'#8a5a9a',t:'talk',heal:1,txt:['Kräuterfrau Odette: Ein Tee aus Mondblüten, und schon sind Mensch und Kreatur wie neu. Trink in Ruhe!']}];
// ===== B2 Story: Auslöser der Kapitel 3–8, Finale und Nebenmissionen (Gesprächslogik: HOOKS in 27-story.js) =====
NPCS.windkueste.push({x:17,y:19,c:'#3a2f4a',t:'trainer',name:'Späher Kaine',fig:'kaine',hook:'kaine_kueste',flag:'s3_kaine',vanish:1,sOn:'badge2',team:[[102,20],[31,19]],
 pre:['Kaine: Pst. Ich beobachte dich schon lange.','Kaine: Der Flut-Kristall im Leuchtturm gehört bald dem Orden.'],post:'Hm. Du gibst nicht auf. Das merke ich mir.',money:1000});
NPCS.glutschlucht.push({x:3,y:6,c:'#c8463a',t:'talk',hook:'rayan_glut',fig:'rayan',sOn:'s5_kaine',sOff:'s6_rayan2'},
 {x:4,y:8,c:'#4a3a63',t:'trainer',name:'Zwei Ordensrekruten',fig:'orden',hook:'orden_glut',flag:'s6_orden',vanish:1,double:true,sOn:'s6_rayan',team:[[102,26],[34,27]],
  pre:['Rekrut: Wir holen den Glut-Kristall für Lord Varkon!','Rekrutin: Zu zweit schaffen wir das. Oder?'],post:'Na gut. Wir gehen zurück ins Lager.',money:1600},
 {x:6,y:13,c:'#d9582b',t:'trainer',name:'Arenaleiter Kael',fig:'kael',hook:'kael',flag:'badge_glut',leader:'Glutmedaille',sOn:'s6_orden',team:[[13,27],[2,28],[14,30]],
  pre:['Kael: Ha! Du hast den Orden verjagt. Respekt!','Kael: Jetzt will ich dein Feuer sehen. Los geht\'s!'],post:'Was für eine Glut! Die Glutmedaille gehört dir.',money:3200,gift:['ultra',3]},
 {x:1,y:9,c:'#f5d983',t:'item',item:'trank',n:1,flag:'sq_nuss',hook:'glutnuss',sOn:'sq_ofen_on'});
NPCS.nebelgrotte.push({x:14,y:7,c:'#9a7a5a',t:'trainer',name:'Arenaleiter Torvik',fig:'torvik',hook:'torvik',flag:'badge_fels',leader:'Felsmedaille',sOn:'s6_rayan2',team:[[22,29],[10,30],[23,32]],
  pre:['Torvik: Danke für deine Hilfe in der Mine.','Torvik: Jetzt zeig mir, wie fest du stehst!'],post:'Fest wie ein Berg. Die Felsmedaille ist dein.',money:3400,gift:['hypertr',2]},
 {x:4,y:10,c:'#4a3a63',t:'trainer',name:'Ordensrekruten-Trio',fig:'orden',hook:'rekruten',flag:'s7_rekruten',vanish:1,sOn:'s7_torvik',team:[[102,28],[57,29],[31,28]],
  pre:['Rekrut: Wir graben hier nur ein bisschen!','Rekrut: Nach dem Fels-Kristall! Ups, verraten.'],post:'Wir hätten lieber Pilze sammeln sollen…',money:1800},
 {x:16,y:9,c:'#2f6f5a',t:'talk',hook:'tarek_mine',fig:'tarek',sOn:'badge_fels',sOff:'s7_tarek'},
 {x:2,y:9,c:'#c9a77c',t:'item',item:'trank',n:1,flag:'sq_fa3',hook:'faehrte',sOn:'sq_faehrten_on'});
NPCS.fluestertal.push({x:17,y:5,c:'#b48aff',t:'item',item:'trank',n:1,flag:'s8_hain',hook:'schattenkristall',sOn:'badge4'},
 {x:18,y:5,c:'#5a3a8a',t:'talk',hook:'nymera_hain',fig:'nymera',sOn:'badge4'});
// Nebenmissionen: Fundstücke (t:'item' mit hook = besonderes Fundstück, sOn = erst nach Annahme sichtbar)
NPCS.route1.push({x:16,y:13,c:'#ffe27a',t:'item',item:'trank',n:1,flag:'sq_fs1',hook:'funkelstein',sOn:'sq_funkel_on'});
NPCS.kupferhain.push({x:18,y:1,c:'#ffe27a',t:'item',item:'trank',n:1,flag:'sq_fs2',hook:'funkelstein',sOn:'sq_funkel_on'});
NPCS.route2.push({x:11,y:11,c:'#ffe27a',t:'item',item:'trank',n:1,flag:'sq_fs3',hook:'funkelstein',sOn:'sq_funkel_on'},
 {x:5,y:8,c:'#c9a77c',t:'item',item:'trank',n:1,flag:'sq_fa1',hook:'faehrte',sOn:'sq_faehrten_on'},
 {x:17,y:3,c:'#c9a77c',t:'item',item:'trank',n:1,flag:'sq_fa2',hook:'faehrte',sOn:'sq_faehrten_on'},
 {x:6,y:3,c:'#ffb04a',t:'item',item:'trank',n:1,flag:'sq_laterne_found',hook:'laterne',sOn:'sq_laterne_on'});
NPCS.route4.push({x:4,y:3,c:'#d070ff',t:'item',item:'trank',n:1,flag:'sq_sk1',hook:'signal',sOn:'sq_signal_on'},
 {x:13,y:10,c:'#d070ff',t:'item',item:'trank',n:1,flag:'sq_sk2',hook:'signal',sOn:'sq_signal_on'});
NPCS.schattmoor.push({x:2,y:13,c:'#d070ff',t:'item',item:'trank',n:1,flag:'sq_sk3',hook:'signal',sOn:'sq_signal_on'},
 {x:6,y:13,c:'#3a2f4a',t:'talk',hook:'kaine4',fig:'kaine',sOn:'s8_kaine'});
// Kreaturenstationen & Läden bekommen ihre NPCs automatisch
for(const id in INTERIORS){const k=INTERIORS[id].k;
 if(k==='heal')NPCS[id]=[{x:5,y:2,c:'#f2a0b0',t:'nurse',fig:'mirael'}];
 if(k==='shop')NPCS[id]=[{x:5,y:2,c:'#6aa0e0',t:'shop'}];}

// Hauptgeschichte: 8 Kapitel + Finale + Epilog. Die Schritte (id 'st_<flag>', f = Missions-Flag) füllt 27-story.js aus STORY.
const QUESTS=[];
const SIDEQUESTS=[
 {f:'leg_sol',title:'Die Sonne im Zenit',d:'Auf dem Sonnenhang (Route 3) soll tagsüber Ignivar erwachen. Ab 2 Medaillen.',req:{badges:2,text:'Ab 2 Medaillen'}},
 {f:'leg_noct',title:'Die längste Nacht',d:'Tief in der Nebelgrotte regt sich nachts Noctyra. Ab 3 Medaillen.',req:{badges:3,text:'Ab 3 Medaillen'}},
 {f:'leg_temp',title:'Herr der Gewitter',d:'Über der Siegesstraße kreist Aetherion. Erst nach dem Finale.',req:{flag:'champion',text:'Nach dem Finale'}},
 {f:'collector',title:'Der Sammler von Brisenhafen',d:'Fange 15 verschiedene Kreaturen und besuche den Sammler.'}
];

// ===== Fundstücke (Agent Fundstücke, docs/funde.md) – alle sehen aus wie das gelbe Fundstück, reagieren aber verschieden (Logik: 47-finds.js) =====
// t:'item' Gegenstand · t:'scroll' Lehrrolle (item = Rollen-Schlüssel) · t:'hidden' verstecktes Wesen (mon/lvl, kommt nach 1 Spieltag wieder, solange nicht gefangen)
// t:'sparkle' Glitzer-Zufallsfund (item/n = Rückfall). 47-finds.js stellt beim Laden auf t:'item' + f:<Art> um (2D/3D/Engine kennen nur 'item').
// Flags: it_* Gegenstand/Glitzer, sc_* Rolle, hd_* Wesen. Nur freie Bodenfelder, keine Kacheln geändert.
const FIND_NPCS={
 // Lehrrollen: Feld-Attacken in Spielreihenfolge (vor dem jeweiligen Hindernis erreichbar)
 route1:[{x:1,y:11,t:'scroll',item:'rolle_rankenschnitt',flag:'sc_rankenschnitt'},{x:18,y:1,t:'hidden',mon:28,lvl:5,flag:'hd_route1'}],
 kupferhain:[{x:18,y:14,t:'scroll',item:'rolle_leuchtfeuer',flag:'sc_leuchtfeuer'},{x:1,y:1,t:'item',item:'balsamkapsel',n:1,flag:'it_kh1'}],
 route2:[{x:18,y:8,t:'scroll',item:'rolle_felsschub',flag:'sc_felsschub'},{x:1,y:1,t:'hidden',mon:19,lvl:9,flag:'hd_route2'}],
 nebelgrotte:[{x:18,y:3,t:'hidden',mon:81,lvl:13,flag:'hd_nebelgrotte'},{x:1,y:11,t:'item',item:'echokapsel',n:1,flag:'it_ng1'}],
 brisenhafen:[{x:1,y:11,t:'scroll',item:'rolle_wellenritt',flag:'sc_wellenritt'},{x:18,y:1,t:'item',item:'zuendkapsel',n:2,flag:'it_bh1'}],
 route3:[{x:18,y:11,t:'scroll',item:'rolle_eisbruecke',flag:'sc_eisbruecke'},{x:1,y:7,t:'item',item:'geduldkapsel',n:1,flag:'it_r3b'}],
 windkueste:[{x:1,y:4,t:'scroll',item:'rolle_kletterkralle',flag:'sc_kletterkralle'},{x:1,y:25,t:'hidden',mon:137,lvl:21,flag:'hd_windkueste'},{x:18,y:14,t:'sparkle',item:'kapsel',n:1,flag:'it_sx_wk'}],
 moewenbucht:[{x:18,y:10,t:'scroll',item:'rolle_wellen',flag:'sc_wellen'},{x:1,y:13,t:'hidden',mon:78,lvl:21,flag:'hd_moewenbucht'}],
 frostheim:[{x:1,y:13,t:'scroll',item:'rolle_sturmfluegel',flag:'sc_sturmfluegel'},{x:18,y:10,t:'scroll',item:'rolle_frostzahn',flag:'sc_frostzahn'},
  {x:1,y:1,t:'hidden',mon:125,lvl:25,flag:'hd_frostheim'},{x:18,y:12,t:'hidden',mon:129,lvl:25,flag:'hd_frostheim2'}],
 glutschlucht:[{x:18,y:13,t:'scroll',item:'rolle_glutwirbel',flag:'sc_glutwirbel'},{x:1,y:15,t:'hidden',mon:49,lvl:28,flag:'hd_glutschlucht'},{x:18,y:15,t:'hidden',mon:108,lvl:29,flag:'hd_glutschlucht2'}],
 route4:[{x:18,y:3,t:'scroll',item:'rolle_donner',flag:'sc_donner'},{x:1,y:10,t:'hidden',mon:63,lvl:30,flag:'hd_route4'},{x:18,y:10,t:'item',item:'supertr',n:1,flag:'it_r4a'},{x:1,y:3,t:'sparkle',item:'trank',n:1,flag:'it_sx_r4'}],
 schattmoor:[{x:18,y:9,t:'scroll',item:'rolle_nachtbiss',flag:'sc_nachtbiss'},{x:18,y:1,t:'hidden',mon:131,lvl:33,flag:'hd_schattmoor'},{x:1,y:1,t:'item',item:'daemmer',n:2,flag:'it_sm1'}],
 fluestertal:[{x:2,y:20,t:'scroll',item:'rolle_blattw',flag:'sc_blattw'},{x:17,y:23,t:'hidden',mon:96,lvl:36,flag:'hd_fluestertal'},{x:18,y:12,t:'item',item:'herzkapsel',n:1,flag:'it_ft5'}],
 siegesstrasse:[{x:18,y:15,t:'item',item:'hypertr',n:1,flag:'it_ss1'}]};
for(const id in FIND_NPCS){NPCS[id]=NPCS[id]||[];for(const n of FIND_NPCS[id])NPCS[id].push(Object.assign({c:'#e8c22e',n:1},n));}
