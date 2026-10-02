import {CONVERSION_PROFILE,convertTarget} from './conversions.mjs';
// Only mappings with an identified and validated execution preset belong here.
// No old V7 preset has been recovered yet; an empty mapping is intentional.
export const PROGRAM_PRESETS=Object.freeze({});
export function resolvePreset(row,override){
 const specific=override??PROGRAM_PRESETS[row[0]];
 if(!specific)return {id:'base-reference',confirmed:false,conversion:CONVERSION_PROFILE,frequencyFactor:1,constantHz:0,harmonicDivisor:1,source:'Base documental; preset específico não confirmado'};
 const preset={conversion:CONVERSION_PROFILE,frequencyFactor:1,constantHz:0,harmonicDivisor:1,...specific};
 if(!preset.id||!preset.source||preset.confirmed!==true)throw Error('Preset sem identificação, fonte ou confirmação');
 for(const k of ['frequencyFactor','constantHz','harmonicDivisor'])if(!Number.isFinite(preset[k]))throw Error('Parâmetro de preset inválido: '+k);
 if(preset.frequencyFactor<=0||preset.harmonicDivisor<=0)throw Error('Fator e divisor do preset devem ser positivos');
 return preset;
}
export function applyPreset(command,preset){
 const base=convertTarget(command,preset.conversion);
 const transform=hz=>hz*preset.frequencyFactor/preset.harmonicDivisor+preset.constantHz;
 const hz=transform(base.hz),endHz=transform(base.endHz);
 if(!Number.isFinite(hz)||!Number.isFinite(endHz)||hz<0||endHz<0)throw Error('Resultado inválido do preset');
 // Rest commands are never turned into tones by an offset or multiplier.
 const rest=command.prefix==='Hz'&&command.value===0&&command.end===0;
 const confirmed=command.prefix==='Hz'||preset.confirmed;
 return {...base,hz:rest?0:confirmed?hz:null,endHz:rest?0:confirmed?endHz:null,
  referenceHz:base.hz,referenceEndHz:base.endHz,rest,
  preset:{id:preset.id,confirmed,source:preset.source,frequencyFactor:preset.frequencyFactor,constantHz:preset.constantHz,harmonicDivisor:preset.harmonicDivisor}};
}
