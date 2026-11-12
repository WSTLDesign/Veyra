// ===== VEYRA – Figuren-Kanon (Loop B1): FIGURES (Rolle, Ort, Team, Aussehen, Sprüche, Beziehungen), Porträts, Rivalen-Starter, eigene Begriffe =====
// Schnittstellen für Story/Welt (B2, C, D): siehe docs/figuren.md. Zeichnen: drawFigure/drawFigPortrait/drawPerson in 08-gfx.js.
// Eigene Begriffe statt Fremd-Jargon: „Turmrat“ (statt Top Vier), „Turmhüter/in“ (Mitglied), „Kristallkrone“ + „Kronenhüter/in“ (statt Champion), „Veyra-Profi“ (statt Ass-Trainer), „Ordensrekrut“ (Schattenorden-Handlanger, Begriff von B2).
const FIG_TERMS={rat:'Turmrat',ratM:'Turmhüter',ratW:'Turmhüterin',krone:'Kristallkrone',kronM:'Kronenhüter',kronW:'Kronenhüterin',profi:'Veyra-Profi',lehrling:'Ordensrekrut',orden:'Schattenorden',
 medaille:'Medaille',station:'Kreaturenstation',kapsel:'Fangkapsel',chronik:'Chronik',lehrkristall:'Lehr-Kristall',turm:'Kristallturm'};
// Ersatz alter Begriffe in Texten (B2 übernimmt sie in 02-world/27-story; figTerms(text) wendet sie an)
const FIG_RENAME=[[/\bTop[- ]Vier\b/g,'Turmrat'],[/\bTop-Dr(ei)\b/g,'Turmhüter'],[/\bAss-Tr(ainer)(in)?\b/g,'Veyra-Profi'],[/\bChampion(s)?\b/g,'Kronenhüter']];
function figTerm(k){return FIG_TERMS[k]||k;}
function figTerms(t){t=String(t??'');for(const[a,b]of FIG_RENAME)t=t.replace(a,b);return t;}
const FIG_SIG='#d81b72';
// Arenen-Reihenfolge (Vorschlag für B2; Stufe = Index) und Medaillen
const ARENA_ORDER=['lior','neria','kael','torvik','sylva','eira','nymera','solan'];
const TURMRAT=['brann','zaria','ondra','hesper'];

