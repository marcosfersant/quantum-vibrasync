# Motor dos comandos presentes no banco — 01/10/2026

## Mudança entregue

O motor anterior identificava as letras, mas descartava suas etapas executáveis e marcava conversão pendente. Agora converte 129.993 comandos em 68.574 programas para valores fundamentais calculados, preservando o texto original, ordem, repetições, duração e perfil de cálculo. Não há redução de oitavas para encaixar as frequências no áudio.

O plano contém também os parâmetros W1 (onda), G0 (gating desligado) e A20 (tensão de 20 Vpp) do único registro com essas diretivas, ID 82693. Tensão em volts é uma exigência de saída externa, nunca uma conversão para a barra de volume do navegador.

Todos os 10.679 registros RRMD do arquivo Frequencies.s2d têm a instrução de execução simultânea em DatabaseText.txt. Seus planos agora iniciam as componentes no mesmo instante e usam 180 segundos, em vez de concatenar sete ou mais períodos. Os valores do banco não foram modificados. Este é um plano de execução; não há transmissão física de RRMD pelo navegador.

## Perfil explícito, sem afirmar recuperação de presets antigos

ID: `genome-20220329-mw-20250124-fundamental`.

O banco contém comandos, mas não fornece os presets completos da antiga V7. O código de conversão alegado no histórico não foi recuperado. Portanto, esta implementação usa um perfil documentado e testado; não afirma equivalência a configurações particulares da V7 ou a todos os presets Spooky2.

Para genomas, adotou-se a revisão 2 publicada pelo autor em 29/03/2022, também referenciada na atualização oficial de 2025. O manual inglês de janeiro/2025 mostra outros fatores numa captura de tela; esses valores não foram misturados com a tabela da revisão 2. Alterar o perfil exigirá nova validação, não mudanças silenciosas.

| Comando presente | Interpretação implementada |
| --- | --- |
| B / BL | DNA linear: fator DNA dividido por (bases − 1) |
| BC | DNA circular: fator DNA dividido pelas bases |
| BLR / BCR | RNA linear / circular, com o fator RNA |
| BLm / BCm | mRNA linear / circular, com o fator mRNA |
| M | Massa monoisotópica multiplicada pelo fator MW do manual |
| L | Comprimento de onda em nanômetros convertido por c/λ |
| [C47H72O14] | Soma das massas monoisotópicas C/H/O, seguida da conversão MW |
| = | Duração explícita em segundos |
| início-fim | Varredura entre os extremos originais |
| W1 G0 A20 | Onda senoidal, gating desligado e tensão de saída externa de 20 Vpp |

Fatores: DNA 1.55518226281848e17; RNA 1.61853600781306e17; mRNA 1.50677502217234e17; MW 2.2523430883e23. Não se aplica fator de inibição, preset presumido ou divisor harmônico. A massa da fórmula do banco é 860.49220699454.

A sintaxe de fórmulas foi implementada para C/H/O, os elementos da única fórmula deste banco. Outros elementos e diretivas ausentes do banco, como ondas definidas pelo usuário ou gating sem seus parâmetros, permanecem rejeitados explicitamente. Não se afirma suporte a toda a linguagem de todos os presets possíveis.

## Resultado verificável

- 90.893 programas conferidos, nenhuma etapa perdida e todos os resultados numéricos finitos.
- 68.574 programas antes pendentes agora possuem etapas convertidas.
- Zero pendências de interpretação para os comandos presentes neste banco fixo e sob o perfil acima.
- 4.537 programas aceitos para áudio pelo motor atual; sete deles são pausas intencionais.
- 86.356 programas exigem saída externa. Interpretar um comando não torna seu resultado audível.
- Box não está conectado nem implementado. A capacidade física de um futuro aparelho deve ser conferida contra o plano; não se presume que qualquer Box gere frequências ópticas, moleculares ou de genomas sem um projeto de saída e presets próprios.

[Valores e exemplos gerados pelo motor](../verificacoes/motor-comandos.json).

## Testes

`tests/conversions.mjs` compara DNA/RNA/mRNA aos exemplos numéricos publicados, confere massa por aritmética independente, M e L, alias B, contagem inválida, preservação de todas as etapas, temporização simultânea, tensão externa e bloqueio do navegador. Os testes não se limitam a conferir os rótulos do catálogo.

Também passaram: integridade SHA-256 do banco original, traduções recuperadas, limites de Box para todo o índice, navegação Chromium/Playwright, programas com seis e duas etapas, pausa/retomada e renderização digital de 440 Hz sem ruído branco. O teste de conversão integra o build do AWS Amplify.

A validação é de software e fórmulas documentadas, não um ensaio do Spooky2 lado a lado, de equipamentos externos ou de eficácia clínica.

## Fontes técnicas consultadas

1. John White, *Derivation of Genome Frequencies Rev.2*, 29/03/2022, pp.3–4: https://www.cancerclinic.co.nz/ewExternalFiles/Derivation%20Of%20DNA%20and%20RNA%20Frequencies%2020220329.pdf
2. Spooky2, lançamento 20220421, identificadores R/m e revisão dos fatores: https://www.spooky2.fr/spooky2-software-20220421-released/
3. Spooky2 User's Guide, 24/01/2025, pp.73–74 e 142: https://www.spooky2-mall.com/download/Spooky2_Users_Guide_20250124.pdf
4. Sébastien Mercier, guia francês setembro/2024, seção dos comandos (B e BL lineares): https://fr.scribd.com/document/852660741/Spooky2-Guide-de-l-utilisateur-septembre-2024 — a cópia no domínio francês estava indisponível na consulta.
5. Spooky2, atualização 20250910, referência à derivação Rev.2: https://www.spooky2-mall.com/blog/spooky2-software-update-version-20250910/
6. NIST, massas isotópicas: https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=H e https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=O ; carbono-12 = 12 por definição.
7. DatabaseText.txt fornecido no acervo original: 22.345 nomes do bloco Frequencies.s2d conferidos por posição; todos os 10.679 registros RRMD contêm a instrução de simultaneidade.
