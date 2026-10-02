# Interpretação e execução explícita por oitavas — 2.5

## Entrega

O motor agora tem um perfil selecionável `quantum-converted-octaves-20k`: interpreta B/BL/BC/BLR/BCR/BLm/BCm, M, L e a fórmula química presente no banco, calcula a fundamental e divide por dois sucessivamente até atingir no máximo 20.000 Hz. Registra o número de oitavas, divisor e fundamental. Os valores calculados são enviados ao oscilador, sem arredondamento intermediário.

O padrão continua “Frequência original”. O usuário escolhe “Conversões por oitavas — áudio adaptado” em cada programa; ao trocar de programa a escolha retorna ao original. A tela identifica a saída adaptada e mostra o valor da fundamental. Esta é uma configuração explícita Quantum, não uma afirmação de equivalência a presets V7. Frequências diretas em Hz não são transpostas, nem pausas, duração, ordem ou comandos originais são alterados.

## Resultado medido

| Perfil | Áudio total | Misto | Externo | Pendente |
| --- | ---: | ---: | ---: | ---: |
| Original, sem inferir preset | 4.542 | 5.092 | 2.008 | 79.251 |
| Conversões por oitavas, escolhido explicitamente | 73.114 | 5.092 | 12.687 | 0 |

São 68.572 programas adicionais inteiramente na faixa nominal no perfil adaptado; 129.993 comandos passam pelo cálculo de conversão e oitavas. Zero pendentes refere-se somente à sintaxe do banco atual sob este perfil explícito, não a todos os comandos possíveis do Spooky2. Não há garantia de audibilidade humana nem de saída física equivalente à fundamental.

Tensão, modalidade luminosa/PEMF e RRMD simultâneo não são implementados pelo alto-falante. Continuam exigindo saída compatível, mesmo se o cálculo de frequência cabe no áudio. A redução não elimina essas exigências. A conexão Box não está implementada.

## Recuperação e fontes

- Cópias locais V3, V5, V7 e V8: `frequenciasDiretasComando` extrai números diretos; as versões inspecionadas não fornecem um preset completo de conversão de letras. Encontrar redução de oitavas em funções auxiliares não demonstra um preset V7 completo.
- `CONTINUAR_DNAE.md`, versão 5, salvo em 19/08/2026, e `programas_spooky2_completo_dnae.json`: fórmulas por topologia e fatores DNA/RNA/mRNA. O registro da rotina ConvDbaseFreq diferencia B de BL: somente L subtrai 1. Corrigido B para fator/N.
- Atenção: o JSON antigo contém cálculos sobre códigos cifrados (ex.: ~9909BL7752), diferentes dos comandos decodificados atuais (BL3622). Não foi usado para substituir resultados por ID. Os 64 casos inválidos relatados naquele JSON não foram transplantados para o banco atual.
- Spooky2 User's Guide, 2025-01-24, páginas 73–74 (comandos), 117 (oitavas) e 142 (fatores): https://www.spooky2-mall.com/download/Spooky2_Users_Guide_20250124.pdf
- Derivation of Genome Frequencies Rev.2, 2022-03-29: https://www.cancerclinic.co.nz/ewExternalFiles/Derivation%20Of%20DNA%20and%20RNA%20Frequencies%2020220329.pdf

A regra de oitavas é matemática: f/2^k, com o menor k inteiro não negativo que atinja o teto configurado. Não foi implementado um “parseFloat que ignora letras”. Não há multiplicador genérico presumido para F/C: o manual os define como controles de Out 2, não como alteração indistinta da frequência Out 1. Diretivas não implementadas permanecem explícitas.

## Validação

Tests/octaves.mjs verifica todas as famílias presentes, B versus BL/BC, menor divisor por oitavas, valores reais enviados ao oscilador, preservação dos comandos, frequências diretas inalteradas e exigências externas mantidas. Varredura de todos os 90.893 registros nos dois perfis. Tests/browser-test.cjs verifica um programa molecular real, troca de perfil, reprodução e retorno ao bloqueio original. Os testes de integridade e traduções permanecem no build AWS.