// ---------- Kanon ----------
// Felder: n Name · role Rolle · tag kurzer Titel vor dem Namen · age · traits · region/ort (WELT-KANON) · el Element · partner Begleiter-Art (+nick) · team [[Art,Level],…] (nur Kanon-IDs) · medal
//  look → drawFigure (08-gfx) · art = Präfix der Porträt-Bilder (ART_SRC['<art>_face_<ausdruck>']) · alias weitere Namen · lines {gruss,kampf,sieg,niederlage,alltag} (sieg = Figur gewinnt, niederlage = Figur verliert) · rel Beziehungen
const FIGURES={
 held:{n:'Noa',role:'Held',tag:'',player:true,art:'held',age:12,traits:'neugierig, mutig, hilfsbereit',region:'Lichtlande',ort:'Aurenstadt · Wohnviertel',el:null,team:[],
  look:{build:'kind',sex:'m',skin:'#f6d3b3',eye:'#4a9a3a',hair:'wuschel',hairCol:'#7a4a26',top:'#3f7a3a',top2:'#efe6d2',trim:'#2e5a2c',scarf:'#f0b429',legs:'cargo',legCol:'#6a4a30',boots:'#5a3d28',bootTrim:'#8fbf4a',laces:FIG_SIG,
   hat:'brille',gogCol:'#57c2dc',acc:['rucksack'],accCol:'#7d7a3a',rollCol:'#e2d6b8',gloves:'#3a3030',emblem:'blatt',emblemCol:'#e9d27a',sig:FIG_SIG,cuffCol:'#efe6d2'},
  lines:{gruss:['Hallo! Ich bin {name}.','Hi! Schön, dich zu sehen.','Hallo! Wollen wir zusammen los?'],
   kampf:['Los, {partner}! Wir schaffen das!','Bereit, {partner}? Auf geht’s!','Zusammen sind wir stark!'],
   sieg:['Geschafft! Gut gemacht, {partner}!','Juhu! Wir haben gewonnen!','Super Team, {partner}!'],
   niederlage:['Nicht schlimm. Wir üben weiter.','Beim nächsten Mal klappt es!','Ruh dich aus, {partner}.'],
   alltag:['Was liegt wohl hinter dem nächsten Hügel?','Ich schreibe das in meine Chronik.','Mein Bauch knurrt. Zeit für ein Brot!']},
  rel:{rayan:'Rivale und bester Freund',mira:'Rivalin und Freundin',veyran:'Mentor',mama:'Mutter'}},
 heldin:{n:'Noa',role:'Heldin',tag:'',player:true,art:'heldin',age:12,traits:'fröhlich, sportlich, entschlossen',region:'Lichtlande',ort:'Aurenstadt · Wohnviertel',el:null,team:[],
  look:{build:'kind',sex:'w',skin:'#f6d3b3',eye:'#8a5a2a',hair:'pferd',hairCol:'#a4532a',tieCol:'#f2c94c',top:'#4c8a3c',top2:'#f1e8d6',trim:'#355f2a',legs:'shorts',legCol:'#7a5a3a',socks:'#4a3a32',boots:'#7a5434',bootTrim:'#efe6d2',laces:FIG_SIG,
   hat:'cap',hatCol:'#efe6d2',brimCol:'#4c8a3c',capSym:'blatt',capSymBg:'#4c8a3c',capSymCol:'#efe6d2',acc:['tasche'],accCol:'#7a4a2a',bagSym:'sonne',bagSymCol:'#ffe08a',gloves:'#3a3030',sig:FIG_SIG},
  lines:{gruss:['Hallo! Ich bin {name}!','Hey! Schön, dass du da bist.','Hallo! Kommst du mit?'],
   kampf:['{partner}, jetzt du! Zeig, was du kannst!','Auf drei! Eins, zwei, los!','Wir geben alles, {partner}!'],
   sieg:['Ja! Das war klasse, {partner}!','Gewonnen! Gib mir fünf!','Wir sind ein tolles Team!'],
   niederlage:['Oh. Das war knapp.','Kein Problem. Wir werden stärker!','Komm, wir gehen zur Kreaturenstation.'],
   alltag:['Ich will jede Kreatur kennenlernen!','Da glitzert doch was im Gras?','Meine Chronik ist schon ganz voll!']},
  rel:{rayan:'Rivale und bester Freund',mira:'Rivalin und Freundin',veyran:'Mentor',mama:'Mutter'}},
 rayan:{n:'Rayan',role:'Rivale',tag:'',age:12,traits:'selbstbewusst, ehrgeizig, etwas vorlaut – lernt Teamgeist',region:'Lichtlande',ort:'Aurenstadt',el:'glut',partner:1,art:'rayan',
  team:[[1,5]],pool:[34,72,63,22],
  look:{build:'kind',sex:'m',skin:'#f1cfae',eye:'#c0302a',hair:'stachel',hairCol:'#1e1a22',hairHi:'#d0303a',top:'#26232c',top2:'#7a7680',trim:'#c0303a',belt:'#3a3038',legs:'cargo',legCol:'#2c2a32',boots:'#26232c',bootTrim:'#c0303a',laces:'#e04040',
   collar:'kapuze',hoodCol:'#3a3640',acc:['rucksack'],accCol:'#3a2a2e',rollCol:'#8a2a30',pose:'verschraenkt',emblem:'flamme',emblemCol:'#e04848',sig:'#e04848'},
  lines:{gruss:['Hey, {name}! Rate mal, wer schneller war? Ich!','Na? Bereit, gegen den Besten zu verlieren?','Da bist du ja endlich! Ich warte schon ewig.','Yo, {name}! Schon wieder du!'],
   kampf:['Ich hab extra trainiert. Pass auf!','Mein {mon} ist heute richtig heiß!','Arme verschränkt heißt: Ich bin bereit!','Diesmal gewinne ich. Ganz sicher!'],
   sieg:['Ha! Hab ich doch gesagt!','Siehst du? Ich bin vorne!','Nicht traurig sein. Ich bin halt gut.'],
   niederlage:['Was? Das gibt’s doch nicht!','Okay … du warst heute besser.','Na gut. Ich trainiere einfach doppelt!','Hm. Vielleicht braucht man doch ein Team.'],
   alltag:['Ich will der Stärkste in ganz Veyra werden!','Mira sagt, ich bin zu laut. Stimmt gar nicht!','Ich war schon im nächsten Ort. Na klar!']},
  rel:{mira:'Kindheitsfreundin, ewiger Wettstreit',held:'Rivale – will immer vorne sein',veyran:'Nachbar; findet Forschung langweilig',kael:'großes Vorbild (Feuer!)'}},
 mira:{n:'Mira',role:'Rivalin',tag:'',age:12,traits:'clever, temperamentvoll, sportlich – wird Verbündete im Finale',region:'Lichtlande',ort:'Aurenstadt',el:'flut',partner:4,art:'mira',
  team:[[4,5]],pool:[25,84,69,28],
  look:{build:'kind',sex:'w',skin:'#f6d6bc',eye:'#3a8ad8',hair:'pferd',hairCol:'#f0d27a',hairHi:'#3a7ad8',tieCol:'#3a7ad8',top:'#2f6fd0',top2:'#ffffff',trim:'#f4f4f8',legs:'shorts',legCol:'#3a4a6a',socks:'#2a3a5a',boots:'#2f5fb0',bootTrim:'#f4f4f8',
   hat:'brille',gogCol:'#3fb8d8',acc:['tasche'],accCol:'#4a3a2a',pose:'winken',emblem:'welle',emblemCol:'#9fe4ff',sig:'#3a8ad8',gloves:'#2a2a32',cuffCol:'#f4f4f8'},
  lines:{gruss:['Hallo, {name}! Schön, dich zu treffen!','Hi! Ich hab dich schon von Weitem gesehen.','Da bist du! Ich hab was Tolles entdeckt!'],
   kampf:['Ich hab einen Plan. Und einen Ersatzplan!','Fair spielen, okay? Dann los!','{mon} und ich sind ein Herz und eine Seele.','Mal sehen, was du gelernt hast!'],
   sieg:['Yes! Mein Plan hat geklappt!','Gut gekämpft! Du warst echt nah dran.','Gewonnen! Willst du einen Tipp?'],
   niederlage:['Wow! Das hab ich nicht kommen sehen.','Du bist richtig gut geworden!','Ich schreibe mir das auf. Für nächstes Mal!'],
   alltag:['Wusstest du? Flut-Kreaturen lieben Regen.','Rayan rennt immer vor. Ich denke lieber nach.','Ich sammle Federn. Schau mal, eine blaue!']},
  rel:{rayan:'bremst ihn, wenn er zu schnell ist',held:'Freundin; Verbündete im Finale',tarek:'tauscht mit ihm Forschungsnotizen',neria:'Vorbild'}},
 veyran:{n:'Prof. Veyran',role:'Professor & Mentor',tag:'',age:68,traits:'herzlich, neugierig, etwas zerstreut',region:'Lichtlande',ort:'Aurenstadt · Forschungszentrum',el:'flora',partner:7,nick:'Blättchen',art:'prof',
  alias:['Professor Veyran','Veyran','Prof. Lindqvist','Lindqvist'],team:[[9,45],[106,42],[60,40]],
  look:{build:'alt',sex:'m',skin:'#f0cdb0',eye:'#5a7a4a',hair:'wolke',hairCol:'#eeeae4',beard:'vollbart',beardCol:'#f2efe8',browCol:'#d8d4cc',glasses:'rund',top:'#e9e2cf',top2:'#f6f1e2',trim:'#b8a77a',coat:'mantel',coatCol:'#4c8a4a',coatTrim:'#d9c27a',
   scarf:'#3f7a3a',legs:'hose',legCol:'#6a5a46',boots:'#5a4030',acc:['rucksack','buch','amulett'],accCol:'#8a6a3e',amuCol:'#6cc86a',bookCol:'#3f6a3a',rollCol:'#efe2c0',emblem:'blatt',emblemCol:'#d9c27a'},
  lines:{gruss:['Ah, {name}! Wie schön, dich zu sehen!','Hallo, hallo! Komm ruhig näher.','Da bist du ja! Blättchen hat dich schon gerochen.'],
   kampf:['Ein Übungskampf? Na gut. Aber sanft!','Ich zeige dir, wie Forscher kämpfen. Mit Köpfchen!','Blättchen, wir dürfen auch mal ran!'],
   sieg:['Oh! Ich kann es noch. Hihi.','Siehst du? Ruhe ist auch eine Stärke.','Gut versucht! Du lernst schnell.'],
   niederlage:['Großartig! Du bist schon stärker als ich.','Erstaunlich! Das schreibe ich in mein Buch.','Bravo! Deine Kreaturen vertrauen dir.'],
   alltag:['Es gibt sieben große Elemente. Und viele Geheimnisse.','Wo ist nur mein Buch? Ach, unterm Arm.','Jede Kreatur ist anders. Das macht Veyra so schön.','Hast du heute schon etwas Neues entdeckt?']},
  rel:{tarek:'Assistent',mirael:'alte Freundin (Kreaturenstation)',elowen:'kennt sie seit Kindertagen',held:'vertraut die erste Kreatur an',borwin:'Lieferant für Fangkapseln'}},
 tarek:{n:'Tarek',role:'Kreaturenforscher',tag:'',age:19,traits:'erfinderisch, neugierig, tollpatschig',region:'Lichtlande',ort:'Aurenstadt · Forschungszentrum (Außenstellen Kristallwacht, Dämmerbruch)',el:'flut',partner:101,art:'tarek',
  team:[[101,38],[73,36],[67,36]],
  look:{build:'teen',sex:'m',skin:'#f3cfae',eye:'#4a9a4a',hair:'wuschel',hairCol:'#6a4024',top:'#2f5a3a',top2:'#d8cfb8',trim:'#1f3a28',legs:'cargo',legCol:'#5a4a3a',boots:'#4a3426',hat:'brille',gogCol:'#3a8ad8',acc:['rucksack','tasche'],accCol:'#6a5a40',cuffCol:'#8a96a8',
   emblem:'wind',emblemCol:'#3a8ad8',pose:'zeigen'},
  lines:{gruss:['Oh! Hallo, {name}! Vorsicht, das Kabel!','Hi! Ich bin Tarek, Veyrans Assistent.','Du kommst genau richtig! Mein Gerät piept.'],
   kampf:['Testlauf Nummer 42! Los geht’s!','Ich messe alles mit. Auch deinen Mut!','{mon}, Programm Welle!'],
   sieg:['Messung erfolgreich! Wir haben gewonnen!','Hihi. Die Daten waren auf meiner Seite.','Super! Das war ein guter Test.'],
   niederlage:['Uff. Mein Gerät sagt: Du bist toll.','Interessant! Darüber schreibe ich einen Bericht.','Hoppla. Da hab ich mich verrechnet.'],
   alltag:['Manche Kreaturen entwickeln sich nur nachts!','Mit Lehr-Kristallen lernen Kreaturen neue Attacken.','Ich suche meine Brille. Ach, sie ist auf der Stirn!']},
  rel:{veyran:'Lehrmeister',torvik:'wird oft mit ihm verwechselt',mira:'Notiz-Tauschpartnerin'}},
 mirael:{n:'Mirael',role:'Kreaturen-Heilerin',tag:'',age:26,traits:'fürsorglich, geduldig, lebensfroh',region:'alle',ort:'jede Kreaturenstation',el:'flora',partner:55,art:'mirael',
  team:[[56,30],[53,30],[62,30]],
  look:{build:'adult',sex:'w',skin:'#f6d6bc',eye:'#3a9a4a',hair:'dutt',hairCol:'#8a4a26',hat:'blume',flowerCol:'#ffffff',face:'sommersprossen',top:'#eaf3e4',top2:'#ffffff',coat:'kittel',coatCol:'#f3ecdc',coatTrim:'#6cc86a',legs:'rock',legCol:'#4c8a4a',socks:'#efe6d2',boots:'#7a5434',
   acc:['tasche','laterne','kraeuter'],accCol:'#a0703e',bagSym:'kreuzblatt',bagSymCol:'#e85a5a',lampCol:'#bff2a8',lampGlow:'rgba(170,255,150,.6)',emblem:'kreuzblatt',emblemCol:'#e85a5a'},
  lines:{gruss:['Willkommen in der Kreaturenstation!','Hallo, {name}! Geht es euch allen gut?','Schön, dich zu sehen! Brauchst du Hilfe?'],
   kampf:['Ein Kampf? Na gut, aber ganz lieb!','Heilen kann ich. Kämpfen aber auch!','Mein {mon} wacht gerade auf. Los geht’s!'],
   sieg:['Oh! Komm, ich heile euch gleich.','Gewonnen. Aber niemand ist verletzt, versprochen.','Ruht euch aus. Das habt ihr verdient.'],
   niederlage:['Wunderbar! Deine Kreaturen sind kerngesund.','Ihr seid stark! Ich bin stolz auf euch.','Gut gemacht! Nimm einen Kräutertrank mit.'],
   alltag:['Kräutertränke helfen, wenn eine Kreatur müde ist.','Ein bisschen Schlaf wirkt Wunder.','Jede Kreatur braucht Pflege. Und eine Umarmung.']},
  rel:{veyran:'alter Freund',borwin:'kauft Kräuter bei ihm',elara:'sammelt mit ihr Heilkräuter'}},
 borwin:{n:'Borwin',role:'Reisender Händler',tag:'',age:45,traits:'geschäftstüchtig, humorvoll, großzügig',region:'alle',ort:'wandert (Hauptstand Sternenplatz, Aurenstadt)',el:'flora',partner:7,nick:'Knubbel',art:'borwin',
  team:[[8,24],[130,26],[57,25]],
  look:{build:'kraeftig',sex:'m',skin:'#efc9a4',eye:'#6a4a2a',hair:'kurz',hairCol:'#6a4024',beard:'schnurr',beardCol:'#5a3418',hat:'federhut',hatCol:'#7a5a3a',featherCol:'#4cb85c',top:'#efe6d2',top2:'#efe6d2',closed:true,vest:'#7a5434',scarf:'#3f8a4a',
   legs:'hose',legCol:'#5a4a36',belt:'#6a4226',boots:'#5a3a22',acc:['rucksack','laterne'],accCol:'#8a6a42',rollCol:'#7aa05a'},
  lines:{gruss:['Hallo, junger Freund! Borwins Wanderladen hat offen!','Na, {name}? Ich hab was Neues im Rucksack!','Grüß dich! Heute gibt es fast alles fast umsonst!'],
   kampf:['Ein Kampf? Für einen Rabatt? Abgemacht!','Mein Rucksack ist schwer. Meine Kreaturen nicht!','Na gut! Aber nichts kaputt machen!'],
   sieg:['Haha! Handel ist Handel!','Gewonnen! Das feiere ich mit einem Keks.','Siehst du? Erfahrung zahlt sich aus.'],
   niederlage:['Donnerwetter! Du bist gut.','Ha! Dafür bekommst du ein Geschenk.','Ich gebe auf! Und einen Rabatt.'],
   alltag:['Ich war schon in allen Regionen. Zweimal!','Fangkapseln? Lehr-Kristalle? Ich hab beides!','Mein Rucksack hat 37 Taschen. Glaube ich.']},
  rel:{mirael:'Kundin',veyran:'liefert Fangkapseln',grom:'bekommt Kristalle von ihm'}},
 elara:{n:'Elara',role:'Waldhüterin',tag:'',age:29,traits:'mutig, naturverbunden, entschlossen',region:'Smaragdwald',ort:'Feenlichtung',el:'flora',partner:56,art:'elara',
  team:[[56,36],[88,34],[106,34]],
  look:{build:'adult',sex:'w',skin:'#f3cfae',eye:'#3a9a4a',hair:'zopf',hairCol:'#8a4a26',hat:['blattschmuck','brille'],gogCol:'#5fbf6a',face:'sommersprossen',top:'#3a5a32',coat:'mantel',coatCol:'#2f5a34',coatTrim:'#efe2c8',collar:'fell',legs:'hose',legCol:'#5a4a36',
   boots:'#5a3a22',acc:['bogen','laterne','tasche'],accCol:'#7a5434',lampCol:'#d8f2a0',emblem:'blatt',emblemCol:'#efe2c8'},
  lines:{gruss:['Psst! Leise. Hier schlafen Kreaturen.','Hallo, {name}. Der Wald freut sich über dich.','Da bist du. Ich habe Spuren gefunden!'],
   kampf:['Gut. Zeig mir, wie du mit Kreaturen umgehst.','Mein {mon} und ich sind ein Team.','Wir kämpfen fair. Wie der Wald es mag.'],
   sieg:['Der Wald hat heute uns geholfen.','Gut gekämpft. Du lernst noch.','Ruh dich aus. Morgen bist du stärker.'],
   niederlage:['Du bist stark und sanft zugleich.','Gut! Jetzt zeige ich dir einen geheimen Pfad.','Respekt. Deine Kreaturen vertrauen dir.'],
   alltag:['Spuren im Moos erzählen Geschichten.','Seltene Kreaturen zeigen sich nur leisen Leuten.','Folge den Leuchtpilzen. Sie kennen den Weg.']},
  rel:{lior:'Nachbar in Wurzelheim (er leitet die Arena, sie hütet den Wald)',kaine:'Gegenspieler – beide kennen geheime Wege',elowen:'ihre Lehrerin'}},
 elowen:{n:'Oma Elowen',role:'Hüterin der alten Legenden',tag:'',age:76,traits:'weise, liebevoll, geheimnisvoll',region:'Smaragdwald',ort:'Blütenhain · Haus am Fliederbaum',el:'flora',partner:105,art:'elowen',alias:['Elowen'],
  team:[[107,45],[97,42],[48,42]],
  look:{build:'alt',sex:'w',skin:'#f0cdb0',eye:'#4a9a5a',hair:'geflochten',hairCol:'#e2ddd6',hat:'blume',flowerCol:'#b48ad8',top:'#6a7a3a',top2:'#efe6d2',coat:'umhang',coatCol:'#7a5a9a',scarf:'#efe6d2',legs:'robe',legCol:'#6a7a3a',boots:'#5a4030',
   acc:['stab','amulett'],stabCol:'#f2a83a',accCol:'#f2a83a',amuCol:'#b48ad8'},
  lines:{gruss:['Ach, Kind! Komm herein, der Tee ist warm.','Hallo, {name}. Ich habe dich erwartet.','Schön, dass du mich besuchst.'],
   kampf:['Ein Kampf? Na gut. Ich bin alt, nicht langsam!','Mein {mon} kennt alte Lieder.','Zeig mir dein Herz, Kind.'],
   sieg:['Siehst du? Geduld ist eine Kraft.','Gut versucht, mein Kind.','Die alten Wege sind noch stark.'],
   niederlage:['Wunderbar! Du hast ein gutes Herz.','Die Wächter würden sich freuen.','Ach, so jung und schon so weise.'],
   alltag:['Ich kenne alte Legenden. Willst du eine hören?','Schatten sind nicht böse. Sie gehören dazu.','Jede Region hat einen Elementarkristall.','Früher sprachen die Wächter mit uns.']},
  rel:{varkon:'kennt den Grund für seine Suche',nymera:'versteht die Schatten wie sie',veyran:'Freund seit Kindertagen',elara:'Schülerin'}},
 // ---- Arenaleiter (8)
 lior:{n:'Lior',role:'Arenaleiter Flora',tag:'Arenaleiter',age:25,traits:'freundlich, ausgeglichen, naturverbunden',region:'Smaragdwald',ort:'Wurzelheim · Garten-Tempel',el:'flora',partner:8,art:'lior',medal:'Floramedaille',
  team:[[19,12],[40,12],[8,15]],
  look:{build:'adult',sex:'m',skin:'#f3cfae',eye:'#4a9a4a',hair:'glatt',hairCol:'#b88a3a',hat:'blume',flowerCol:'#ffffff',top:'#efe6d2',coat:'mantel',coatCol:'#3f8a4a',coatTrim:'#e6c35c',collar:'kragen',legs:'hose',legCol:'#5a6a3a',belt:'#c9a46a',boots:'#5a4030',
   acc:['amulett'],amuCol:'#6cc86a',emblem:'blatt',emblemCol:'#e6c35c'},
  lines:{gruss:['Willkommen in Wurzelheim!','Hallo! Schön, dass du hier bist.','Ich bin Lior. Riechst du die Blüten?'],
   kampf:['Lass uns wachsen. Gemeinsam!','Blatt für Blatt. Los!','Meine Pflanzen sind bereit. Du auch?'],
   sieg:['Die Wurzeln halten fest.','Gut gekämpft. Jede Blume braucht Zeit.','Komm wieder. Du wächst noch.'],
   niederlage:['Du blühst richtig auf!','Toll! Hier ist die Floramedaille.','Der Weltenbaum freut sich mit dir.'],
   alltag:['Gieß deine Pflanzen. Und deine Freunde.','Im Weltenbaum wohnen viele Kreaturen.','Ich lese gern unter dem Blätterdach.']},
  rel:{elara:'Wald-Nachbarin',veyran:'schickt ihm Pflanzenproben'}},
 neria:{n:'Neria',role:'Arenaleiterin Flut',tag:'Arenaleiterin',age:27,traits:'selbstbewusst, ruhig, hilfsbereit',region:'Flutküste',ort:'Azurhafen · Wasserpalast',el:'flut',partner:5,art:'neria',medal:'Flutmedaille',
  team:[[16,15],[46,15],[5,18]],
  look:{build:'adult',sex:'w',skin:'#f1cfae',eye:'#3a7ad8',hair:'pferd',hairCol:'#2fa8b8',hairHi:'#2a6ac8',tieCol:'#f2c94c',hat:'muschel',face:'ohrringe',top:'#2f6ab0',top2:'#f6efe0',trim:'#e6c35c',belt:'#c9a46a',legs:'rock',legCol:'#f1e8d6',boots:'#c9a46a',
   acc:['amulett'],amuCol:'#5fd2e0',emblem:'welle',emblemCol:'#f6efe0',sig:'#e6c35c'},
  lines:{gruss:['Willkommen in Azurhafen!','Hallo! Das Meer ist heute ruhig.','Ich bin Neria. Komm, die Wellen warten!'],
   kampf:['Bleib ruhig. Wie das Wasser.','Welle für Welle. Los geht’s!','Mein Wasser ist sanft. Aber stark!'],
   sieg:['Das Meer war heute auf meiner Seite.','Gut geschwommen! Versuch es noch mal.','Atme tief. Dann klappt es.'],
   niederlage:['Wie eine große Welle! Toll!','Du hast gewonnen. Hier ist die Flutmedaille.','Das Meer ist stolz auf dich.'],
   alltag:['Im Korallenriff leuchten die Quallen.','Muscheln flüstern, wenn man genau hinhört.','Die Fähre fährt bei jedem Wetter.']},
  rel:{kael:'neckt ihn gern (Feuer und Wasser)',ondra:'ihre Lehrmeisterin auf See',mira:'Mira bewundert sie'}},
 kael:{n:'Kael',role:'Arenaleiter Glut',tag:'Arenaleiter',age:32,traits:'stolz, temperamentvoll, fair',region:'Glutlande',ort:'Flammenkrone · Vulkanarena',el:'glut',partner:2,art:'kael',medal:'Glutmedaille',
  team:[[13,19],[49,19],[2,22]],
  look:{build:'adult',sex:'m',skin:'#efc9a4',eye:'#c0702a',hair:'wild',hairCol:'#c8362a',hairHi:'#f08a3a',beard:'kinnbart',beardCol:'#a82a22',hat:'brille',gogCol:'#f2a83a',top:'#2a2428',top2:'#3a3236',trim:'#e6a83a',coat:'umhang',coatCol:'#c0302a',collar:'fell',
   legs:'hose',legCol:'#2a2428',boots:'#3a2a22',bootTrim:'#e6a83a',acc:['amulett'],amuCol:'#ff7a2a',emblem:'flamme',emblemCol:'#f2a83a',pose:'hueften'},
  lines:{gruss:['Willkommen in Flammenkrone!','Ha! Du hast Feuer in den Augen.','Ich bin Kael. Meine Arena brennt vor Freude!'],
   kampf:['Spürst du die Hitze? Los geht’s!','Mein Feuer ist heiß, aber fair!','Zeig mir deinen Mut!'],
   sieg:['Ha! Das Feuer brennt noch!','Gut gekämpft. Komm wieder, wenn du glühst.','Nicht aufgeben! Feuer braucht Zeit.'],
   niederlage:['Wow! Du hast mein Feuer gelöscht!','Das war heiß! Hier, die Glutmedaille.','Respekt! Du bist ein echter Funke.'],
   alltag:['Glut-Kreaturen frieren nie. Praktisch!','Über die Lavabrücken nur mit Glut-Freund!','Bei Sonnenaufgang soll Ignivar fliegen.']},
  rel:{grom:'holt Fackeln bei ihm',rayan:'Rayans großes Vorbild',neria:'Feuer-und-Wasser-Freundschaft'}},
 torvik:{n:'Torvik',role:'Arenaleiter Fels',tag:'Arenaleiter',age:38,traits:'kraftvoll, geduldig, zuverlässig',region:'Kristallgebirge',ort:'Kristallwacht · Felsarena',el:'fels',partner:22,art:'torvik',medal:'Felsmedaille',
  team:[[22,26],[82,27],[11,29]],
  look:{build:'kraeftig',sex:'m',skin:'#e2b48c',eye:'#d9922a',hair:'kurz',hairCol:'#6a4024',hairHi:'#c9a46a',beard:'kurzbart',beardCol:'#5a3418',hat:'stirnreif',hatCol:'#f2a83a',circCol:'#c9a46a',top:'#8a8478',top2:'#6a645a',closed:true,trim:'#e6c35c',collar:'fell',
   coat:'umhang',coatCol:'#5a4a3a',legs:'hose',legCol:'#4a4036',boots:'#3a3028',emblem:'berg',emblemCol:'#e6c35c',pose:'verschraenkt'},
  lines:{gruss:['Willkommen in Kristallwacht.','Hm. Du bist also {name}.','Ich bin Torvik. Hier ist alles aus Stein.'],
   kampf:['Fels gibt nicht nach. Los!','Stark wie ein Berg. Bereit?','Steh fest. Dann kämpfen wir.'],
   sieg:['Ein Berg wankt nicht.','Gut. Aber noch nicht hart genug.','Komm wieder. Steine haben Zeit.'],
   niederlage:['Hm! Du hast den Berg bewegt.','Gut gemacht. Die Felsmedaille gehört dir.','Ich bin stolz. Wirklich.'],
   alltag:['In der Tiefenmine glitzern Kristalle.','Mein Kiesel schnarcht. Laut.','Geduld ist die Kraft des Steins.']},
  rel:{tarek:'wird oft mit ihm verwechselt',grom:'Schmiede-Freund'}},
 sylva:{n:'Sylva',role:'Arenaleiterin Böe',tag:'Arenaleiterin',age:24,traits:'freiheitsliebend, temperamentvoll, abenteuerlustig',region:'Himmelsweiten',ort:'Windfels · Sturm-Arena',el:'boe',partner:69,art:'sylva',medal:'Böenmedaille',
  team:[[26,32],[60,32],[70,34]],
  look:{build:'adult',sex:'w',skin:'#f3cfae',eye:'#2fb8b8',hair:'pferd',hairCol:'#e6e8ee',hairHi:'#bfe8f0',tieCol:'#e6c35c',hat:'feder',face:'ohrringe',top:'#2fb0a8',top2:'#f6efe0',trim:'#e6c35c',coat:'umhang',coatCol:'#249a96',legs:'hose',legCol:'#f1e8d6',boots:'#7a5434',
   acc:['amulett'],amuCol:'#9fe8f0',emblem:'wind',emblemCol:'#e6c35c',pose:'winken'},
  lines:{gruss:['Willkommen in Windfels!','Hey! Spürst du den Wind?','Ich bin Sylva. Hier oben ist es frei!'],
   kampf:['Halt dich fest! Jetzt wird es windig!','Schnell wie eine Böe. Los!','Flieg mit mir!'],
   sieg:['Der Wind war schneller!','Gut versucht! Du brauchst mehr Rückenwind.','Komm wieder. Der Himmel wartet.'],
   niederlage:['Wow! Du fliegst ja richtig!','Toll! Hier ist die Böenmedaille.','Der Wind trägt dich weiter.'],
   alltag:['Am Adlerhorst lernst du gleiten.','Über der Himmelsbrücke wohnen Wolken-Kreaturen.','Federn sammle ich. Die blauen sind die besten.']},
  rel:{zaria:'Flugpartnerin',jorin:'Luftschiff-Kumpel'}},
 eira:{n:'Eira',role:'Arenaleiterin Frost',tag:'Arenaleiterin',age:34,traits:'ruhig, geduldig, lacht gern bei Schneeballschlachten – baut Figuren aus Eis',region:'Frosttundra',ort:'Eiswacht · Eis-Arena',el:'frost',partner:125,art:'eira',medal:'Frostmedaille',
  team:[[126,36],[76,37],[138,37]],
  look:{build:'adult',sex:'w',skin:'#f6dccb',eye:'#5ab0e0',hair:'glatt',hairCol:'#2a3a5a',hairHi:'#9fd8f2',hat:'kapuze',hoodCol:'#f4f8fc',top:'#3a7ab8',coat:'mantel',coatCol:'#eaf2f8',coatTrim:'#5ab0e0',collar:'fell',scarf:'#5ab0e0',legs:'hose',legCol:'#2a3a5a',
   boots:'#eaf2f8',bootTrim:'#9fd8f2',acc:['amulett'],amuCol:'#bfe8ff',emblem:'flocke',emblemCol:'#5ab0e0'},
  lines:{gruss:['Willkommen in Eiswacht!','Hallo! Ist dir auch nicht zu kalt?','Ich bin Eira. Ich baue Figuren aus Eis.'],
   kampf:['Kühler Kopf, warmes Herz. Los!','Glatteis voraus! Bereit?','Frost ist schön. Und stark.'],
   sieg:['Brrr! Das Eis hält.','Gut versucht. Trink erst einen Tee.','Komm wieder. Dann bauen wir einen Schneemann.'],
   niederlage:['Du hast das Eis geschmolzen!','Toll! Hier ist die Frostmedaille.','So warm wie eine heiße Quelle. Super!'],
   alltag:['Bei Polarlicht glitzert alles doppelt.','Im Quellental badet man mit Kreaturen.','Mein Flocki liebt Schneebälle.']},
  rel:{halvard:'Seilpartner am Gletscher',ylva:'Polarlicht-Freundin'}},
 nymera:{n:'Nymera',role:'Arenaleiterin Schatten',tag:'Arenaleiterin',age:28,traits:'geheimnisvoll, intelligent, freundlich',region:'Schattenmoor',ort:'Dämmerbruch · Mondtempel',el:'schatten',partner:65,art:'nymera',medal:'Schattenmedaille',
  team:[[32,40],[117,40],[65,43]],
  look:{build:'adult',sex:'w',skin:'#f1cfc0',eye:'#9a5ad8',hair:'lang',hairCol:'#3a2448',hairHi:'#6a3a8a',hat:'mondsichel',face:'ohrringe',top:'#3a2a5a',top2:'#5a3a7a',coat:'mantel',coatCol:'#3a2852',coatTrim:'#e6c35c',legs:'hose',legCol:'#2a2238',boots:'#2a2238',
   acc:['amulett'],amuCol:'#c9b0ff',emblem:'mond',emblemCol:'#e6c35c',lash:true},
  lines:{gruss:['Willkommen in Dämmerbruch.','Hallo. Keine Angst vor der Nacht.','Ich bin Nymera. Der Mond kennt dich schon.'],
   kampf:['Die Schatten tanzen. Tanzt du mit?','Schatten sind leise. Aber stark.','Lass uns im Mondlicht kämpfen.'],
   sieg:['Die Nacht war heute auf meiner Seite.','Gut gekämpft. Schatten sind schwer zu fassen.','Komm wieder, wenn der Mond scheint.'],
   niederlage:['Du hast den Schatten Licht gezeigt.','Schön! Hier ist die Schattenmedaille.','Du verstehst die Nacht. Das ist selten.'],
   alltag:['Schatten sind nicht böse. Sie schützen.','Mondlaternen leuchten nur für Freunde.','Varkon versteht die Schatten falsch.']},
  rel:{elowen:'teilt ihre Sicht auf Schatten',varkon:'will ihn stoppen – Schatten ist nicht böse',kaine:'kennt ihn aus Kindertagen'}},
 solan:{n:'Solan',role:'Arenaleiter Lumen',tag:'Arenaleiter',age:30,traits:'weise, optimistisch, gerecht',region:'Lichtlande',ort:'Sonnenfels · Sonnentempel',el:'lumen',partner:29,art:'lumenleiter',medal:'Lumenmedaille',
  team:[[62,45],[123,45],[30,48]],
  look:{build:'adult',sex:'m',skin:'#f3cfae',eye:'#d9922a',hair:'glatt',hairCol:'#f0c84a',hat:'sonnenkristall',hatCol:'#ffcf4a',top:'#f6f2e6',coat:'mantel',coatCol:'#fbf8f0',coatTrim:'#e6b83a',collar:'kragen',legs:'hose',legCol:'#efe6d2',boots:'#c9a46a',
   acc:['amulett'],amuCol:'#ffd24a',emblem:'sonne',emblemCol:'#e6b83a'},
  lines:{gruss:['Willkommen in Sonnenfels!','Hallo! Was für ein heller Tag.','Ich bin Solan. Licht zeigt uns den Weg.'],
   kampf:['Licht zeigt alles. Bereit?','Strahle mit mir!','Mein Licht ist warm. Aber hell!'],
   sieg:['Das Licht war heute hell.','Gut gekämpft. Sammle mehr Licht.','Bleib zuversichtlich. Morgen strahlst du.'],
   niederlage:['Du strahlst heller als die Sonne!','Wunderbar! Die Lumenmedaille gehört dir.','Licht und Mut. Das hast du beides.'],
   alltag:['Im Goldblütenpark tanzen Lichtkreaturen.','Jeder Mensch trägt ein kleines Licht.','Hinter dem Aurora-Tempel schläft eine Legende.']},
  rel:{ardena:'war ihr Schüler',brann:'Nachbar im Lichtland'}},
 // ---- Turmrat (vier Turmhüter im Kristallturm von Aurenstadt) + Kronenhüterin
 brann:{n:'Brann',role:'Turmhüter des Morgenrots',tag:'Turmhüter',age:62,traits:'brummig, herzlich, Gärtner und Schmied zugleich',region:'Lichtlande',ort:'Aurenstadt · Kristallturm, Saal Morgenrot',el:'glut',partner:109,art:'brann',
  team:[[109,52],[36,52],[15,53],[42,53]],
  look:{build:'alt',sex:'m',skin:'#e2b48c',eye:'#7a4a26',hair:'kurz',hairCol:'#d8d0c4',beard:'kurzbart',beardCol:'#d8d0c4',top:'#c86a3a',top2:'#efe6d2',closed:true,belt:'#5a3a22',legs:'hose',legCol:'#4a3a2a',boots:'#3a2a22',scarf:'#6cc86a',acc:['tasche'],accCol:'#7a5434',
   emblem:'turm',emblemCol:'#ffb04a',gloves:'#7a5434'},
  lines:{gruss:['Willkommen im Kristallturm. Ich bin Brann.','Na, Kleines? Der Saal Morgenrot glüht.','Ich hüte das erste Tor des Turmrats.'],
   kampf:['Feuer und Blätter. Beides wächst!','Ich schmiede Mut. Zeig mir deinen!','Los! Der Morgen beginnt.'],
   sieg:['Brumm. Noch zu früh am Morgen.','Gut. Aber noch nicht fertig geschmiedet.','Komm wieder. Ich warte.'],
   niederlage:['Ha! Du glühst wie ein Sonnenaufgang!','Geh weiter. Das zweite Tor wartet.','Gut gemacht, junger Funke.'],
   alltag:['Ich schmiede am Morgen und gieße am Abend.','Mein Garten wächst im Ofenlicht.','Der Turmrat schützt den Kristall von Aurenstadt.']},
  rel:{zaria:'Turmrat',ondra:'Turmrat',hesper:'Turmrat',ardena:'Kronenhüterin',grom:'hat ihm das Schmieden beigebracht'}},
 zaria:{n:'Zaria',role:'Turmhüterin des Mittagslichts',tag:'Turmhüterin',age:30,traits:'mutig, schnell, lacht laut',region:'Lichtlande',ort:'Aurenstadt · Kristallturm, Saal Mittagslicht',el:'boe',partner:128,art:'zaria',
  team:[[74,53],[45,53],[27,53],[128,54]],
  look:{build:'adult',sex:'w',skin:'#c98f62',eye:'#6a4a2a',hair:'kurz',hairCol:'#3a2a22',hat:'brille',gogCol:'#f2c94c',top:'#f2b43a',top2:'#ffffff',trim:'#c98a2a',scarf:'#ffffff',legs:'cargo',legCol:'#4a5a7a',boots:'#3a3a44',gloves:'#3a3030',
   emblem:'turm',emblemCol:'#ffffff',pose:'hueften'},
  lines:{gruss:['Ich bin Zaria, Hüterin des Mittagslichts!','Hey! Schnall dich an.','Hier oben weht der stärkste Wind.'],
   kampf:['Volle Kraft voraus!','Blitz und Wind! Los!','Schneller als ein Luftschiff!'],
   sieg:['Ha! Zu schnell für dich!','Gute Landung. Nächstes Mal schneller.','Tanken, dann noch mal!'],
   niederlage:['Wow! Du bist ja ein Sturm!','Abflug frei! Das dritte Tor ist offen.','Respekt! Du fliegst wie ein Profi.'],
   alltag:['Ich fliege Luftschiffe. Und Kreaturen fliegen mich.','In Sturmhafen kennt mich jeder.','Mittags ist das Licht am klarsten.']},
  rel:{sylva:'Flugpartnerin',brann:'Turmrat',ardena:'Kronenhüterin'}},
 ondra:{n:'Ondra',role:'Turmhüterin der Abendflut',tag:'Turmhüterin',age:48,traits:'ruhig, erzählt gern Seemannsgarn',region:'Lichtlande',ort:'Aurenstadt · Kristallturm, Saal Abendflut',el:'flut',partner:138,art:'ondra',
  team:[[95,52],[77,52],[12,53],[80,55]],
  look:{build:'adult',sex:'w',skin:'#e2b48c',eye:'#3a6aa8',hair:'lang',hairCol:'#9aa8b8',hat:'cap',hatCol:'#2a3a5a',brimCol:'#1e2a40',capSym:'welle',capSymBg:'#e6c35c',capSymCol:'#2a3a5a',top:'#2a3a5a',top2:'#efe6d2',coat:'mantel',coatCol:'#22324e',coatTrim:'#e6c35c',
   legs:'hose',legCol:'#efe6d2',boots:'#2a2a32',emblem:'turm',emblemCol:'#e6c35c'},
  lines:{gruss:['Ahoi! Ich bin Ondra.','Willkommen im Saal der Abendflut.','Setz dich. Ich erzähle dir vom Meer.'],
   kampf:['Wellen und Eis. Halt dich fest!','Die Flut kommt. Los!','Kapitänin Ondra, bereit!'],
   sieg:['Das Meer war heute rauer.','Gut gesegelt. Aber noch nicht im Hafen.','Komm wieder bei Flut.'],
   niederlage:['Ahoi! Du segelst wie ein Profi.','Land in Sicht! Das letzte Tor wartet.','Gut gemacht. Das Meer grüßt dich.'],
   alltag:['Ich habe Thalor einmal gesehen. Ganz kurz.','Abends glitzert das Meer wie Sterne.','Auf meinem Schiff gibt es Fischbrötchen.']},
  rel:{neria:'ihre Schülerin',hesper:'Turmrat',ardena:'Kronenhüterin'}},
 hesper:{n:'Hesper',role:'Turmhüter der Mitternacht',tag:'Turmhüter',age:55,traits:'leise, spricht in Bildern, zählt Sterne',region:'Lichtlande',ort:'Aurenstadt · Kristallturm, Saal Mitternacht',el:'schatten',partner:136,art:'hesper',
  team:[[33,55],[24,55],[132,55],[136,56]],
  look:{build:'alt',sex:'m',skin:'#e8c4a8',eye:'#5a5aa8',hair:'glatt',hairCol:'#4a4a5a',hairHi:'#c9c9d8',beard:'kinnbart',beardCol:'#4a4a5a',glasses:'rund',top:'#3a3a5a',top2:'#5a5a7a',coat:'umhang',coatCol:'#2a2a48',legs:'robe',legCol:'#2a2a48',boots:'#1e1e30',
   acc:['stab'],stabCol:'#9a8aff',emblem:'turm',emblemCol:'#c9b0ff'},
  lines:{gruss:['Psst. Ich bin Hesper.','Willkommen im Saal Mitternacht.','Die Sterne haben dich angekündigt.'],
   kampf:['Schatten und Stein. Hör gut zu.','Die Nacht ist leise. Ich auch.','Zeig mir deinen Stern.'],
   sieg:['Die Sterne stehen heute anders.','Gut. Aber die Nacht ist lang.','Komm wieder, wenn du leuchtest.'],
   niederlage:['Ein neuer Stern ist aufgegangen.','Geh. Die Kristallkrone wartet.','Schön. Sehr schön.'],
   alltag:['Ich zähle Sterne. Ich bin bei tausend.','Im Dunkeln sieht man das Licht besser.','Noctyra wacht über die Nacht.']},
  rel:{ylva:'schreibt ihr Sternenbriefe',ondra:'Turmrat',ardena:'Kronenhüterin'}},
 ardena:{n:'Ardena',role:'Kronenhüterin (Trägerin der Kristallkrone)',tag:'Kronenhüterin',age:36,traits:'warmherzig, mutig, gerecht – hat klein angefangen',region:'Lichtlande',ort:'Aurenstadt · Spitze des Kristallturms',el:'lumen',partner:71,art:'ardena',
  team:[[71,57],[86,57],[92,57],[101,58],[83,60]],
  look:{build:'adult',sex:'w',skin:'#9a6440',eye:'#d9922a',hair:'dutt',hairCol:'#1e1a22',hat:'stirnreif',hatCol:'#7ad8f0',circCol:'#e6c35c',face:'ohrringe',top:'#f6f2e6',top2:'#e6f2fa',trim:'#e6c35c',coat:'umhang',coatCol:'#3a8ad8',legs:'hose',legCol:'#f6f2e6',boots:'#c9a46a',
   acc:['amulett'],amuCol:'#7ad8f0',emblem:'stern',emblemCol:'#e6c35c',pose:'hueften',lash:true},
  lines:{gruss:['Willkommen ganz oben, {name}.','Ich bin Ardena. Ich hüte die Kristallkrone.','Du hast alle vier Tore geschafft. Toll!'],
   kampf:['Jetzt zeigen wir alles. Mit Herz!','Alle Elemente. Ein Team. Los!','Ich freue mich auf diesen Kampf!'],
   sieg:['Fast! Du warst so nah dran.','Gut gekämpft. Komm wieder, ich warte.','Die Krone bleibt heute bei mir.'],
   niederlage:['Wunderbar! Du trägst jetzt die Kristallkrone!','Die Krone gehört dir. Beschütze Veyra gut.','Ich bin so stolz auf dich!'],
   alltag:['Die Krone heißt: Beschütze Veyra.','Jede Medaille ist ein Kristallsplitter.','Auch ich habe klein angefangen.']},
  rel:{solan:'ihr früherer Schüler',brann:'Turmrat',zaria:'Turmrat',ondra:'Turmrat',hesper:'Turmrat',varkon:'früherer Weggefährte – sie hofft auf seine Umkehr'}},
 // ---- Schattenorden (kindgerecht: streng, irrend, nie grausam; Läuterung)
 varkon:{n:'Lord Varkon',role:'Anführer des Schattenordens',tag:'',age:42,traits:'ehrgeizig, klug, streng – glaubt, Veyra retten zu müssen',region:'Kristallgebirge',ort:'Kristallfeste (Varkons Festung)',el:'schatten',partner:104,partnerForm:'rot',art:'varkon',alias:['Varkon'],
  team:[[132,48],[113,48],[36,49],[104,52]],forms:{104:'rot'},
  look:{build:'adult',sex:'m',skin:'#ecc8b0',eye:'#d0303a',hair:'glatt',hairCol:'#2a2a30',hairHi:'#c9c9d0',beard:'kinnbart',beardCol:'#2a2a30',face:'narbe',top:'#1e1a22',top2:'#5a1a22',coat:'mantel',coatCol:'#1a161e',coatTrim:'#c9302a',collar:'kragen',belt:'#5a5a62',
   legs:'hose',legCol:'#1e1a22',boots:'#1a161e',acc:['kugel'],emblem:'dorn',emblemCol:'#e0303e'},
  lines:{gruss:['Ah. Du bist das Kind, von dem alle reden.','Ich bin Lord Varkon.','Du stehst mir im Weg, {name}.'],
   kampf:['Ich tue das, um Veyra zu retten!','Du verstehst es noch nicht. Aber gut. Los!','Die Kristalle müssen zu mir!'],
   sieg:['Siehst du? Ich habe recht.','Geh nach Hause, Kind.','Mein Weg ist der richtige. Glaube ich.'],
   niederlage:['Unmöglich … Wie bist du so stark?','Vielleicht … vielleicht lag ich falsch.','Deine Kreaturen kämpfen aus Liebe. Nicht aus Angst.'],
   alltag:['Das Gleichgewicht kippt. Niemand hört mir zu.','Die Wächter schlafen. Ich nicht.','Ich wollte nur helfen. Auf meine Art.']},
  rel:{seraphine:'rechte Hand',kaine:'Späher',elowen:'kennt seine Geschichte',ardena:'früherer Weggefährte'}},
 seraphine:{n:'Seraphine',role:'Varkons rechte Hand',tag:'',age:31,traits:'klug, kühl, elegant – zweifelt später an Varkon',region:'Kristallgebirge',ort:'Geheime Kristallkammern',el:'schatten',partner:104,partnerForm:'violett',art:'seraphine',
  team:[[117,38],[64,38],[104,42]],forms:{104:'violett'},
  look:{build:'adult',sex:'w',skin:'#f1d2c4',eye:'#9a5ad8',hair:'lang',hairCol:'#2a1a32',hairHi:'#5a2a6a',top:'#1e1a24',top2:'#c0303a',coat:'mantel',coatCol:'#221a2a',coatTrim:'#9a5ad8',belt:'#5a5a62',legs:'hose',legCol:'#1e1a24',boots:'#1a161e',
   face:'ohrringe',emblem:'dorn',emblemCol:'#e0303e',pose:'verschraenkt',lash:true},
  lines:{gruss:['So sieht man sich wieder.','Ich bin Seraphine.','Du schon wieder? Wie hartnäckig.'],
   kampf:['Elegant und schnell. Pass auf.','Ich verliere nicht. Nie.','Zeig mir, was du kannst.'],
   sieg:['Zu langsam, Kleines.','War das alles?','Geh lieber. Es wird ernst.'],
   niederlage:['Du … bist wirklich gut.','Vielleicht hat Varkon nicht recht.','Geh. Ich halte dich nicht auf.'],
   alltag:['Varkon hat einen Plan. Ich hoffe es.','Kristalle singen, wenn man still ist.','Ich frage mich manchmal, ob wir richtig sind.']},
  rel:{varkon:'Anführer – ihre Zweifel wachsen',kaine:'jüngerer Ordensbruder'}},
 kaine:{n:'Kaine',role:'Späher des Schattenordens',tag:'',age:21,traits:'still, aufmerksam, loyal – erster Überläufer',region:'Schattenmoor',ort:'Ordens-Außenposten (Morastplateau)',el:'schatten',partner:104,partnerForm:'schwarzviolett',art:'kaine',
  team:[[116,20],[102,21]],teams:{2:[[117,30],[103,32]]},
  look:{build:'teen',sex:'m',skin:'#ecc8b0',eye:'#9a5ad8',hair:'stachel',hairCol:'#2a2430',hairHi:'#c9c9d8',face:'narbe',hat:'kapuze',hoodCol:'#2a2234',top:'#2a2430',top2:'#5a2a4a',trim:'#9a3a6a',legs:'hose',legCol:'#2a2430',boots:'#1e1a24',
   acc:['fernglas'],emblem:'dorn',emblemCol:'#d0306a'},
  lines:{gruss:['…','Ich habe dich beobachtet.','Psst. Hier ist niemand. Nur ich.'],
   kampf:['Gut. Dann eben so.','Ich bin leise. Aber nicht schwach.','Mein Fernglas sagt: Du kommst. Los!'],
   sieg:['Ich sehe alles.','Zu laut. Darum hast du verloren.','Ich verschwinde jetzt im Nebel.'],
   niederlage:['… Interessant.','Du bist anders als die anderen.','Vielleicht … helfe ich dir mal.'],
   alltag:['Ich sehe mehr, als du denkst.','Der Nebel ist mein Freund.','Elara kennt auch die geheimen Wege.']},
  rel:{varkon:'folgt ihm',elara:'Gegenspielerin',nymera:'kennt sie von früher'}},
 lehrling:{n:'Ordensrekrut',role:'Handlanger des Schattenordens (allgemein)',tag:'',generic:true,age:16,traits:'trottelig, eigentlich nett',region:'überall',ort:'Ordens-Stützpunkte',el:'schatten',partner:31,
  team:[[31,12],[135,12]],pool:[31,112,135,131,116],names:['Bodo','Fips','Greta','Knut','Lumpi','Merle','Ole','Tilda'],
  look:{build:'teen',sex:'m',skin:'#f3cfae',eye:'#6a4a5a',hair:'kurz',hairCol:'#4a3a32',hat:'kapuze',hoodCol:'#2a2430',top:'#2e2a36',top2:'#4a4052',trim:'#c0303a',legs:'hose',legCol:'#2a2430',boots:'#1e1a24',emblem:'dorn',emblemCol:'#e0303e'},
  lines:{gruss:['Halt! Hier ist … äh … Sperrgebiet!','Oh nein, ein Kind! Was mach ich jetzt?','Psst! Ich bin gar nicht da.'],
   kampf:['Für den Schattenorden! Glaube ich.','Ich hab extra geübt! Zweimal!','Mein Umhang ist neu. Pass bloß auf!'],
   sieg:['Ich hab gewonnen? Ich hab gewonnen!','Ha! Das erzähl ich allen!','Sag das bitte meinem Chef!'],
   niederlage:['Mist! Das gibt Ärger.','Ich wollte eh Bäcker werden.','Ich muss das melden … oder lieber nicht.'],
   alltag:['Unser Umhang ist zu lang. Ich stolpere dauernd.','Der Chef sagt, wir retten die Welt.','Weißt du, wo die Kantine ist?']},
  rel:{varkon:'Chef',seraphine:'hat Angst vor ihr'}},
 // ---- wichtige Bewohner
 mama:{n:'Mama',role:'Mutter des Helden',tag:'',age:40,traits:'herzlich, praktisch, war früher selbst unterwegs',region:'Lichtlande',ort:'Aurenstadt · Wohnviertel',el:'boe',partner:59,
  team:[[60,20]],
  look:{build:'adult',sex:'w',skin:'#f3cfae',eye:'#6a4a2a',hair:'dutt',hairCol:'#7a4a26',top:'#e07a6a',top2:'#ffffff',closed:true,trim:'#b8564a',legs:'rock',legCol:'#6a8ab8',boots:'#7a5434'},
  lines:{gruss:['Guten Morgen, Schatz!','Da bist du ja! Hast du Hunger?','Hallo, {name}! Schön, dass du da bist.'],
   kampf:['Ein Übungskampf mit Mama? Na gut!','Mein Wolkito ist flauschig. Und flink!','Ich war früher auch mal unterwegs, weißt du?'],
   sieg:['Mama gewinnt. Ausnahmsweise!','Iss erst mal was. Dann klappt es.','Gut gemacht, Schatz!'],
   niederlage:['Mein großes Kind! So stark!','Ich bin so stolz auf dich.','Toll! Jetzt gibt es Kuchen.'],
   alltag:['Vergiss deine Jacke nicht!','Ruf mich mal über die Chronik an.','Pass gut auf deine Kreaturen auf.']},
  rel:{held:'ihr Kind',veyran:'Nachbar'}},
 fiete:{n:'Fiete',role:'Kreaturenfan',tag:'',age:8,traits:'quirlig, laut, liebt alle Kreaturen',region:'Lichtlande',ort:'Aurenstadt · Stadtpark',el:'kern',partner:112,
  team:[[112,4]],
  look:{build:'klein',sex:'m',skin:'#f6d3b3',eye:'#3a7ad8',hair:'schopf',hairCol:'#d9a441',top:'#e8623a',top2:'#ffffff',legs:'shorts',legCol:'#3a5a8a',socks:'#ffffff',boots:'#3a7ad8',hat:'cap',hatCol:'#3a7ad8',capSym:'stern',capSymBg:'#ffffff',capSymCol:'#f2c94c',
   acc:['rucksack'],accCol:'#f2c94c',rollCol:'#e8623a',pose:'winken'},
  lines:{gruss:['Wow! Du hast eine echte Kreatur!','Hallo! Ich bin Fiete! Ich bin fast acht!','Darf ich deine Kreatur streicheln?'],
   kampf:['Ich will auch kämpfen! Los, Knabbi!','Mein Knabbi ist der Größte!','Achtung, ich bin echt stark!'],
   sieg:['Jaaa! Ich hab gewonnen!','Knabbi, du bist ein Held!','Bin ich jetzt ein Veyra-Profi?'],
   niederlage:['Ohhh. Du bist so gut!','Kannst du mir das beibringen?','Wenn ich groß bin, gewinne ich!'],
   alltag:['Ich kenne alle Kreaturen. Na ja, fast.','Mein Lieblingsessen ist Pfannkuchen.','Wenn ich groß bin, trage ich die Kristallkrone!']},
  rel:{rayan:'großer Fan von Rayan',lotte:'bekommt bei ihr Kekse'}},
 lotte:{n:'Lotte',role:'Café-Wirtin',tag:'',age:52,traits:'gemütlich, neugierig, backt den besten Beerenkuchen',region:'Lichtlande',ort:'Aurenstadt · Café am Sternenplatz',el:'kern',partner:130,
  team:[[130,15]],
  look:{build:'adult',sex:'w',skin:'#f3cfae',eye:'#6a4a2a',hair:'dutt',hairCol:'#c8462e',top:'#f6f2e6',top2:'#ffffff',closed:true,trim:'#e86a8a',belt:'#e86a8a',legs:'rock',legCol:'#7a3a4a',boots:'#5a3a22'},
  lines:{gruss:['Willkommen im Café am Sternenplatz!','Hallo! Heute gibt es Beerenkuchen.','Komm rein, ein Tisch ist frei.'],
   kampf:['Kampf vor dem Kuchen? Na schön!','Mein Teekrug kocht vor Freude!','Vorsicht, heiß!'],
   sieg:['Gewonnen! Kuchen geht aufs Haus.','Erst Tee, dann noch mal.','Lecker Sieg!'],
   niederlage:['Oh! Du bist stark. Hier, ein Keks.','Toll! Komm, ich lade dich ein.','Das war lecker spannend!'],
   alltag:['Kreaturen lieben Honigtau.','Hier treffen sich alle Reisenden.','Rayan bestellt immer drei Stück Kuchen.']},
  rel:{rayan:'Lieblingsgast',fiete:'gibt ihm Kekse'}},
 grom:{n:'Meister Grom',role:'Schmied (Lehr-Kristalle)',tag:'',age:50,traits:'laut, gutmütig, sehr genau',region:'Glutlande',ort:'Glutheim · Schmiede',el:'glut',partner:50,alias:['Grom'],
  team:[[50,28]],
  look:{build:'kraeftig',sex:'m',skin:'#c98f62',eye:'#4a2a1a',hair:'kurz',hairCol:'#2a1d16',beard:'vollbart',beardCol:'#2a1d16',top:'#7a5a3a',top2:'#c9b08a',closed:true,belt:'#4a2a1a',legs:'hose',legCol:'#4a3a2a',boots:'#2a1d16',gloves:'#5a3a22',emblem:'flamme',emblemCol:'#ffb04a'},
  lines:{gruss:['Hallo! Ich bin Grom, der Schmied.','Willkommen in Glutheim!','Na? Brauchst du einen Lehr-Kristall?'],
   kampf:['Ein Hammerschlag – los!','Heiß wie die Esse!','Mein Brutzel glüht schon.'],
   sieg:['Ha! Gut geschmiedet.','Noch einmal ins Feuer!','Stark, aber noch weich.'],
   niederlage:['Donnerhammer! Du bist stark!','Gut! Ich schleife dir einen Kristall.','Respekt, kleiner Schmied!'],
   alltag:['Ich schleife Lehr-Kristalle. Ganz fein.','Die Esse brennt Tag und Nacht.','Kael holt hier seine Fackeln.']},
  rel:{kael:'Kunde (Fackeln)',borwin:'Händler seiner Kristalle',brann:'sein Schüler von früher'}},
 jorin:{n:'Kapitän Jorin',role:'Luftschiff-Kapitän',tag:'',age:44,traits:'gut gelaunt, abenteuerlustig',region:'Himmelsweiten',ort:'Sturmhafen · Luftschiffhafen',el:'boe',partner:119,alias:['Jorin'],
  team:[[119,30]],
  look:{build:'adult',sex:'m',skin:'#efc9a4',eye:'#3a6aa8',hair:'glatt',hairCol:'#b88a3a',hat:'brille',gogCol:'#9fe4ff',top:'#2f5a9a',top2:'#efe6d2',coat:'mantel',coatCol:'#7a5434',coatTrim:'#e6c35c',scarf:'#ffffff',legs:'hose',legCol:'#4a4036',boots:'#3a2a22',emblem:'wind',emblemCol:'#e6c35c'},
  lines:{gruss:['Willkommen in Sturmhafen!','Hallo! Ich bin Kapitän Jorin.','Wohin soll die Reise gehen?'],
   kampf:['Leinen los! Kampf!','Volle Fahrt voraus!','Wolkenwoll, aufpusten!'],
   sieg:['Gute Landung für mich!','Nächstes Mal mit Rückenwind.','Ha! Kapitän bleibt Kapitän.'],
   niederlage:['Hui! Gut gemacht!','Du hast Talent zum Fliegen.','Hier ist ein Freiflug. Für dich!'],
   alltag:['Das Luftschiff fährt zu allen acht Regionen.','Über den Wolken ist es immer sonnig.','Pass auf deinen Hut auf!']},
  rel:{sylva:'Luftschiff-Kumpel',zaria:'fliegt bei ihm mit'}},
 halvard:{n:'Halvard',role:'Bergführer',tag:'',age:60,traits:'ruhig, zäh, kennt jeden Stein',region:'Frosttundra',ort:'Gletschergrat · Gipfelwacht',el:'frost',partner:126,
  team:[[126,34]],
  look:{build:'alt',sex:'m',skin:'#efc9a4',eye:'#3a6aa8',hair:'kurz',hairCol:'#c9c4bc',beard:'kurzbart',beardCol:'#c9c4bc',hat:'cap',hatCol:'#b8433a',brimCol:'#8a2a2a',top:'#b8433a',coat:'mantel',coatCol:'#5a6a7a',coatTrim:'#efe6d2',collar:'fell',legs:'hose',legCol:'#4a4036',
   boots:'#3a2a22',acc:['rucksack','stab'],stabCol:'#bfe8ff',accCol:'#7a5434'},
  lines:{gruss:['Grüß dich auf der Gipfelwacht!','Hallo! Ich bin Halvard, der Bergführer.','Ganz schön hoch hier, oder?'],
   kampf:['Ein Kampf in der Kälte? Gerne!','Halt dich warm! Los!','Mein Firnhase kennt jeden Stein.'],
   sieg:['Der Berg hat gewonnen.','Erst wärmen, dann weiter.','Gut gekämpft, Bergfreund.'],
   niederlage:['Donnerwetter! Du bist zäh.','Du schaffst den Gipfel bestimmt!','Hier, ein warmer Tee.'],
   alltag:['Vom Frostzahn sieht man alle acht Regionen.','Auf dem Himmelssteg immer festhalten!','Manchmal sehe ich einen weißen Hirsch.']},
  rel:{eira:'Seilpartnerin am Gletscher'}},
 ylva:{n:'Ylva',role:'Sternen-Beobachterin',tag:'',age:15,traits:'verträumt, klug, zählt Sternschnuppen',region:'Frosttundra',ort:'Nordlichtsee · Sternenwacht',el:'lumen',partner:139,
  team:[[139,35]],
  look:{build:'teen',sex:'w',skin:'#f6dccb',eye:'#5a5aa8',hair:'zopf',hairCol:'#3a2a5a',tieCol:'#f2c94c',glasses:'rund',top:'#3a4a8a',top2:'#efe6d2',coat:'mantel',coatCol:'#2a3468',coatTrim:'#f2c94c',scarf:'#f2c94c',legs:'hose',legCol:'#2a2a48',boots:'#3a2a22',
   acc:['buch'],bookCol:'#2a3468',emblem:'stern',emblemCol:'#f2c94c'},
  lines:{gruss:['Hallo! Ich bin Ylva von der Sternenwacht.','Schau mal nach oben!','Du bist früh. Die Sterne kommen gleich.'],
   kampf:['Ein Sternenkampf? Los!','Sternschnuppi, leuchte!','Ich wünsche mir einen Sieg!'],
   sieg:['Mein Wunsch ist wahr geworden!','Hehe. Die Sterne waren nett zu mir.','Komm wieder, wenn es dunkel ist.'],
   niederlage:['Wow! Du bist ein echter Stern.','Ich wünsch dir alles Gute!','Toll gemacht!'],
   alltag:['Bei Polarlicht glitzern Kreaturen besonders.','Die alte Legende von Auralis kenne ich auswendig.','Ich zähle Sternschnuppen. Heute schon drei!']},
  rel:{hesper:'Brieffreund (Sternenbriefe)',eira:'Polarlicht-Freundin'}},
 // ---- Nebenfiguren, die B2 in 02-world nutzt (fig:'wilma' …)
 wilma:{n:'Gärtnerin Wilma',role:'Gärtnerin',tag:'',age:58,traits:'gemütlich, redet mit Pflanzen',region:'Lichtlande',ort:'Aurenstadt · Gärten',el:'flora',partner:40,alias:['Wilma'],
  team:[[40,10],[96,10]],
  look:{build:'alt',sex:'w',skin:'#f0cdb0',eye:'#5a7a4a',hair:'dutt',hairCol:'#c9c4bc',hat:'blume',flowerCol:'#f2c94c',top:'#7fae5a',top2:'#efe6d2',closed:true,belt:'#a0703e',legs:'rock',legCol:'#5a7a4a',boots:'#6a4a30',acc:['kraeuter'],accCol:'#a0703e'},
  lines:{gruss:['Hallo, Kind! Die Tomaten sind heute rot.','Schön, dich zu sehen!','Na, {name}? Willst du gießen helfen?'],
   kampf:['Ein Kampf zwischen den Beeten? Na gut!','Mein Tilli ist langsam. Aber zäh!','Vorsicht mit den Blumen!'],
   sieg:['Hihi. Die Wurzeln halten.','Gut versucht! Iss mehr Gemüse.','Gartenarbeit macht stark.'],
   niederlage:['Oh! Du bist flink.','Prima! Nimm eine Beere mit.','Du wächst schneller als mein Kürbis.'],
   alltag:['Pflanzen mögen es, wenn man mit ihnen spricht.','Flora-Kreaturen schlafen gern in der Sonne.','Hier wächst alles. Sogar Freundschaft.']},
  rel:{lior:'tauscht Samen mit ihm',veyran:'liefert Pflanzen fürs Labor'}},
 marlene:{n:'Kapitänin Marlene',role:'Fährkapitänin',tag:'',age:46,traits:'tatkräftig, laut lachend, pünktlich',region:'Flutküste',ort:'Azurhafen · Fähre',el:'flut',partner:93,alias:['Marlene'],
  team:[[94,30],[38,28]],
  look:{build:'adult',sex:'w',skin:'#e2b48c',eye:'#3a6aa8',hair:'zopf',hairCol:'#c8462e',tieCol:'#ffffff',hat:'cap',hatCol:'#ffffff',brimCol:'#2a5f9a',capSym:'welle',capSymBg:'#2a5f9a',capSymCol:'#ffffff',top:'#2a5f9a',top2:'#ffffff',trim:'#ffffff',legs:'hose',legCol:'#efe6d2',boots:'#2a2a32',emblem:'welle',emblemCol:'#ffffff'},
  lines:{gruss:['Ahoi! Willkommen an Bord!','Hallo! Die Fähre legt gleich ab.','Na, {name}? Fahrkarte brauchst du keine.'],
   kampf:['Klar zum Kampf!','Wellen hoch! Los!','Mein Riffschwimmer ist schneller als mein Schiff!'],
   sieg:['Ha! Wind und Welle sind auf meiner Seite.','Gut gekämpft, Landratte!','Nächstes Mal mit mehr Rückenwind.'],
   niederlage:['Donnerwelle! Du bist gut!','Hut ab, kleiner Kapitän!','Das muss ich der Mannschaft erzählen.'],
   alltag:['Die Fähre fährt zur Perleninsel.','Manchmal begleiten uns Wal-Kreaturen.','Pass auf die Möwen auf. Die klauen Brötchen!']},
  rel:{neria:'bringt Neria Muscheln mit',ondra:'ihre alte Lehrmeisterin'}},
 corvin:{n:'Sternendeuter Corvin',role:'Sternendeuter',tag:'',age:64,traits:'geheimnisvoll, gütig, flüstert gern',region:'Schattenmoor',ort:'Nebelholm',el:'schatten',partner:135,alias:['Corvin'],
  team:[[136,34],[33,36]],
  look:{build:'alt',sex:'m',skin:'#e8c4a8',eye:'#7a6ab8',hair:'lang',hairCol:'#d8d4e0',beard:'vollbart',beardCol:'#d8d4e0',top:'#352a4a',coat:'umhang',coatCol:'#2a2240',legs:'robe',legCol:'#352a4a',boots:'#1e1a2a',acc:['stab'],stabCol:'#c9b0ff',emblem:'stern',emblemCol:'#f2c94c'},
  lines:{gruss:['Ah. Die Sterne haben dich angekündigt.','Komm näher. Leise, bitte.','Hallo, {name}. Ich habe auf dich gewartet.'],
   kampf:['Die Sterne sagen: Kampf!','Lass uns sehen, was der Himmel will.','Mein Flatti kennt die Nacht.'],
   sieg:['Es stand in den Sternen.','Der Mond war heute bei mir.','Komm wieder, wenn die Sterne günstig stehen.'],
   niederlage:['Oh! Das sah ich nicht kommen.','Ein neuer Stern leuchtet. Du!','Wunderbar. Die Sterne lächeln.'],
   alltag:['Siehst du das Sternbild? Es sieht aus wie ein Fuchs.','Die Nacht erzählt alte Geschichten.','Bei Vollmond singen die Schattenkreaturen.']},
  rel:{hesper:'Sternen-Freund',nymera:'berät sie bei Mondnächten'}},
 ruven:{n:'Leuchtturmwärter Ruven',role:'Leuchtturmwärter',tag:'',age:70,traits:'ruhig, treu, erzählt vom Meer',region:'Flutküste',ort:'Leuchtturmklippen',el:'boe',partner:43,alias:['Ruven'],
  team:[[44,30],[26,28]],
  look:{build:'alt',sex:'m',skin:'#efc9a4',eye:'#3a6aa8',hair:'kurz',hairCol:'#e2ddd6',beard:'kurzbart',beardCol:'#e2ddd6',hat:'cap',hatCol:'#c9a77c',brimCol:'#8a6a4a',top:'#c9a77c',top2:'#efe6d2',coat:'mantel',coatCol:'#e6c35c',coatTrim:'#c9a77c',legs:'hose',legCol:'#3a4a6a',boots:'#2a2a32',acc:['laterne'],lampCol:'#fff2b0'},
  lines:{gruss:['Hallo! Willkommen am Leuchtturm.','Na? Hast du den Weg gefunden?','Komm, oben ist die Aussicht schön.'],
   kampf:['Licht an! Kampf!','Ein alter Mann kann noch kämpfen!','Federel, flieg!'],
   sieg:['Das Licht bleibt an.','Gut gekämpft. Noch ein Stück üben.','Haha. Erfahrung hilft.'],
   niederlage:['Donnerwetter! Du leuchtest ja.','Gut gemacht. Das Meer ist stolz.','Ich bin beeindruckt.'],
   alltag:['Seit vierzig Jahren brennt mein Licht.','Böe-Kreaturen lieben das Licht.','Von hier sieht man bis zur Perleninsel.']},
  rel:{marlene:'winkt ihrer Fähre jeden Morgen'}},
 asta:{n:'Hüttenwärterin Asta',role:'Hüttenwärterin',tag:'',age:44,traits:'robust, warmherzig, kocht Suppe',region:'Glutlande',ort:'Hütte am Schluchteingang',el:'glut',partner:13,alias:['Asta'],
  team:[[14,22]],
  look:{build:'adult',sex:'w',skin:'#e2b48c',eye:'#6a4a2a',hair:'zopf',hairCol:'#6a4024',tieCol:'#d9a05a',top:'#d9a05a',top2:'#efe6d2',closed:true,belt:'#6a4226',scarf:'#b8433a',legs:'hose',legCol:'#5a4a36',boots:'#3a2a22',gloves:'#7a5434'},
  lines:{gruss:['Komm rein! Hier ist es warm.','Hallo! Hast du Hunger? Es gibt Suppe.','Setz dich ans Feuer.'],
   kampf:['Ein Kampf? Nach dem Essen!','Mein Kohlo ist heiß. Pass auf!','Na gut. Aber fair!'],
   sieg:['Hihi. Erst essen, dann siegen.','Gut versucht! Nimm noch einen Teller.','Feuer schlägt Hunger.'],
   niederlage:['Oh! Du bist stark.','Toll! Die Suppe geht aufs Haus.','Gut gemacht, Kleines!'],
   alltag:['In der Schlucht ist es heiß. Trink genug!','Glut-Kreaturen wärmen meine Hütte.','Über die Lavabrücken nur mit Begleiter!']},
  rel:{kael:'liefert ihm Holz',grom:'Nachbar'}},
 wache:{n:'Palastwache',role:'Wache am Königspalast',tag:'',generic:true,age:30,traits:'pflichtbewusst, freundlich',region:'Lichtlande',ort:'Aurenstadt · Königspalast',el:'fels',partner:22,
  team:[[23,40]],pool:[22,57,81],names:['Bert','Hella','Kasimir','Ida'],
  look:{build:'adult',sex:'m',skin:'#efc9a4',eye:'#4a4a5a',hair:'kurz',hairCol:'#4a3426',hat:'cap',hatCol:'#e8d28a',brimCol:'#b8963a',top:'#e8d28a',top2:'#ffffff',closed:true,trim:'#b8963a',belt:'#6a4226',legs:'hose',legCol:'#3a4a6a',boots:'#2a2a32',emblem:'turm',emblemCol:'#3a8ad8'},
  lines:{gruss:['Halt! Ach, du bist es. Hallo!','Willkommen am Königspalast.','Guten Tag! Alles in Ordnung?'],
   kampf:['Wache steht! Los!','Ich passe auf. Auch im Kampf!','Bereit zur Prüfung?'],
   sieg:['Wache bleibt Wache.','Gut versucht! Üb noch ein wenig.','Der Palast ist sicher.'],
   niederlage:['Oh! Du bist stark. Darf ich dich vorbeilassen?','Respekt!','Das melde ich lobend.'],
   alltag:['Im Kristallturm wartet der Turmrat.','Ganz oben wacht die Kronenhüterin.','Ich stehe hier jeden Tag. Auch im Regen.']},
  rel:{ardena:'dient der Kronenhüterin'}},
};
Object.defineProperty(FIGURES,'terms',{enumerable:false,value:{elite:'Turmrat',eliteOne:'Turmhüter',eliteW:'Turmhüterin',ace:'Veyra-Profi',champ:'Ardena',champTitle:'Kronenhüterin',champLong:'Trägerin der Kristallkrone',
 crown:'Kristallkrone',order:'Schattenorden',orderNew:'Dämmerbund',grunt:'Ordensrekrut',tower:'Kristallturm',station:'Kreaturenstation',capsule:'Fangkapsel',chronik:'Chronik',lehrkristall:'Lehr-Kristall',medal:'Medaille'}});
