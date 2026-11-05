# Gestor de Escalas Team

Sistema web (Gestor de Escalas Team) para criar e organizar as escalas 5x2 dos funcionários do supermercado.

## Como abrir

```bash
node server.js
```

Depois acesse http://localhost:8080. Não há dependências para instalar.

Os dados ficam salvos no navegador (localStorage). O gerente usa **Baixar backup** / **Restaurar backup**, na
seção *Dados* da barra lateral, para levar as escalas da empresa para outro computador ou navegador. Usuários e
empresas não entram nesse backup.

## Acesso

O sistema abre na tela de login (e-mail e senha).

- Não há tela de primeiro acesso: os acessos serão cadastrados no banco de dados. Até lá, o sistema já vem com
  o master fixo **adm@fourtechsolucoes.com.br** (em `USUARIOS_FIXOS`, no `js/auth.js`, guardado só como hash
  da senha). Ele existe em qualquer navegador, não pode ser excluído, inativado nem mudar de papel, e pode trocar
  a senha em *Alterar senha*.
- **Papéis**:

| Papel | Telas |
| --- | --- |
| Master | Todas as telas: Escala, Funcionários, Configurações, Histórico e backup da empresa escolhida, além de Empresas e Usuários de todas as empresas. |
| Gerente | Escala, Funcionários, Configurações, Histórico, Usuários da própria empresa e backup. |
| Operador | Escala e Funcionários. |

- **Empresas** (master): CNPJ (validado), razão social e acesso ativo ou inativo. Com o acesso inativo, ninguém
  da empresa entra, e quem estiver conectado sai na próxima ação; os dados continuam guardados. Só dá para
  excluir uma empresa sem usuários.
- **Usuários**: nome, e-mail, papel, empresa, senha e acesso ativo ou inativo. O gerente só cadastra gerentes e
  operadores da própria empresa. Ninguém muda o próprio papel nem inativa o próprio acesso, e sempre sobra pelo
  menos um master ativo. Cada usuário troca a própria senha em *Alterar senha*, na barra lateral.
- **Empresa em ajuste** (master): no topo da barra lateral, o master escolhe de qual empresa quer ver e ajustar a
  escala, os funcionários e as configurações. A escolha fica lembrada neste navegador; empresas inativas aparecem
  marcadas e também podem ser ajustadas.
- Cada empresa tem os próprios funcionários, escalas e configurações. Funcionários e escalas usados antes de
  existir login passam para a primeira empresa cadastrada.

**Importante:** enquanto não houver backend, usuários, senhas e dados ficam no navegador (localStorage). A senha é
guardada como hash com sal, mas quem tem acesso ao computador consegue ler ou apagar esses dados. O login organiza
quem usa o quê; a proteção de verdade virá com o servidor e o banco de dados.

## Visual e tema

O sistema segue a identidade da FourTech (fourtechsolucoes.com.br): azul-marinho `#011E4F` com a textura de
linhas de circuito, azul elétrico `#0173FE` como único destaque, fontes Sora (títulos e números) e IBM Plex Sans
(texto), cartões de cantos retos. O nome do sistema aparece no topo da barra lateral e no login; a FourTech aparece só como marca d'água discreta "Desenvolvido por FourTech" no rodapé da barra lateral e no login (logo em `img/fourtech-logo.png`). Na Escala da semana, a faixa azul-marinho
do topo mostra a semana, a navegação e os números do dia (trabalhando, de folga, na abertura e no fechamento:
hoje, ou a segunda-feira quando a semana aberta não é a atual). Folga aparece em bloco azul-marinho sólido.
Os tokens de cor ficam no começo de `css/styles.css`; o design system completo está em `.superdesign/design-system.md`.

No rodapé da barra lateral escolha **Claro**, **Escuro** ou **Sistema** (segue o tema do computador).
A escolha fica salva no navegador. A impressão sai sempre no tema claro.

## Telas

- **Funcionários**: cadastro (nome completo, CPF, sexo, data de nascimento, departamento, cargo), edição,
  exclusão e importação por CSV (botão *Baixar modelo CSV* traz um exemplo). As folgas são distribuídas por
  departamento; cadastros antigos sem departamento aparecem como *Não informado* e, até serem editados, usam o
  cargo como departamento.
