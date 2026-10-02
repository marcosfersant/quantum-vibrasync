import {compile} from '../engine.mjs';
import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
for(const name of ['index.html','app.js','engine.mjs','conversions.mjs','search-worker.js','data'])fs.cpSync(name,'dist/'+name,{recursive:true});
console.log('Arquivos estáticos preparados em dist/');

// Reclassify only the published index; original bank and translations remain intact.
const normalizarNomeBanco=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function qvFinalidadeClinica(p){
  var s=normalizarNomeBanco([p.n,p.pt].join(' '));
  var regras=[
    [/encephalitis.*herpes simplex|encefalite.*herpes simples/,'Encefalite por herpes simples'],
    [/neonatal meningitis.*escherichia coli|meningite neonatal.*escherichia coli/,'Meningite neonatal por Escherichia coli'],
    [/pneumonia.*mycoplasma|pneumonia.*micoplasma/,'Pneumonia por Mycoplasma'],
    [/sinusitis.*fung|sinusite.*fung/,'Sinusite fúngica'],[/rhinitis.*allerg|rinite.*alerg/,'Rinite alérgica'],
    [/hernia de hiato|hernia hiatal|hiatal hernia/,'Hérnia de hiato'],[/hernia de disco|disc herniated|disk herniated|diskal hernia|herniated disc|herniated disk|prolapsed disk|slipped disk/,'Hérnia de disco'],[/vasculit/,'Vasculite'],
    [/^candida\b|candida albicans|candidiase|candida infection/,'Candidíase'],[/aspergillus|aspergilose/,'Aspergilose'],[/cryptococcus|criptococose/,'Criptococose'],[/histoplasma|histoplasmose/,'Histoplasmose'],
    [/paracoccidioides|paracoccidioidomicose/,'Paracoccidioidomicose'],[/coccidioides|coccidioidomicose/,'Coccidioidomicose'],[/sporothrix|esporotricose/,'Esporotricose'],
    [/trichophyton|microsporum|epidermophyton|dermatofitose/,'Dermatofitose (micose de pele)'],[/malassezia/,'Infecção por Malassezia'],[/fusarium/,'Fusariose'],[/mucor\b|rhizopus|mucormicose/,'Mucormicose'],
    [/ascaris lumbricoides|ascaridiase/,'Ascaridíase (lombriga)'],[/taenia solium|taenia saginata|teniase/,'Teníase'],[/giardia lamblia|giardiase/,'Giardíase'],
    [/schistosoma|esquistossomose/,'Esquistossomose'],[/toxoplasma gondii|toxoplasmose/,'Toxoplasmose'],[/enterobius vermicularis|enterobiase/,'Enterobíase (oxiurose)'],
    [/trichuris trichiura|tricuriase/,'Tricuríase'],[/strongyloides stercoralis|estrongiloidiase/,'Estrongiloidíase'],[/ancylostoma|necator americanus|ancilostomiase/,'Ancilostomíase'],
    [/fasciola hepatica|fasciolose/,'Fasciolose'],[/fasciolopsis buski|fasciolopsiase/,'Fasciolopsíase'],[/echinococcus|equinococose/,'Equinococose'],[/dirofilaria|dirofilariose/,'Dirofilariose'],
    [/entamoeba histolytica|amebiase/,'Amebíase'],[/leishmania|leishmaniose/,'Leishmaniose'],[/trypanosoma cruzi|chagas/,'Doença de Chagas'],
    [/mycobacterium tuberculosis|tuberculose/,'Tuberculose'],[/helicobacter pylori/,'Infecção por Helicobacter pylori'],[/salmonella/,'Salmonelose'],
    [/staphylococcus|staphylococc/,'Infecção estafilocócica'],[/streptococcus|streptococc/,'Infecção estreptocócica'],[/escherichia coli/,'Infecção por Escherichia coli'],
    [/klebsiella/,'Infecção por Klebsiella'],[/pseudomonas/,'Infecção por Pseudomonas'],[/clostridium difficile|clostridioides difficile/,'Infecção por Clostridioides difficile'],
    [/borrelia burgdorferi|lyme/,'Doença de Lyme'],[/bartonella/,'Bartonelose'],[/campylobacter/,'Campilobacteriose'],[/chlamydia trachomatis/,'Infecção por Chlamydia trachomatis'],
    [/h5n1|avian influenza|bird influenza|bird flu|gripe aviaria/,'Gripe aviária H5N1'],[/h1n1|swine influenza|swine flu|gripe suina/,'Gripe suína H1N1'],
    [/\binfluenza a\b/,'Influenza A'],[/\binfluenza b\b/,'Influenza B'],[/\binfluenza c\b/,'Influenza C'],[/\binfluenza\b|gripe/,'Gripe'],[/herpes zoster|varicella zoster/,'Herpes-zóster'],[/herpes simplex/,'Herpes simples'],[/papilloma|papiloma|hpv\b/,'Infecção por HPV'],
    [/hepatitis a|hepatite a/,'Hepatite A'],[/hepatitis b|hepatite b/,'Hepatite B'],[/hepatitis c|hepatite c/,'Hepatite C'],[/coronavirus|covid/,'Infecção por coronavírus'],
    [/rotavirus/,'Gastroenterite por rotavírus'],[/norovirus/,'Gastroenterite por norovírus'],[/dengue/,'Dengue'],[/zika/,'Infecção pelo vírus Zika'],[/measles|sarampo/,'Sarampo'],
    [/mumps|caxumba/,'Caxumba'],[/rabies|raiva/,'Raiva'],[/coxsackie/,'Infecção por vírus Coxsackie'],[/epstein barr/,'Infecção pelo vírus Epstein-Barr'],[/cytomegalovirus|citomegalovirus/,'Citomegalovirose']
  ];
  for(var i=0;i<regras.length;i++)if(regras[i][0].test(s))return regras[i][1];
  return '';
}
function qvProgramaTemFinalidadePublica(p){
  if(!p)return false;
  if(!p._qvFonteTecnica)return p.categoria!=='interno';
  if(p.finalidade)return true;
  var s=normalizarNomeBanco([p.n,p.pt,p.base].join(' '));
  // Uma referência de laboratório só vai para as pastas clínicas quando o
  // próprio nome descreve doença, sintoma ou finalidade. Espécies e enzimas
  // isoladas continuam acessíveis no Índice completo A–Z.
  return /disease|doenca|syndrome|sindrome|cancer|tumor|carcinom|sarcom|leucem|leukem|melanom|neoplas|lymphom|linfom|myelom|mieloma|pain|\bdor\b|fever|febre|diabet|hypertens|hipertens|hypotens|hipotens|arrhythm|arritm|arthritis|artrit|infection|infeccao|inflamma|inflama|abscess|abscesso|rhinitis|rinite|sinusitis|sinusite|bronchitis|bronquite|pneumonia|asthma|asma|hepatitis|hepatite|gastritis|gastrite|colitis|colite|cystitis|cistite|dermatitis|dermatite|neuropathy|neuropatia|neuralgia|migraine|enxaqueca|seizure|convuls|paralysis|paralis|insufficiency|insuficiencia|failure|falencia|deficiency|deficiencia|disorder|disturbio|malformation|malformacao|anemia|anaemia|bleeding|sangramento|edema|ulcer|ulcera|wound|ferida|toxic|toxicity|toxico|toxicidade/.test(s);
}
const codes=new Map(), requirements=new Map(), originals=new Map();
for(const f of fs.readdirSync('data').filter(f=>/^parte-.*\.json$/.test(f)))for(const row of JSON.parse(fs.readFileSync('data/'+f))){const plan=compile(row);codes.set(row[0],plan.code);requirements.set(row[0],plan.reasons||[]);originals.set(row[0],row);}
const index=JSON.parse(fs.readFileSync('data/indice.json'));
for(const row of index){
 row[4]=codes.get(row[0]);
 // Independent flags retain both hardware and interpretation requirements.
 const reasons=requirements.get(row[0]);
 row[8]=reasons.some(r=>r.code==='external');
 row[9]=reasons.some(r=>r.code!=='external');
 const original=originals.get(row[0]);
 const p={n:original[1],pt:row[1],base:row[1],_qvFonteTecnica:/\bDNAE\b/i.test(original[2])||/^DNA_/i.test(original[8])||/^(RRMD|MWE)$/i.test(original[2])||/MW_Frequencies/i.test(original[8])};
 p.finalidade=qvFinalidadeClinica(p);
 row[7]=qvProgramaTemFinalidadePublica(p);
 // Thyroid membership is additive: retain reviewed organ and hormone folders.
 // Do not mistake fungal Parathyridaria names or thoracic vertebrae T3/T4 for thyroid.
 const thyroid=/thyroid|tireoid|thyroxin|tiroxin|triiodothy|triiodotir|liothyron|thyrotrop|tireotrop|\bgraves\b|\bbasedow\b|hashimoto|\bgoit(?:er|re)\b|\bbocio\b|\bcretinism|\bcretinismo|\bmyxedema\b|\bmixedema\b/.test(normalizarNomeBanco(p.n+' '+p.pt));
 if(thyroid){
  row[6]=[...new Set([...(row[6]||[]),'tireoide'])];
  row[7]=true;
  if(/thyroxin|tiroxin|triiodothy|triiodotir|liothyron|thyrotrop|tireotrop|hormon|\btsh\b/.test(normalizarNomeBanco(p.n+' '+p.pt)))row[6]=[...new Set([...row[6],'hormonal'])];
 }

}
// Recovered V5 memberships are prepared offline, never recalculated in the browser.
const recovery=JSON.parse(fs.readFileSync('recuperacao-traducoes/v5-organizacao.json'));
const byId=new Map(index.map(r=>[r[0],r]));
for(const [id,areas,name,visible] of recovery.additions){
 const row=byId.get(id);if(!row)throw Error('ID V5 ausente: '+id);
 row[6]=[...new Set([...row[6],...areas])];
 if(name&&row[1]===originals.get(id)[1])row[1]=name;
 if(visible)row[7]=true;
}
// Confirmed translation mismatch: both source variants belong to one named group.
for(const id of [71160,71161])byId.get(id)[1]='Cistos de Balantidium coli';
fs.writeFileSync('dist/data/indice.json',JSON.stringify(index));
console.log('Classificação de saída:',index.reduce((a,r)=>(a[r[4]]=(a[r[4]]||0)+1,a),{}));