const FIG_SITS=['gruss','kampf','sieg','niederlage','alltag'];
// Ausdruck je Situation (Porträt/Gesicht)
const FIG_SIT_EXPR={gruss:'freudig',kampf:'entschlossen',sieg:'stolz',niederlage:'ueberrascht',alltag:'laechelnd'};
const FIG_EXPR_FALLBACK={freudig:['freudig','begeistert','laechelnd','zufrieden','stolz','neutral'],laechelnd:['laechelnd','zaertlich','zufrieden','freudig','neutral'],zaertlich:['zaertlich','laechelnd','freudig','neutral'],
 entschlossen:['entschlossen','ernst','stolz','neutral'],ueberrascht:['ueberrascht','nachdenklich','neutral'],nachdenklich:['nachdenklich','ernst','neutral'],traurig:['nachdenklich','ernst','neutral'],
 stolz:['stolz','zufrieden','laechelnd','freudig','neutral'],ernst:['ernst','entschlossen','neutral'],neutral:['neutral','laechelnd','zufrieden','freudig','ernst']};

// ---------- Nachschlagen ----------
for(const id in FIGURES)FIGURES[id].id=id;
// fig-Schlüssel, die B2 in 02-world nutzt, auf Kanon-IDs abbilden
const FIG_ID_ALIAS={champion:'ardena',orden:'lehrling',rekrut:'lehrling',runa:'eira',amaris:'ardena',pip:'fiete',prof:'veyran',professor:'veyran',lumenleiter:'solan'};
function figKey(id){return FIGURES[id]?id:FIG_ID_ALIAS[id]&&FIGURES[FIG_ID_ALIAS[id]]?FIG_ID_ALIAS[id]:null;}
function figById(id){const k=figKey(id);return k?FIGURES[k]:null;}
const FIG_TITLES=/^(Arenaleiter(in)?|Turmhüter(in)?|Kronenhüter(in)?|Veyra-Profi|Ordensrekrut|Ordenslehrling|Lord|Oma|Meister|Kapitän|Prof\.?|Professor|Rival(e|in)|Heilerin|Händler|Waldhüterin|Forscher)\s+/i;
function figByName(name){const nm=String(name||'').trim();if(!nm)return null;
 if(typeof G!=='undefined'&&G){if(nm===G.name)return FIGURES[G.outfit&&G.outfit.body==='heldin'?'heldin':'held'];if(G.rival&&nm===G.rival)return FIGURES.rayan;}
 for(const id in FIGURES){const F=FIGURES[id];if(F.player)continue;if(F.n===nm||(F.alias||[]).includes(nm))return F;}
 const core=nm.replace(FIG_TITLES,'').trim();for(const id in FIGURES){const F=FIGURES[id];if(F.player||F.generic)continue;if(F.n.replace(FIG_TITLES,'').trim()===core||(F.alias||[]).includes(core))return F;}
 if(/^Ordens(rekrut|lehrling)/.test(nm))return FIGURES.lehrling;return null;}
