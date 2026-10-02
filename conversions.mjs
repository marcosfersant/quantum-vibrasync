// Documented fundamental-frequency profile. No octave folding or audio substitution.
// Genome: John White, Derivation of Genome Frequencies Rev.2 (2022-03-29), p.4.
// MW: Spooky2 User's Guide 2025-01-24, p.142. Raw command and profile travel with the plan.
export const CONVERSION_PROFILE=Object.freeze({
 id:'genome-20220329-mw-20250124-fundamental',
 dna:1.55518226281848e17,rna:1.61853600781306e17,mrna:1.50677502217234e17,
 molecularWeight:2.2523430883e23,lightSpeed:299792458,
 harmonicDivisor:1,inhibitFactor:1
});
// Only elements needed by the formula present in this immutable bank; reject others.
// NIST isotopic compositions: 12C, 1H, 16O, not average atomic weights.
const MONOISOTOPIC=Object.freeze({C:12,H:1.00782503223,O:15.99491461957});
export function formulaMass(formula){
 const token=/([A-Z][a-z]?)(\d*)/gy;let at=0,mass=0;
 while(at<formula.length){token.lastIndex=at;const m=token.exec(formula);
  if(!m||!Object.hasOwn(MONOISOTOPIC,m[1]))throw Error('Fórmula ou elemento não suportado: '+formula);
  const count=m[2]===''?1:Number(m[2]);if(!Number.isSafeInteger(count)||count<=0)throw Error('Quantidade atômica inválida');
  mass+=MONOISOTOPIC[m[1]]*count;at=token.lastIndex;
 }
 if(!Number.isFinite(mass)||mass<=0)throw Error('Massa inválida');return mass;
}
export function convertTarget(p,profile=CONVERSION_PROFILE){
 if(p.prefix==='Hz')return {hz:p.value,endHz:p.end,conversion:null};
 let hz,kind,effectiveBases,mass;
 if(p.prefix==='M'||p.prefix==='formula'){
  mass=p.prefix==='formula'?formulaMass(p.value):p.value;
  if(!(mass>0))throw Error('Massa deve ser positiva');
  hz=mass*profile.molecularWeight;kind='molecularWeight';
 }else if(p.prefix==='L'){
  if(!(p.value>0))throw Error('Comprimento de onda deve ser positivo');
  hz=profile.lightSpeed/(p.value*1e-9);kind='wavelength';
 }else if(['B','BL','BC','BLR','BCR','BLm','BCm'].includes(p.prefix)){
  if(!Number.isSafeInteger(p.value)||p.value<=0)throw Error('Contagem de bases inválida');
  // B is the legacy linear alias (French guide Sep 2024, pp.207–208).
  effectiveBases=p.value-(p.prefix.startsWith('BC')?0:1);
  if(effectiveBases<=0)throw Error('Genoma linear precisa de pelo menos duas bases');
  kind=p.prefix.endsWith('R')?'rna':p.prefix.endsWith('m')?'mrna':'dna';
  hz=profile[kind]/effectiveBases;
 }else throw Error('Conversão desconhecida: '+p.prefix);
 if(!Number.isFinite(hz)||hz<=0)throw Error('Resultado de conversão inválido');
 return {hz,endHz:hz,conversion:{command:p.raw,kind,profile:profile.id,effectiveBases,mass,fundamentalHz:hz,harmonicDivisor:1}};
}