- **Escala da semana**: o ano todo já vem gerado; a tela mostra uma semana (segunda a domingo) por vez.
  - Setas ‹ › passam para a semana anterior ou a próxima; *Esta semana* volta para hoje; o campo de data
    leva à semana de qualquer dia.
  - Cada dia de trabalho tem a sua escala de horário, escolhida pelo **rodízio de abertura e fechamento**
    (ver *Regras*). A célula mostra o tipo (*Abertura*, *Fechamento* ou o nome do horário intermediário) e os
    quatro horários: na linha de cima, entrada e saída para almoço; na de baixo, volta do almoço e
    encerramento (ex.: `07:00–11:00` / `12:00–16:24`).
  - Clique no **nome do funcionário** para escolher entre o *Rodízio automático* e uma escala **fixa** (todos os
    dias no mesmo horário).
  - *Redistribuir horários* refaz o rodízio desta semana até dezembro, sem mexer nas folgas nem em quem é fixo.
  - **Horários do dia**: *Automático pela escala* usa os horários da escala de cada dia;
    *Manual, dia a dia* transforma os quatro horários da grade em campos para digitar em cada dia. Eles
    precisam estar em ordem e respeitar as 11h de descanso em relação ao dia anterior e ao seguinte.
    Horários ajustados ficam em vermelho; voltando para o horário da escala, o
    ajuste é apagado. Os ajustes ficam guardados e só valem no modo manual. As horas da semana no CSV
    usam os horários ajustados.
  - A coluna do dia atual fica emoldurada e com fundo próprio, nos horários automáticos e manuais.
  - Dias acima do limite de folgas (definido em Configurações) ficam marcados no cabeçalho e entram nos
    alertas.
  - Clique nos dias para ajustar: *Trabalho ou folga* alterna o dia; *Férias* / *Afastamento*: clique ou
    arraste sobre os dias.
  - *Regenerar*: refaz as folgas desta semana (ou até dezembro), mantendo férias e afastamentos.
  - *Exportar CSV* (semana exibida, com horários e horas).
  - *Imprimir*: pergunta o mês (sugere o da semana aberta) e imprime a **escala mensal** de todos os
    funcionários em A4 deitado: empresa e CNPJ, uma linha por funcionário com cargo e rodízio ou escala fixa, um
    dia por coluna (código do horário do dia, como H1 ou H2, em amarelo na abertura e azul no fechamento; F, FE,
    AT; domingos destacados), a legenda dos códigos, dias trabalhados e folgas no mês, e linha para assinatura do
    responsável. No modo manual, dias com horário ajustado ganham * e são listados abaixo da tabela.
    O Ctrl+P na tela de escala também imprime a escala mensal.
- **Configurações**: cadastro das escalas de horário. *Adicionar escala* pede nome, entrada, saída para
  almoço, volta do almoço e encerramento. A tela calcula a jornada diária e avisa quando ela não fecha
  8h24 (42h semanais) ou quando o almoço tem menos de 1h ou mais de 2h. Os horários precisam estar em ordem
  dentro do mesmo dia (turnos que passam da meia-noite ainda não são aceitos). As caixas **Abertura da loja** e
  **Fechamento da loja** dizem o tipo do horário (sem nenhuma, ele é intermediário); a lista mostra o tipo e
  quantos funcionários estão fixos em cada horário.
  - **Folgas no mesmo dia, por departamento**: para cada departamento, quantos funcionários dele podem folgar
    no mesmo dia (vazio = sem limite). A tabela mostra também o *mínimo possível* (média de folgas de segunda a
    sábado nas próximas semanas): abaixo dele não cabem as folgas de todos. O gerador não passa do limite de
    segunda a sábado sempre que as regras permitirem; nos domingos vale o revezamento por sexo. Depois de mudar
    um limite, use *Regenerar* na tela de escala para reorganizar as semanas já montadas. O limite único antigo
    (da empresa toda) passou a valer para cada departamento.