function figIdOf(n){if(!n)return null;if(n.fig&&figKey(n.fig))return figKey(n.fig);const F=n.name&&figByName(n.name);return F?F.id:null;}
function figLookOf(n){const id=figIdOf(n);if(!id)return null;const F=FIGURES[id];return n.look?Object.assign({},F.look,n.look):F.look;}
// Aussehen der Spielfigur aus G.outfit (Held/Heldin + Farbvarianten); alte Outfits bleiben gültig
function heroLook(o){o=o||{};const her=o.body==='heldin',L=Object.assign({},FIGURES[her?'heldin':'held'].look);
 if(o.skin)L.skin=o.skin;if(o.hairCol)L.hairCol=o.hairCol;if(o.top){L.top=o.top;L.trim=shade(o.top,.72);if(her){L.brimCol=o.top;L.capSymBg=o.top;}}if(o.pants)L.legCol=o.pants;
 L.hair=her?(o.hair==='lang'?'lang':o.hair==='dutt'?'dutt':'pferd'):(o.hair==='kurz'?'kurz':'wuschel');if(her)L.hat=o.cap===false?null:'cap';if(her&&o.capCol&&o.cap!==false)L.hatCol=o.capCol;return L;}
function playerFig(){return FIGURES[(typeof G!=='undefined'&&G&&G.outfit&&G.outfit.body==='heldin')?'heldin':'held'];}

