# Classificação por etapas — motor 2.4-corrected

Esta revisão substitui a classificação global descrita em motor-comandos-2026-10-01.md. A conversão fundamental documentada continua disponível como referência, mas não prova equivalência a um preset V7. Nenhum preset específico V7 foi recuperado e confirmado.

O banco original de 90.893 programas permanece intacto. O parser mantém comandos, letras, ordem, repetições e durações. A classificação é derivada por etapa, separando cálculo, preset e capacidade de saída. Não usa parseFloat para descartar sufixos, não converte erros em zero, não arredonda os valores usados pelo oscilador e não aplica divisor harmônico presumido.

Resultado medido no banco:

| Classificação | Programas |
| --- | ---: |
| Totalmente compatíveis com a faixa nominal | 4.542 |
| Mistos / parciais | 5.092 |
| Externos exclusivos com exigência identificada | 2.008 |
| Configuração pendente | 79.251 |
| Total | 90.893 |

Os 79.251 pendentes não são classificados como inaudíveis. Comandos que dependem de preset não confirmado conservam o cálculo fundamental apenas como referência, com frequência de saída nula até confirmação. As contagens ilustrativas de 82.000 mistos e o nome Spooky2_V7_Adaptado não foram adotados como evidência.

Faixa operacional nominal: 20 a 20.000 Hz, inclusive; não garante que qualquer pessoa ou equipamento reproduza ou ouça todos esses valores. O player verifica também a taxa de amostragem. Zero continua pausa programada. Saída simultânea, tensão e modalidades físicas continuam restritas; não há integração física de Box.

Programas mistos abrem a matriz de etapas. O player executa a parte compatível e interrompe na primeira etapa restrita, sem aguardar silenciosamente sua duração. Para continuar, o usuário precisa escolher pular aquela etapa e confirmar execução parcial. A etapa permanece no banco e no histórico da execução; a conclusão informa que o programa completo não foi executado. RRMD simultâneo não é convertido indevidamente em sequência parcial.

Verificação: integridade do banco, parsing, fórmulas com preset sintético explicitamente identificado, fronteiras de faixa, comandos desconhecidos, pausas, varreduras, bloqueio por etapa, continuação parcial, taxa de amostragem, traduções e classificação do índice. Testes de navegador cobrem busca durante carregamento, abertura dos programas, avisos, controles, continuação parcial e sinal de 440 Hz sem ruído.

O build publica data/status-motor.json com estatísticas calculadas e exemplos identificados como real ou ilustrativo. Configurar os presets V7 reais continua pendente; esta revisão não afirma que todos os programas estão executáveis.