- **Histórico** (gerente e master): lista o que foi mudado à mão na jornada da empresa (dias de trabalho, folga,
  férias e afastamento; horários do dia; rodízio ou escala fixa; regenerações; escalas de horário; limite de
  folgas; modo dos horários; backup restaurado), com data e hora, usuário, funcionário, dia, antes e depois.
  Filtros por período, tipo de alteração e nome, e *Exportar CSV*. Guarda as 5.000 alterações mais recentes.

## Regras aplicadas

| Regra | Comportamento |
| --- | --- |
| Jornada de 42h | 5 dias de 8h24 e 2 folgas por semana (segunda a domingo). Semanas fora disso ficam sublinhadas em âmbar. |
| Folga do domingo | Quem trabalha no domingo tem uma folga a mais na semana seguinte: 3 folgas (2 da jornada e 1 pelo domingo) e 4 dias de trabalho. Na grade, essa folga aparece como "Folga do domingo" e, na impressão, como FD. |
| Folgas não seguidas | As duas folgas nunca ficam em dias seguidos, inclusive domingo e a segunda seguinte. |
| Domingos (homens) | No máximo 2 domingos trabalhados seguidos; o 3º é folga. Podem folgar antes disso. |
| Domingos (mulheres) | Sempre alternando: 1 domingo trabalhado e o seguinte de folga. |
| Dias seguidos de trabalho | Alerta quando houver mais de 6 dias de trabalho consecutivos. |
| Descanso de 11h | Entre o fim de um turno e o início do próximo precisa haver pelo menos 11h. Quem faz o fechamento da loja não faz a abertura no dia seguinte. O gerador respeita a regra, o ajuste manual de horário é bloqueado e a grade mostra alerta se acontecer. |
| Rodízio de horários | Em cada dia, cada departamento fica com gente na abertura e no fechamento (os intermediários vêm depois), e cada pessoa alterna entre abrir e fechar a loja ao longo das semanas. Quem tem escala fixa fica sempre nela. |
| Limite de folgas por departamento | Opcional. De segunda a sábado o gerador muda folgas de dia para o departamento não passar do limite, sem quebrar as regras acima. |
| Rodízio | As folgas são espalhadas pelos dias para não concentrar muita gente do mesmo departamento (nem da empresa) de folga no mesmo dia, e os dias de folga de cada pessoa variam de semana para semana. |

Como o rodízio é montado, a cada semana:

1. Os domingos são decididos para todos juntos. Mulheres alternam; homens folgam obrigatoriamente depois
   de 2 domingos trabalhados e, quando podem escolher, adiantam a folga para o domingo em que o
   departamento tem menos gente de folga.
2. As outras folgas (2, ou 3 depois de um domingo trabalhado) vão para os dias com menos colegas do mesmo
   departamento de folga, depois com menos gente da empresa toda, evitando repetir o mesmo dia da semana anterior.
3. A ordem de escolha gira toda semana, para ninguém ficar sempre com os melhores dias.

Cada funcionário novo entra no grupo de domingo com menos colegas do mesmo departamento e sexo.

Bloqueado na edição manual:

- marcar folga ao lado de outra folga;
- marcar trabalho no 3º domingo seguido de um homem ou no 2º domingo seguido de uma mulher;
- marcar folga num domingo em que a mulher deve trabalhar pela alternância.

Férias e afastamento podem ser marcados em qualquer dia. Um domingo de férias ou afastamento interrompe o
revezamento, que recomeça com domingos trabalhados. Depois de lançar férias, use **Regenerar** (desta semana até
dezembro) para reajustar os domingos seguintes; as férias são mantidas.

A geração automática escalona os funcionários do mesmo departamento para que não folguem todos no mesmo dia.

## Formato do CSV de importação

Separador `;` ou `,`, com cabeçalho. Codificação UTF-8 ou a padrão do Excel (Windows-1252).

```
nome completo;cpf;sexo;data de nascimento;departamento;cargo
Maria da Silva Souza;529.982.247-25;F;15/03/1990;Frente de caixa;Operadora de Caixa
```

- `departamento`: também aceito como `setor` ou `depto`

- `sexo`: `M`/`F` (ou Masculino/Feminino)
- `data de nascimento`: `dd/mm/aaaa` ou `aaaa-mm-dd`
- Linhas com CPF inválido, duplicado ou campos faltando são listadas e ignoradas.