// ---------- Sprüche ----------
const FIG_LINESIT=new Map();for(const id in FIGURES)for(const s of FIG_SITS)for(const l of FIGURES[id].lines[s]||[])FIG_LINESIT.set(l,s);
function figMonName(id){const F=FIGURES[id];if(!F)return'';let s=F.partner;if((id==='rayan'||id==='mira')&&typeof G!=='undefined'&&G&&G.rivals&&G.rivals[id]&&G.rivals[id].starter)s=G.rivals[id].starter;
 if(F.nick&&s===F.partner)return F.nick;return MONS[s]?MONS[s].n:'';}
function figFmt(t,id){t=String(t||'');const g=typeof G!=='undefined'&&G,lead=g&&g.team&&g.team[0];
 return t.replace(/\{name\}/g,(g&&g.name)||'du').replace(/\{partner\}/g,lead?(lead.nickname||(MONS[lead.s]&&MONS[lead.s].n)):'Partner').replace(/\{mon\}/g,figMonName(id)||'Partner')
  .replace(/\{rayan\}/g,FIGURES.rayan.n).replace(/\{mira\}/g,FIGURES.mira.n);}
// figLine(id, situation[, i]) → formatierter Satz (zufällig, wenn i fehlt) · figSay(id, situation) → 'Name: Satz' für say() · figLines(id, situation) → alle
function figLine(id,sit,i){const F=FIGURES[id];if(!F)return'';const L=F.lines[sit]||F.lines.alltag;const k=i==null?Math.floor(Math.random()*L.length):((i%L.length)+L.length)%L.length;return figFmt(L[k],id);}
function figLines(id,sit){const F=FIGURES[id];return F?(F.lines[sit]||[]).map(l=>figFmt(l,id)):[];}
function figName(id,n){const F=FIGURES[id];if(!F)return'';if(F.player)return(typeof G!=='undefined'&&G&&G.name)||F.n;if(F.generic&&n&&n.name)return n.name;return F.n;}
function figSay(id,sit,i){return figName(id)+': '+figLine(id,sit,i);}
function figTalk(id,sits,cb){const L=[].concat(sits||['gruss','alltag']).map(s=>figSay(id,s));say(L,cb);figMeet(id);}
// Ausdruck für einen Text (Situation des Spruchs > Satzzeichen > neutral)
function figExprFor(text,sit){const t=String(text||'').replace(/^[^:\n]{2,30}: /,'');if(sit&&FIG_SIT_EXPR[sit])return FIG_SIT_EXPR[sit];
 for(const[l,s]of FIG_LINESIT)if(l===t||figFmt(l)===t)return FIG_SIT_EXPR[s];
 if(/^…|…$|\bHm\b|Vielleicht/.test(t))return'nachdenklich';if(/\b(Was\?|Wow|Oh!|Oh nein|Hoppla|Unmöglich)/.test(t))return'ueberrascht';if(/\b(Los|Kampf|Bereit|Pass auf)\b/.test(t))return'entschlossen';
 if(/!/.test(t))return'freudig';if(/\?/.test(t))return'neutral';if(/\b(Danke|lieb|schön|Willkommen)\b/i.test(t))return'laechelnd';return'neutral';}

