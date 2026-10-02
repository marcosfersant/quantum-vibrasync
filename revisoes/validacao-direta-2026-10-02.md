# Validação direta por etapa — 2.7

Removida a exigência de preset confirmado: a lista de overrides pode ficar vazia e as conversões documentadas são calculadas normalmente. A marca confirmed, inclusive false, não bloqueia o fluxo. Parâmetros inválidos e comandos não suportados continuam sendo erros reais e explícitos.

B/BL/BC/BLR/BCR/BLm/BCm, massa molecular, comprimento de onda e fórmula química usam os cálculos existentes sem redução por oitavas. O resultado numérico fica disponível no plano, inclusive para etapas externas. A classificação usa os limites de frequência e exigências físicas por etapa. RRMD simultâneo é restrição de saída, não falta artificial de preset.

Resultado sobre 90.893 programas: 4.542 áudio completo, 5.092 mistos, 81.259 externos, zero pendentes no banco atual. Não significa suporte a toda sintaxe futura do Spooky2 nem equivalência a presets particulares antigos. As conversões fundamentais removidas da categoria pendente não se tornam audíveis automaticamente; mantêm seu valor calculado.

Etapas compatíveis dos programas mistos continuam operando, enquanto as demais ficam inativas sem tempo de espera. Nenhuma frequência é transposta, e a execução parcial não é apresentada como completa.

Validação local: integridade SHA-256 do banco, traduções, todas as conversões e classificações, funcionamento sem preset e com confirmed false, rejeição de parâmetros inválidos, preservação das etapas, player parcial, pausas e limites do dispositivo. Zero pendentes é resultado da análise do banco atual, não um valor forçado na classificação.
