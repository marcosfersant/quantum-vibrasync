# Reprodução original parcial — 2.6

Substitui a implementação de oitavas da PR16, rejeitada pelo usuário. O perfil adaptado, seletor, função de redução e estatísticas adaptadas foram retirados. A correção independente do comando B foi mantida.

Cada etapa conserva comando, frequência, varredura, duração e posição originais. A linha de reprodução inclui somente etapas compatíveis com a saída; etapas restritas ficam visíveis como inativas e não consomem tempo. Não há interrupção para pedir que o usuário pule cada etapa. Pausas explicitamente programadas em zero continuam com sua duração original.

A interface informa execução parcial antes de iniciar, durante a reprodução e ao concluir. Onde há exigência física conhecida, informa que o programa completo requer Box/gerador externo. Comandos pendentes de interpretação não são classificados indevidamente como inaudíveis. Nenhuma execução parcial é descrita como equivalente à sequência completa.

Programas sem etapa compatível permanecem sem reprodução. O motor verifica o limite adicional da taxa de amostragem do dispositivo. O banco de 90.893 programas e traduções não foi alterado.

Testes: preservação dos registros, etapas restritas no início/meio/fim, ausência de minutos de espera por etapas inativas, pausa/retomada, pausa programada, saída com menor taxa de amostragem, ausência de áudio em programa inteiramente restrito e retirada do modo de oitavas. No navegador, o programa 69270 começa diretamente na terceira etapa original (57 Hz), mantendo as etapas 1 e 2 visíveis como inativas.