// ---------- Teams ----------
function figEvolveAt(s,l){let g=0;while(MONS[s]&&MONS[s].ev&&MONS[s].ev.l&&MONS[s].ev.to&&l>=MONS[s].ev.l&&g++<4)s=MONS[s].ev.to;return s;}
// figTeam(id,{lv, stufe}) → [[Art,Level],…] (Kopie). lv = Ziel-Level der stärksten Kreatur (Arena-Reihenfolge frei wählbar); stufe = Begegnung (teams[stufe])
function figTeam(id,o){o=o||{};const F=FIGURES[id];if(!F)return[];if(id==='rayan'||id==='mira')return rivalTeam(id,o.stufe||0);let T=(F.teams&&o.stufe&&F.teams[o.stufe])||F.team;T=T.map(x=>[x[0],x[1]]);
 if(o.lv){const mx=Math.max(...T.map(x=>x[1]));T=T.map(([s,l])=>[s,Math.max(2,Math.min(100,l+o.lv-mx))]);}
 if(F.generic&&o.pick!==false&&F.pool){const n=o.n||T.length,p=F.pool;T=Array.from({length:n},(_,i)=>{const s=p[((o.seed|0)+i)%p.length],l=o.lv||T[0][1];return[figEvolveAt(s,l),l];});}
 return T;}
