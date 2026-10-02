import {compile} from '../engine.mjs';
export function programReport(row){
 const plan=compile(row),s=plan.summary;
 return {id:row[0],nome:row[1],classificacao_global:{audio:'AUDIO_TOTAL',mixed:'AUDIO_PARCIAL',external:'EXTERNO_EXCLUSIVO',pending:'PENDENTE_VALIDACAO'}[plan.code],estatisticas_etapas:{total:plan.steps.length,compativeis_web:s.audio,pausas_programadas:s.rest,restritas_hardware:s.external,configuracao_pendente:s.pending},etapas:plan.steps.map(e=>({etapa:e.etapa,comandoOriginal:e.comandoOriginal,frequenciaGerada:e.frequenciaGerada,frequenciaFinalVarredura:e.endHz,duracaoSegundos:e.seconds,statusExecucao:e.statusExecucao,observacao:e.observacao}))};
}
export function engineReport(index,originals){
 const counts=index.reduce((a,r)=>(a[r[4]]++,a),{audio:0,mixed:0,external:0,pending:0});
 if(Object.values(counts).reduce((a,b)=>a+b,0)!==90893)throw Error('Contagem do relatório não corresponde ao banco original');
 return {motor:'Quantum VibraSync Engine',versao:'2.8-partial-loop',status_global:'PROCESSADO_POR_ETAPAS',estatisticas:{total_programas_base:index.length,total_audiencia_total:counts.audio,total_mistos_parciais:counts.mixed,total_externo_exclusivo:counts.external,total_configuracao_pendente:counts.pending},configuracao_presets:{padrao_utilizado:'documented-fundamental',preset_especifico_obrigatorio:false,conversoes_sem_preset:'Cálculo fundamental e validação direta por etapa, sem transposição',faixa_nominal_audio_hz:{min:20,max:20000,inclusiva:true},audibilidade_garantida:false,limite_adicional:'Frequência deve ficar abaixo de metade da taxa de amostragem da saída'},politica_execucao:'Executa somente etapas originais compatíveis; etapas restritas ficam inativas e não consomem tempo de reprodução. Execução parcial identificada; comandos preservados.',exemplo_programa_real:programReport(originals.get(69270)),exemplo_ilustrativo:programReport(['PRG_EXEMPLO_001','Exemplo ilustrativo fornecido pelo usuário','',[],'0.15,432.00,528.00',0,180,1])};
}