// Rivalen-Teams je Begegnung (stufe 0 = Intro/erster Kampf … 8 = Finale) – Starter aus G.rivals, wächst mit; Pool je Rivale
const RIVAL_LV=[5,9,14,19,24,29,34,40,46],RIVAL_N=[1,2,2,3,3,4,4,5,5];
function rivalTeam(rid,stufe){const F=FIGURES[rid];if(!F)return[];stufe=Math.max(0,Math.min(8,stufe|0));const lv=RIVAL_LV[stufe],n=RIVAL_N[stufe];
 const st=(typeof G!=='undefined'&&G&&G.rivals&&G.rivals[rid]&&G.rivals[rid].starter)||F.partner;
 const T=[[figEvolveAt(st,lv+2),lv+2]];for(const s of F.pool.slice(0,n-1))T.push([figEvolveAt(s,lv),lv]);return T;}
// Rivalen-Starter (Nutzer-Regel): Rayan nimmt das Element, das gegen den Spieler-Starter stark ist; Mira das, gegen das der Spieler stark ist.
function rivalStartersFig(p){const S=typeof STARTERS!=='undefined'?STARTERS:[1,4,7],t=s=>MONS[s].t[0],eff=(a,d)=>(TYPE_CHART[a]&&TYPE_CHART[a][d])??1;
 const rest=S.filter(x=>x!==p);if(!MONS[p]||rest.length<2)return _rivalStarters34(p);
 const strong=rest.find(s=>eff(t(s),t(p))>1)||rest[0],weak=rest.find(s=>s!==strong);return{rayan:{starter:strong},mira:{starter:weak}};}
// Neue Starterwahl (Labor oder Intro) nutzt die Element-Regel; alte Spielstände behalten ihre Zuordnung (ensureRivals in 21)
// 37-species-data umhüllt caught später und ruft danach rivalStarters(s): die erste Starterwahl wird hier vorgemerkt, rivalStarters liefert dafür die Element-Regel
let FIG_PICK=0;const _caught34=caught;caught=function(s){if(typeof G!=='undefined'&&G&&G.flags&&!G.flags.starter&&!G.starter&&typeof STARTERS!=='undefined'&&STARTERS.includes(s))FIG_PICK=s;
 const r=_caught34.apply(this,arguments);if(FIG_PICK===s&&G.starter===s){FIG_PICK=0;G.rivals=rivalStartersFig(s);}return r;};
const _rivalStarters34=rivalStarters;rivalStarters=function(p){if(FIG_PICK&&FIG_PICK===p){FIG_PICK=0;return rivalStartersFig(p);}return _rivalStarters34(p);};

// ---------- Begegnungen merken (G.figs, Migration in 21-species.js migrateFigures) ----------
function figMeet(id){if(typeof G==='undefined'||!G||!FIGURES[id])return;G.figs=G.figs||{met:{},bond:{}};G.figs.met=G.figs.met||{};if(!G.figs.met[id])G.figs.met[id]=1;}
function figMet(id){return!!(typeof G!=='undefined'&&G&&G.figs&&G.figs.met&&G.figs.met[id]);}
function figBond(id,n){if(typeof G==='undefined'||!G)return 0;G.figs=G.figs||{met:{},bond:{}};G.figs.bond=G.figs.bond||{};G.figs.bond[id]=Math.max(0,Math.min(100,(G.figs.bond[id]|0)+(n|0)));return G.figs.bond[id];}

// ---------- NPC-Bausteine für Karten (B2/C/D) ----------
// figNpc('kael',{x,y,d,flag,t}) → NPC-Objekt; Sprüche wechseln bei jedem Ansprechen (pre/post/txt als Getter, solange nicht selbst gesetzt)
function figNpc(id,o){const F=FIGURES[id];if(!F)return null;o=o||{};const name=o.name||(F.generic?F.n+' '+(F.names?F.names[(o.seed|0)%F.names.length]:''):((F.tag?F.tag+' ':'')+F.n)).trim();
 const n=Object.assign({c:F.look.top,t:F.team.length&&o.t!=='talk'?'trainer':'talk',d:'down',name,fig:id},o);if(n.t==='trainer'&&!n.team)n.team=figTeam(id,{lv:o.lv,stufe:o.stufe});figBindNpc(n);return n;}
function figBindNpc(n){if(!n||n._figBound||!figIdOf(n))return n;const id=figIdOf(n),nm=()=>n.name||figName(id,n);n._figBound=1;
 const def=(k,fn)=>{if(Object.prototype.hasOwnProperty.call(n,k)&&n[k]!=null)return;Object.defineProperty(n,k,{get:fn,set(v){Object.defineProperty(n,k,{value:v,writable:true,configurable:true,enumerable:true});},configurable:true,enumerable:false});};
 if(n.t==='trainer'){def('pre',()=>nm()+': '+figLine(id,'kampf'));def('post',()=>nm()+': '+figLine(id,'niederlage'));}
 if(n.t==='talk'&&!n.prof)def('txt',()=>[nm()+': '+figLine(id,figMet(id)?'alltag':'gruss')]);
 if(!n.c)n.c=FIGURES[id].look.top;return n;}
function figBindNpcs(mapId){try{const L=typeof NPCS!=='undefined'&&NPCS[mapId];if(L)for(const n of L)if(n&&(n.fig||n.name)&&!n._figBound&&figIdOf(n))figBindNpc(n);}catch(e){}}
const _loadMap34=loadMap;loadMap=function(id){figBindNpcs(id);return _loadMap34.apply(this,arguments);};
// Ansprechen merkt die Begegnung
const _talk34=talk;talk=function(n){try{const id=n&&figIdOf(n);if(id)figMeet(id);}catch(e){}return _talk34.apply(this,arguments);};

// ---------- Porträts: Bilder (ART_SRC['<art>_face_<ausdruck>']) oder prozedural ----------
const FIG_IMG={};
function figArtKeys(id){const F=FIGURES[id],S=window.ART_SRC||{};if(!F||!F.art)return[];const p=F.art+'_face_';return Object.keys(S).filter(k=>k.indexOf(p)===0).map(k=>k.slice(p.length));}
function figHasArt(id){const F=FIGURES[id];return figArtKeys(id).some(e=>{const im=FIG_IMG[F.art+'_face_'+e];return!(im&&im._bad);});}
function figFaceKey(id,expr){const have=figArtKeys(id);if(!have.length)return null;for(const e of FIG_EXPR_FALLBACK[expr]||[expr,'neutral'])if(have.includes(e))return FIGURES[id].art+'_face_'+e;return FIGURES[id].art+'_face_'+have[0];}
// figFaceImg(id, expr, onload) → geladenes Image oder null (lädt im Hintergrund, ruft onload einmal)
function figFaceImg(id,expr,onload){const k=figFaceKey(id,expr);if(!k)return null;let im=FIG_IMG[k];
 if(!im){im=FIG_IMG[k]=new Image();im.decoding='async';im._cb=[];im.onload=()=>{const cb=im._cb;im._cb=[];cb.forEach(f=>{try{f();}catch(e){}});};im.onerror=()=>{im._bad=1;im._cb=[];};im.src=window.ART_SRC[k];}
 if(im._bad)return null;if(im.complete&&im.naturalWidth)return im;if(onload)im._cb.push(onload);return null;}
// Porträt in quadratische Fläche zeichnen (Kreis-Clip macht der Aufrufer)
function figPortrait(c,id,W,expr,o){o=o||{};const F=FIGURES[id];if(!F)return false;const im=!o.proc&&figFaceImg(id,expr,o.onload);
 if(im){const s=Math.min(im.naturalWidth,im.naturalHeight),z=o.zoom||1.06;c.drawImage(im,(im.naturalWidth-s)/2+s*(1-1/z)/2,(im.naturalHeight-s)/2+s*(1-1/z)*.25,s/z,s/z,0,0,W,W);return true;}
 const L=F.player?heroLook(typeof G!=='undefined'&&G?G.outfit:null):F.look;drawFigPortrait(c,L,W,o.t||1000,expr,o.talk);return true;}
// Dialog-/Ruf-Porträt (15-ui ruft drawFace) – Figuren bekommen Bild oder Anime-Kopf mit Ausdruck
const _drawFace34=drawFace;drawFace=function(cv,name,n){const F=(n&&figIdOf(n)&&FIGURES[figIdOf(n)])||figByName(name);if(!F)return _drawFace34(cv,name,n);
 const c=cv.getContext('2d'),W=cv.width,ex=cv._expr||'neutral',who=F.id+'|'+ex;cv._fw=who;c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(W/2,W/2,W/2,0,7);c.clip();
 const tint=F.look.sig||F.look.emblemCol||F.look.top||'#dfe6ee',g=c.createLinearGradient(0,0,0,W);g.addColorStop(0,'#ffffff');g.addColorStop(1,figLerp('#e8edf3',tint,.28));c.fillStyle=g;c.fillRect(0,0,W,W);
 figPortrait(c,F.id,W,ex,{onload:()=>{if(cv._fw===who)drawFace(cv,name,n);}});c.restore();};
const _setDlg34=setDlg;setDlg=function(s){_setDlg34(s);try{const fc=$('#dlgFace'),nm=$('#dlgName');if(!fc||nm.hidden)return;const name=nm.textContent.trim(),n=DLG.cur,F=(n&&figIdOf(n)&&FIGURES[figIdOf(n)])||figByName(name);if(!F)return;
 const ex=(n&&n.expr)||figExprFor(rivalize(String(s)));if(fc._expr!==ex||fc._fn!==name){fc._expr=ex;fc._fn=name;drawFace(fc,name,n);}}catch(e){}};

// ---------- 3D: Figuren-NPCs mit ihrem Aussehen (person3d aus 09 mit Outfit-Feldern) ----------
function figOutfit3d(L){const hs={pferd:'zopf',zopf:'zopf',geflochten:'zopf',lang:'lang',dutt:'dutt',wuschel:'wuschel',wild:'wuschel',stachel:'wuschel',wolke:'wuschel',schopf:'wuschel'}[L.hair]||'kurz',H=figHats(L);
 return{skin:L.skin||'#f3cfae',pants:L.legs==='robe'||L.legs==='rock'?(L.legCol||'#26304a'):(L.legCol||'#26304a'),hairCol:L.hairCol||'#5a3a24',hair:hs,cap:H.includes('cap')||H.includes('federhut')||H.includes('kapuze'),
  capCol:H.includes('kapuze')?(L.hoodCol||L.coatCol||'#3a3446'):(L.hatCol||'#3d8fe0'),top:L.coat==='mantel'||L.coat==='kittel'?(L.coatCol||L.top):(L.top||'#4c9a5c'),look:L};}// look: voller Figurenbaukasten (38-models charGeo)
if(typeof build3d==='function'){const _build3d34=build3d;build3d=function(){const S=_build3d34.apply(this,arguments);try{for(const e of(S&&S.userData&&S.userData.npcs)||[]){const L=figLookOf(e.n);if(!L||e.n.t==='item'||e.n.t==='sign'||e.n.t==='legend'||e.n.t==='starter')continue;
  const oe=figOutfit3d(L),o=person3d(oe.top,oe.capCol,oe);o.position.copy(e.o.position);o.rotation.copy(e.o.rotation);o.userData=Object.assign({},e.o.userData,o.userData);S.remove(e.o);S.add(o);e.o=o;}}catch(err){}return S;};}

// ---------- Oberfläche: Stil für Intro-Panels (Präfix fg-, eigene Klassen) ----------
(function(){if(typeof document==='undefined'||!document.head||!document.createElement)return;try{const st=document.createElement('style');st.id='fg-style';st.textContent=`
.fgIntro .sqName{transition:background .25s}
.fgIntro .sqBox p{min-height:2.9em;max-height:2.95em;overflow:hidden}
.ccPanel.fgCC{max-height:62%}
.fgCC .fgBody{display:flex;gap:10px;flex:1}.fgCC .fgBody button{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;border:0;border-radius:18px;padding:6px 6px 8px;background:var(--ui2);color:var(--fg);font:700 14px var(--fd);min-height:48px;box-shadow:inset 0 0 0 2px transparent;transition:transform .2s,box-shadow .2s}
.fgCC .fgBody button canvas{width:74px;height:74px;border-radius:50%;background:linear-gradient(180deg,#fff,#e6edf4)}
.fgCC .fgBody button.on{box-shadow:inset 0 0 0 3px var(--sig);background:var(--sig-soft,#fde6f0);transform:scale(1.03)}
.fgPick{position:absolute;left:0;right:0;top:max(12px,env(safe-area-inset-top,0px));display:flex;flex-direction:column;align-items:center;gap:8px;z-index:3;pointer-events:none}
.fgPick .asRow{display:flex;gap:10px;justify-content:center}.fgPick .asCard{opacity:.9}.fgPick .asCard.on{opacity:1}
.fgPick .fgGo{pointer-events:auto;border:0;border-radius:999px;min-height:48px;padding:0 22px;font:700 16px var(--fd);color:#fff;background:linear-gradient(135deg,var(--sig-2,#ec3a8a),var(--sig,#d81b72));box-shadow:0 8px 20px -8px var(--sig-glow,rgba(255,92,168,.55))}
.fgPick .fgGo[disabled]{opacity:.45}.fgPick .asHead{margin:0;padding:5px 14px;border-radius:999px;background:rgba(255,255,255,.9);color:var(--fg);font:700 15px var(--fd)}
.fgPick.taken .asCard:not(.on){opacity:.35;transform:scale(.86)}.fgPick .asCard .fgWho{position:absolute;top:-9px;left:50%;transform:translateX(-50%);padding:1px 9px;border-radius:999px;font:700 11px var(--fd);color:#fff;background:var(--wc,#333);white-space:nowrap}
.fgGifts{position:absolute;left:0;right:0;top:max(14px,env(safe-area-inset-top,0px));display:flex;gap:12px;justify-content:center;z-index:3;pointer-events:none}
.fgGift{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 14px 10px;border-radius:20px;background:rgba(255,255,255,.92);color:var(--fg);font:700 14px var(--fd);box-shadow:var(--sh-2,0 8px 22px -10px rgba(20,30,50,.38));animation:fgPop .45s cubic-bezier(.34,1.56,.64,1) both}
.fgGift canvas{width:84px;height:84px}.fgGift small{font:600 11px var(--fd);color:var(--mute)}
@keyframes fgPop{from{opacity:0;transform:translateY(-16px) scale(.7)}to{opacity:1;transform:none}}
@media (orientation:landscape){.ccPanel.fgCC{left:auto;top:0;bottom:0;width:min(52%,500px);max-height:none;border-radius:26px 0 0 26px;padding:14px 16px}.fgPick{left:0;right:0}}
@media (orientation:landscape) and (max-height:500px){.fgPick .asCard{width:92px}.fgPick .asHead{display:none}.fgGift canvas{width:64px;height:64px}.fgCC .fgBody button canvas{width:56px;height:56px}.ccPanel.fgCC h2{font-size:16px;margin:0 0 2px}}
@media (prefers-reduced-motion:reduce){.fgGift{animation:none}}`;document.head.appendChild(st);}catch(e){}})();
