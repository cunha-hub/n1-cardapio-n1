# Revisão crítica do Assistente N1 (48 conversas)

Fontes: `pesquisa/testes_assistente.md` (saída de `teste_assistente.js`), `site/js/assistente.js` (lógica), `site/js/menu-data.js` (cardápio). Também conferi `site/index.html` e `site/js/site.js` para saber o que o cliente realmente vê.

## Nota geral de coerência: **6/10**

1. As contas fecham: os 48 totais batem com preço do item + extra. Para 1 e 2 pessoas, as quantidades fazem sentido e o "recomendado = o mais barato que dá conta" é honesto com o cliente.
2. Os problemas aparecem nas bordas: o extra às vezes sai mais caro que um combo que já existe (Trio + brigadeiro > 4 em N1), o preço por pessoa fica invertido nos grupos, a Trinca recebe mais latas do que o combo permite (total real R$ 2 maior), "Almoço" e "Beliscar" quase não mudam a comida, e as faixas "3 a 4" e "5 ou mais" são grossas demais.
3. Bloqueio antes de tudo: o `assistente.js` **não está ligado ao site**. O `index.html` só carrega `menu-data.js` e `site.js`, e o chat do site roda a tabela fixa `REC` própria (site.js, linhas 358–406), com outras regras. Os 48 testes validam um código que o cliente ainda não vê.

Placar: **12 OK · 21 Atenção · 15 Problema**. O teste automático deu "0 problemas" porque as regras dele não checam sobreposição com combos, limite de bebidas por item, consistência do preço por pessoa, arredondamento nem aderência à ocasião.

---

## Conversa a conversa

| # | Caso | Veredito | Motivo curto |
|---|------|----------|--------------|
| 1 | Só eu · Beliscar · Jogo | OK | Combinho na medida; a Coca já vem, então o brigadeiro faz sentido. Total R$ 40,80 confere. |
| 2 | Só eu · Beliscar · Série | OK | Combinho ("o lanche da série") + brigadeiro. Coerente. |
| 3 | Só eu · Beliscar · Almoço | Atenção | O "Completão" é o Tradicional, R$ 1 mais caro e com a mesma quantidade (1,1). Não é um completão. O extra é seco ("Incluo 1 lata…"). |
| 4 | Só eu · Beliscar · Pular | OK | Igual ao #1. |
| 5 | Só eu · Normal · Jogo | **Problema** | Fecha Trio + brigadeiro = **R$ 52,80**, mas o 4 em N1 (burger + batata + Coca + brigadeiro), mostrado logo acima como Completão, custa **R$ 51,90**. O cliente paga R$ 0,90 a mais pela mesma coisa. |
| 6 | Só eu · Normal · Série | **Problema** | Mesmo caso do #5. |
| 7 | Só eu · Normal · Almoço | Atenção | Mesmo "Completão falso" do #3. Beliscar e Normal dão resultados idênticos. |
| 8 | Só eu · Normal · Pular | **Problema** | Mesmo caso do #5. |
| 9 | Só eu · Campeão · Jogo | OK | Combo P (cap 1,4) + Coca. R$ 74,80 confere. |
| 10 | Só eu · Campeão · Série | OK | Combo P + brigadeiro. R$ 70,80 confere. |
| 11 | Só eu · Campeão · Almoço | Atenção | Nenhum prato feito aparece: pula para Combo P R$ 62,90 (o dobro do PF) e o "Mais em conta" vira o 4 em N1. A ocasião almoço é ignorada. |
| 12 | Só eu · Campeão · Pular | OK | Igual ao #9, sem o bordão de jogo. |
| 13 | 2 · Beliscar · Jogo | Atenção | "Beliscar" vira 2 burgers. O Chicken Bites P ("Serve 2. Pra beliscar vendo o jogo", R$ 30,90) nem é considerado. As latas (R$ 23,80) somam 50% da comida. |
| 14 | 2 · Beliscar · Série | Atenção | Beliscar com burgers, mesmo motivo do #13. |
| 15 | 2 · Beliscar · Almoço | Atenção | Almoço para 2 sem PF (os PFs só entram quando é "Só eu"). Burger no lugar do almoço. |
| 16 | 2 · Beliscar · Pular | Atenção | Beliscar com burgers. |
| 17 | 2 · Normal · Jogo | OK | Dupla + Bites (2,2), escada de preços clara. R$ 82,70 confere. |
| 18 | 2 · Normal · Série | OK | R$ 74,70 confere. |
| 19 | 2 · Normal · Almoço | Atenção | Almoço sem PF (2× Parmegiana = R$ 61,80 seria o natural). |
| 20 | 2 · Normal · Pular | OK | Igual ao #17. |
| 21 | 2 · Campeão · Jogo | OK | Trinca para 2 com fome de campeão; Combo M de completão. R$ 94,70 confere. (Trinca não tem batata, mas é aceitável.) |
| 22 | 2 · Campeão · Série | OK | R$ 86,70 confere. |
| 23 | 2 · Campeão · Almoço | Atenção | Almoço sem PF. |
| 24 | 2 · Campeão · Pular | OK | Igual ao #21. |
| 25 | 3 a 4 · Beliscar · Jogo | **Problema** | 4 latas na Trinca, mas o grupo de bebida da Trinca é `bebidaN(3)`: a 4ª lata sai avulsa a R$ 13,90, então o total real é **R$ 120,50**, não R$ 118,50. Preço por pessoa invertido ("Mais em conta" R$ 29,45 > recomendado R$ 23,63). Para 4 pessoas, o "Mais em conta" (2 burgers + bites) dá 73% da necessidade. |
| 26 | 3 a 4 · Beliscar · Série | **Problema** | Preço por pessoa invertido. "Mais em conta" curto para 4. 4 brigadeiros "pra fechar a noite" (pressupõe noite). Bites M (serve 3, Top 3) ignorado. |
| 27 | 3 a 4 · Beliscar · Almoço | **Problema** | Mesmo erro de lata/total do #25, preço por pessoa invertido e almoço sem PF. |
| 28 | 3 a 4 · Beliscar · Pular | **Problema** | Mesmo erro de lata/total e de preço por pessoa do #25. |
| 29 | 3 a 4 · Normal · Jogo | Atenção | Recomendado Combo G certo. O "Completão" é o Combo GG (serve 5 a 7): sobra 80% e custa R$ 212,90. Ele só entra porque 6,3 = 3,5 × 1,8 bate no limite por coincidência de ponto flutuante. |
| 30 | 3 a 4 · Normal · Série | Atenção | Mesmo Completão exagerado do #29. |
| 31 | 3 a 4 · Normal · Almoço | Atenção | Completão exagerado. Almoço sem PF (4× Tradicional = R$ 127,60). |
| 32 | 3 a 4 · Normal · Pular | Atenção | Completão exagerado. |
| 33 | 3 a 4 · Campeão · Jogo | Atenção | Recomenda Combo GG ("serve 5 a 7") para 3 a 4. Para 3 pessoas, o Combo G basta (R$ 64 a menos). Completão G+M com cap 7,3 sobra. Aparece na tela "alimenta ~7.300000000000001". O card do GG diz "R$ 30,41 por pessoa" e o assistente diz R$ 53,23. |
| 34 | 3 a 4 · Campeão · Série | Atenção | Mesmo caso do #33. |
| 35 | 3 a 4 · Campeão · Almoço | Atenção | Mesmo caso do #33, mais almoço sem PF. |
| 36 | 3 a 4 · Campeão · Pular | Atenção | Mesmo caso do #33. |
| 37 | 5+ · Beliscar · Jogo | **Problema** | Preço por pessoa invertido: Completão R$ 33,83 < recomendado R$ 35,48 < "Mais em conta" R$ 37,23. O "mais em conta" parece o mais caro. Pede 6 latas sem saber se são 5 ou 10 pessoas. Float 7.3000…1. |
| 38 | 5+ · Beliscar · Série | **Problema** | Preço por pessoa invertido. "Um brigadeiro pra cada um… São 6": o grupo pode ser 5 ou 10. |
| 39 | 5+ · Beliscar · Almoço | **Problema** | Preço por pessoa invertido, mais almoço sem PF. |
| 40 | 5+ · Beliscar · Pular | **Problema** | Preço por pessoa invertido. |
| 41 | 5+ · Normal · Jogo | **Problema** | O Completão (R$ 33,83/pessoa) parece mais barato por pessoa que o recomendado (R$ 35,48). Sem "Mais em conta". |
| 42 | 5+ · Normal · Série | **Problema** | Mesmo caso do #41. |
| 43 | 5+ · Normal · Almoço | **Problema** | Mesmo caso do #41, mais almoço sem PF. |
| 44 | 5+ · Normal · Pular | **Problema** | Mesmo caso do #41. |
| 45 | 5+ · Campeão · Jogo | Atenção | Por pessoa coerente aqui. Mas a base é fixa em 6 pessoas: para 5 pessoas, G+M (R$ 236,80) basta e o recomendado é GG+M (R$ 300,80). Ticket de R$ 372,20. 6 latas contra a premissa de 7. Float. |
| 46 | 5+ · Campeão · Série | Atenção | Mesmo caso do #45. |
| 47 | 5+ · Campeão · Almoço | Atenção | Mesmo caso do #45, mais almoço sem PF. |
| 48 | 5+ · Campeão · Pular | Atenção | Mesmo caso do #45. |

Conferência das contas: refiz os 48 fechamentos (item + qtd × R$ 11,90 ou R$ 7,90) e todos batem **dentro da lógica**. O único erro de total vem de regra do cardápio, não de aritmética: a Trinca aceita só 3 latas a preço de combo (#25, #27 e #28). Brigadeiro acima do limite do grupo `doce` (máx. 2) não altera o total, porque o avulso também custa R$ 7,90.

---

## Problemas reais, em ordem de prioridade

1. **O assistente testado não é o do site.** `index.html` não carrega `js/assistente.js`. O chat usa `REC` fixo em `site.js`, com outras recomendações: para 2 pessoas com fome normal, por exemplo, o site recomenda Combo M e a lógica nova recomenda Dupla + Bites. O site também oferece brigadeiro mesmo para o 4 em N1 e usa o rótulo "Econômico" no lugar de "Mais em conta".
   **Correção:** adicionar `<script src="js/assistente.js"></script>` antes de `site.js` e trocar `REC`/`ids` por `N1Assist.plano({pessoas, fome, ocasiao}, allItems)`. Montar os cards a partir de `p.opcoes` (que pode ter 2 itens), recalcular o extra com `p.extra(escolhido)` (não do `rec`) e tratar "Ver outro" quando `econ` for `null`. Unificar o rótulo como "Mais em conta".

2. **O extra sai mais caro que um combo existente (#5, #6, #8).** Trio + brigadeiro dá R$ 52,80, enquanto o 4 em N1, com o mesmo conteúdo, custa R$ 51,90 e está na tela.
   **Correção:** em `extra(o)`, antes de oferecer o doce ou a bebida, procurar em `ops` uma opção que já inclua o extra, tenha capacidade ≥ `o.cap` e preço ≤ `o.price + extra.total`. Se existir, ofereça a troca: "Por + R$ 7,00 eu troco pro **4 em N1**, que já vem com brigadeiro. Bora?". O fechamento passa a ser o 4 em N1 (R$ 51,90). Também vale um mapa simples `UPGRADE = { trio: '4-em-n1' }`.

3. **Total errado por limite de bebida do item (#25, #27, #28).** A Trinca tem `bebidaN(3)`. A 4ª lata não sai a R$ 11,90, e o total real fica R$ 120,50.
   **Correção:** ler o máximo do item (`it.groups.find(g => g.id === 'bebida').max`, somando os dois itens nos pares) e usar `q = Math.min(faltam, maxBebida, 6)`. Outra saída é cobrar o excedente a R$ 13,90 e dizer isso no texto. Acrescentar a regra ao `teste_assistente.js`. O mesmo vale para o doce (máx. 2 por item): avisar "2 no combo + 2 avulsos", ou limitar.

4. **Preço por pessoa inconsistente (#25–28, #37–44).** `porPessoa` divide por `min(nPessoas, round(cap))`, ou seja, cada opção é dividida por um número diferente de pessoas. O "Mais em conta" aparece mais caro por pessoa que o recomendado, e o "Completão" aparece mais barato.
   **Correção:** dividir as 3 opções pelo **mesmo** número de pessoas, o do grupo declarado: `o => r2(o.price / nPessoas)`. Para faixas, mostrar intervalo: "3 a 4: R$ 37 a R$ 50 por pessoa" (price/4 a price/3). Se a capacidade for menor que o grupo, dizer explicitamente: "dá pra ~2 pessoas".

5. **Faixas de pessoas grossas e bases diferentes para comida e extras.** "3 a 4" usa 3,5 na comida e 4 nas latas. "5 ou mais" usa 6 na comida e 7 (limitado a 6) nos extras. Efeitos: 3 pessoas com fome de campeão levam Combo GG (+R$ 64 sem necessidade), e 10 pessoas levam comida para ~6.
   **Correção:** se a resposta for "3 a 4", perguntar em seguida "3 ou 4?" (um toque). Se for "5 ou mais", mostrar um seletor 5–6 / 7–8 / 9–10 / 11+. Usar o **mesmo** `n` para comida, bebida e doce. Para grupos acima de 7, montar combinações dinâmicas: GG+GG, GG+G+M ou "N × combo" até cobrir a necessidade. Os 3 pares fixos de `PARES` não bastam.

6. **"Almoço" é ignorado para 2 ou mais pessoas e para fome de campeão (#11, #15, #19, #23, #27, #31, #35, #39, #43, #47).** O filtro `!CAP[id].almoco` tira os PFs de qualquer grupo, então o grupo recebe burger ou balde. Para 1 pessoa com fome de campeão, o assistente salta para o Combo P.
   **Correção:** quando a ocasião for almoço, gerar opções "N× PF" (ex.: `{ids: Array(n).fill('parmegiana'), price: n*30.9, cap: n*1.1}`) e PF + turbo (batata individual R$ 7,90) para fome de campeão. Mostrar o botão "Almoço" só entre 11h e 15h. Fora desse horário, avisar: "o almoço sai das 11h às 15h, mas olha isso aqui:".

7. **"Beliscar" não usa a linha de petiscos (#13–16, #25–28).** `bites-p` (serve 2, "Pra beliscar vendo o jogo"), `bites-m` (serve 3, Top 3 da rede) e as Caixas P/M/G não estão em `CAP`. Por isso "beliscar a dois" vira 2 burgers, e 3 a 4 vira Trinca. Fica estranho para uma marca de frango frito.
   **Correção:** incluir em `CAP` `'bites-p': {cap: 1.5, petisco: 1}`, `'bites-m': {cap: 2.3, petisco: 1}`, `'caixa-m': {cap: 2}` e `'caixa-g': {cap: 3}`. Com fome = Beliscar, ordenar os petiscos antes (ou dar desconto de ranking a eles). Exemplo para 2 · Beliscar · Jogo: Chicken Bites P R$ 30,90 + 2 latas = R$ 54,70, contra os R$ 71,70 de hoje.

8. **Completão mal calibrado.** O limite de 1,8× deixa passar o Combo GG (serve 5–7) para 3–4 pessoas com fome normal e o G+M (cap 7,3) para 3–4 com fome de campeão. Na outra ponta, em #3/#7 o "Completão" é o Tradicional, só R$ 1 mais caro e com a mesma quantidade.
   **Correção:** exigir `top.cap >= rec.cap * 1.15` (ou que o top inclua bebida/doce que o rec não tem) **e** `top.cap <= need * 1.4`. Se nada passar, omitir o Completão ou criar a variante "rec + turbo" (ex.: Combo G + Chicken Bites individual = R$ 160,80). Isso usa o grupo "Turbine o combo" que já existe no cardápio.

9. **Capacidade sem arredondamento nos pares (#33–48).** Aparece "alimenta ~7.300000000000001".
   **Correção:** em `PARES`, usar `cap: r2(A.cap + B.cap)`. No teste, acrescentar `chk(!/\d\.\d{3,}/.test(linha), 'número sem arredondar')`. Para o cliente, mostrar "serve ~7" (inteiro) no lugar de capacidade fracionada ("alimenta ~0.8" soa estranho).

10. **Texto e insistência.** Os extras de almoço e "pular" são secos e robóticos ("Incluo 2 latas por + R$ 23,80?"). A intro "quem pede comigo costuma levar isto" é prova social sem base e se repete igual nas 48 conversas. "Pra você só pra beliscar" tem "pra… pra". "Fechar a noite" pressupõe que é noite. "Um brigadeiro pra cada um… São 6" vale para qualquer tamanho de grupo. Depois do chat, a sacola (`updateBag` em `site.js`) oferece de novo brigadeiro ou Coca, o que quebra a regra de **uma** sugestão e soa como empurrar. Em grupos, as latas pesam até 67% da comida (#25: R$ 47,60 sobre uma Trinca de R$ 70,90).
    **Correção:**
    - **Almoço:** "Pra acompanhar o almoço, uma Coca gelada? + R$ 11,90".
    - **Pular:** "Vai uma Coca gelada junto?".
    - **Série:** "Um brigadeiro pra cada um fechar a sessão?".
    - **Grupo:** "Incluo 4 latas pra galera?", com botões [4] [2] [Já tenho bebida].
    - **Intro:** variações honestas, como "Fiz as contas: pra dois com fome de campeão eu iria nisso:" ou "Pra você beliscar no jogo, eu levaria:".
    - **Sacola:** suprimir o upsell quando houver item com o extra "Montado pelo Assistente N1".

---

## Casos-limite (teste mental com a lógica atual)

1. **"5 ou mais" quando são 10 pessoas, fome normal, jogo.** A lógica assume n = 6, necessidade 6, e sugere Combo GG (cap 6,3) R$ 212,90 + 6 latas R$ 71,40 = R$ 284,30. A necessidade real é de 10 porções: **falta comida para ~4 pessoas (≈37%) e faltam 4 bebidas**. O "R$ 35,48/pessoa" exibido engana: dividido por 10 dá R$ 21,29, mas a comida não chega. O certo seria algo como GG + G (cap 10,5) R$ 361,80, cerca de R$ 36/pessoa. Correção: problema 5 (seletor de faixas + combinações dinâmicas).

2. **1 pessoa, fome normal, "Almoço" às 20h (ou "Pular" ao meio-dia).** Às 20h, recomenda Frango à Parmegiana R$ 30,90, mas o almoço só sai das 11h às 15h: o pedido é impossível. Ao meio-dia com "Pular", nenhum PF aparece (sai Trio + brigadeiro R$ 52,80, que ainda cai no problema 2). Correção: ocasião sensível ao horário (problema 6).

3. **Almoço para grupo (3 a 4, fome normal).** Sai Combo G R$ 148,90 + 4 latas = R$ 196,50, com Completão GG R$ 212,90. Nenhum prato feito aparece: 4× Tradicional custaria R$ 127,60 (cap 4,4) e é o que um escritório pediria. Para 2 pessoas no almoço, o resultado é Dupla N1 (2 burgers sem acompanhamento). Correção: problema 6 (opções "N× PF").

4. **Quem já tem bebida em casa (2 pessoas, fome normal, jogo).** O extra oferecido é "2 latas por + R$ 23,80". O cliente só pode responder "Não, valeu", e aí não recebe nenhuma alternativa (regra de uma sugestão). Logo em seguida, a sacola do site oferece "Fecha com um doce?": a segunda empurrada. Se ele tivesse aceitado as latas, a sacola mostraria o brigadeiro do mesmo jeito. Correção: botão "Já tenho bebida" que troca a sugestão, uma única vez, por molho extra R$ 6,90 (o maior item da ponte de ticket, segundo `diag.ticketPontes`), e silenciar o upsell da sacola (problema 10).

5. **"3 a 4" que na verdade são 3 pessoas com fome de campeão (ou 4 só beliscando).**
   - **3 com fome de campeão:** a lógica usa 3,5 × 1,35 = 4,73 e recomenda Combo GG R$ 212,90 + 4 latas = **R$ 260,50**. Para 3 pessoas reais (4,05), basta Combo G (4,2) + 3 latas = **R$ 184,60**: R$ 75,90 a menos e sem lata sobrando.
   - **4 beliscando:** a necessidade real é 3,0. O "Mais em conta" (Dupla + Bites, cap 2,2) cobre 73% e falta comida. O recomendado Trinca + 4 latas ainda bate no limite de 3 latas do item (R$ 2 a mais no total real).

   Correção: problemas 3 e 5 (pergunta "3 ou 4?" e limite de bebida por item).

---

### Notas para o teste automático (`teste_assistente.js`)

Regras que deveriam existir e teriam pego a maior parte dos problemas acima:

- `rec.price + extra.total` não pode ser ≥ o preço de uma opção da lista que já inclua o extra.
- `extra.qtd` de bebida ≤ máximo do grupo `bebida` do item (somado nos pares).
- `porPessoa` precisa ser monotônico com o preço entre as 3 opções.
- Nenhum número exibido com mais de 2 casas decimais.
- Se ocasião = almoço, pelo menos uma opção deve conter PF.
- Se fome = beliscar e houver petisco que cubra a necessidade, ele deve aparecer.
- `top.cap > rec.cap`.

---

# Rodada 2 (98 conversas, após as correções)

Fontes: o novo `pesquisa/testes_assistente.md` (98 conversas), `site/js/assistente.js` atual, `site/js/site.js` (chat e sacola) e `site/index.html`.

## Nota: **7/10** (era 6)

Placar: **27 OK · 56 Atenção · 15 Problema**.

**O que confirmei como resolvido:**
- O `index.html` carrega `js/assistente.js` e o chat usa `N1Assist.plano`.
- A troca Trio → 4 em N1 sai a R$ 51,90 em vez de R$ 52,80.
- O limite de latas a preço de combo é respeitado, com o excedente avulso a R$ 13,90 dito no texto. Exemplo: Trinca + 4 latas = R$ 120,50.
- O preço por pessoa usa o mesmo divisor em todas as opções.
- O almoço sugere prato feito e avisa fora das 11h–15h (#97 e #98).
- "Beliscar" usa o Chicken Bites P e o M.
- Não aparece mais decimal quebrado, e a sacola não faz segunda oferta.

Refiz as contas por amostragem (#13, #23, #37, #45, #57, #61, #65, #69, #73, #77, #81, #85, #89 e #93, incluindo os casos com latas avulsas) e todas batem.

O que ainda pesa é sistêmico. Quase todos os 15 "Problema" têm a mesma causa (P1), e a maioria das "Atenção" vem do Completão sem ganho visível (P2) e das faixas de pessoas (P4).

## Veredito por bloco

| Conversas | Veredito | Motivo |
|---|---|---|
| 1, 2, 3, 4, 5, 6, 8, 9, 10, 12 | OK | Solo coerente. A troca pelo 4 em N1 é vantajosa. |
| 7, 11 | Atenção | PF + batata aparece como "alimenta ~2" para 1 pessoa (P5). |
| 15, 17, 18, 19, 20, 27, 31, 33, 34, 36, 39, 41, 42, 43, 44 | OK | Quantidade e preço coerentes; o Completão tem degrau visível. |
| 13, 14, 16, 21, 22, 24, 25, 26, 28, 29, 30, 32, 37, 38, 40 | Atenção | O Completão "alimenta ~N" igual ao recomendado e custa R$ 17 a R$ 37 a mais (P2). Em #37–40, beliscar a 4 vira Trinca (3 burgers) na frente do Bites M. |
| 23, 35, 47, 59, 71, 83, 95 | Atenção | Almoço com fome de campeão: "3× PF + 3× batata alimenta ~5" exagera a capacidade (P5). |
| 51, 55, 63, 67, 75, 79, 87, 91 | Atenção | Almoço por faixa: "5 a 6" gera 6 PFs, "11 ou mais" gera 12. Se forem 5 (ou 20), sobra ou falta prato (P4). |
| 45, 46, 48, 49, 50, 52, 57, 58, 60, 65, 66, 68, 69, 70, 72, 73, 74, 76, 77, 78, 80, 93, 94, 96 | Atenção | Recomendado em "N× Combo M": a comida real fica 4–8% abaixo da necessidade, ou o Completão tem o mesmo "~N" (P1, P2). Latas e brigadeiros calculados pelo topo da faixa (P4). |
| 53, 54, 56, 61, 62, 64, 81, 82, 84, 85, 86, 88, 89, 90, 92 | **Problema** | Recomendado em "N× Combo M" com comida real **13–17% abaixo** da necessidade: 2× M para 6 pessoas, 3× M para 9, 4× M para 12, 3× M + G para 13,5 (P1). |
| 97, 98 | OK | Aviso de horário certo e combos coerentes. |

## Problemas restantes (máx. 5)

**P1. A capacidade do Combo M está superestimada, então "N× Combo M" domina todos os grupos grandes.**

`CAP['combo-m'] = 3.1` para um combo que o cardápio vende como "serve 2 a 3". O Combo G (serve 3 a 5) usa 4,2 e o Combo GG (serve 5 a 7) usa 6,3, ou seja, o meio da faixa. O Combo M usa acima do topo. Pela composição, a conta não fecha:
- O GG é Caixa G + Caixa M e o Combo M é Caixa M + acompanhamento. Logo, 2× Combo M tem uma porção de frango a menos que o GG, mas a lógica dá aos dois quase a mesma capacidade (6,2 contra 6,3).

Efeitos:
- O assistente recomenda 2×, 3× ou 4× Combo M em 40+ conversas (todas as de 4 com fome de campeão e de 5 pessoas para cima).
- Com o Combo M no meio da faixa (2,5), a comida real fica 13–17% abaixo da necessidade em 15 casos. Exemplos: 6 pessoas com fome normal levam 2× M (5,0); 12 pessoas levam 4× M (10).
- O Combo GG, carro-chefe "pra galera", nunca é recomendado.
- A cozinha monta 3 ou 4 caixas M em vez de uma G ou GG, com mais embalagem.

**Correção:**
- Recalibrar a capacidade por componente: porção de caixa P = 1, M = 2, G = 3; acompanhamento Super ≈ 0,5. Isso dá `combo-m: 2.5`, `combo-g: 4.0`, `combo-gg: 6.0` (ou manter 4,2 e 6,3 e pôr só o M em 2,5).
- Desempatar por menos caixas: no `sort`, penalizar cada combo adicional em uns 3%.
- Acrescentar ao teste: `cap(GG) ≈ cap(G) + cap(Caixa M)` e `cap(2× M) < cap(GG)`.

**P2. O Completão muitas vezes não alimenta mais do que o recomendado, pelo número que o cliente vê.**

A regra `top.cap >= rec.cap` aceita +0,1 de capacidade. Em 36 conversas, o cartão mostra "alimenta ~N" igual nas duas opções e o Completão custa R$ 17 a R$ 37 a mais. Exemplos:
- Combo M ~3 contra Trinca ~3 (#21, #29).
- GG ~6 contra 2× M ~6 (#45 a #64).
- M + GG ~9 contra 3× M ~9 (#57, #73, #85).
- Dupla ~2 contra Bites P ~2 (#13).

**Correção:** só mostrar o Completão se `alimenta(top) > alimenta(rec)` (em pessoas inteiras) ou se ele trouxer algo que o recomendado não tem (bebida, doce, acompanhamento). Caso contrário, omitir. Acrescentar ao teste: `p.alimenta(top) > p.alimenta(rec) || top.bebidas + top.doces > rec.bebidas + rec.doces`.

**P3. Na tela, o Completão não pode ser escolhido quando existe "Mais em conta".**

`site.js` (linhas 403–404) mostra 3 cartões, mas só 2 botões: "Quero o recomendado" e "Quero o mais em conta". O botão "Quero o completão" só aparece quando não há opção mais barata. O cliente que quer a opção maior não consegue escolhê-la, e o extra calculado para ela nunca é oferecido.

**Correção:** tornar cada cartão clicável (ou um botão por papel: "Completão / O que eu levaria / Mais em conta") e chamar `pl.extra(escolhido)` para a opção tocada.

**P4. Itens "por pessoa" usam o topo da faixa, e não há como dizer "já tenho bebida".**

- "5 a 6" vira sempre 6 PFs, 6 latas e 6 brigadeiros "pra cada um"; "7 a 8" vira 8; "11 ou mais" fica fixo em 12. Um grupo de 20 recebe comida e bebida para 12.
- A única sugestão chega a 12 latas por R$ 148,80, com 3 avulsas a R$ 13,90 (#85). Em grupos pequenos beliscando, as latas pesam 65–77% da comida (#13: R$ 23,80 sobre R$ 30,90; #25: R$ 35,70 sobre R$ 54,90).
- Os botões continuam só "Bora! / Não, valeu".

**Correção:**
- Para "5 ou mais", trocar as faixas por um seletor de número exato (5…20+). O número exato só é indispensável quando entram itens por pessoa (PF, lata, brigadeiro).
- Na bebida, oferecer [Bora, N latas] [Só metade] [Já tenho bebida]. "Já tenho bebida" passa a sugestão, uma única vez, para o molho extra (R$ 6,90).
- Nunca incluir latas avulsas na sugestão: limitar a `limBebida` e escrever "dá pra pôr mais na sacola".

**P5. Almoço engessado e capacidade exibida de forma enganosa.**

- O almoço sai sempre como "N× Frango à Parmegiana", só porque é o primeiro no desempate de R$ 30,90. O Tradicional, que tem o selo "Mais pedido no almoço", nunca aparece. Quase sempre há uma opção só, e 12 pessoas recebem o mesmo prato.
- `alimenta = Math.round(cap)` exagera: "PF + batata alimenta ~2" para 1 pessoa (#7, #11); "12× PF alimenta ~13" (#87).
- A abertura "quem pede comigo costuma levar isto:" continua em cerca de um terço das conversas, inclusive quando há uma opção só (#87). É prova social sem dado por trás.

**Correção:**
- No almoço, oferecer "N× Prato feito N1 (cada um escolhe o seu)", com o Tradicional como padrão (é o mais pedido). Usar "+ batata pra quem tá com fome de campeão" como Completão.
- Exibir capacidade como `Math.floor(cap)` ou "bem servido pra N", e para PF mostrar "N pratos".
- Trocar a frase de prova social por algo honesto, como "Fiz as contas e eu iria nisso:".

---

# Rodada 3 (158 conversas, após as correções da rodada 2)

Fontes: o `pesquisa/testes_assistente.md` regerado (158 conversas), `site/js/assistente.js` e `site/js/site.js` atuais.

## Nota: **6,5/10**

Placar: **56 OK · 57 Atenção · 45 Problema**.

A nota não sobe, apesar dos avanços, por três motivos:
- Um erro de digitação numa regex quebra o nome do prato feito nas 36 conversas de almoço em grupo.
- A recalibração das capacidades abriu um buraco de preço justamente na faixa de 3–4 pessoas, a mais comum no delivery.
- O "alimenta ~N" passou a mostrar, no beliscar, menos gente do que o grupo.

Corrigidos os pontos 1 a 3 abaixo, a estimativa é **8–8,5**.

**Conferido e OK nesta rodada:**
- Um botão por opção, com o extra calculado para a opção tocada (`site.js`, linha 405).
- Sugestão só com latas a preço de combo, com "(é o que cabe no preço de combo)" quando falta (#85, #109, #145).
- Botões [Bora, N latas] [Só N/2] [Já tenho bebida].
- Número exato para "5 ou mais".
- Combo GG voltando a ser recomendado (#65, #73, #85, #137).
- Completão sem "mesmo ~N".
- Abertura "fiz as contas e eu iria nisso".

Amostra de contas (#13, #23, #33, #45, #57, #61, #85, #109, #117, #129, #141, #145, #147, #153): tudo bate, inclusive o limite de latas por combo (ex.: 3× M + G = 14 latas).

## Veredito por bloco

| Conversas | Veredito | Motivo |
|---|---|---|
| 1–12 | OK | Solo coerente. Troca pelo 4 em N1. PF individual. |
| 17, 18, 20 · 41, 42, 44 · 53, 54, 56 · 57, 58, 60 · 65, 66, 68 · 77, 78, 80 · 81, 82, 84 · 89, 90, 92 · 101, 102, 104 · 105, 106, 108 · 113, 114, 116 · 129, 130, 132 · 137, 138, 140 · 141, 142, 144 · 157, 158 | OK | Quantidade na medida, escada de preço clara, latas dentro do limite. |
| 13, 14, 16 · 25, 26, 28 · 49, 50, 52 · 61, 62, 64 · 73, 74, 76 · 85, 86, 88 · 97, 98, 100 · 109, 110, 112 · 121, 122, 124 · 133, 134, 136 · 145, 146, 148 | Atenção | No beliscar, o recomendado "alimenta ~N" com N menor que o grupo: Bites P "~1" para 2, GG "~6" para 8, 3× M + G "~11" para 15 (ponto 3). |
| 21, 22, 24 · 45, 46, 48 | Atenção | Completão exagerado: Combo G (serve 3 a 5) por R$ 148,90 para 2 pessoas (2,1× o preço do recomendado); 2× Combo G por R$ 297,80 para 4 (R$ 74/pessoa). O #45 aparece na demo automática do celular (ponto 4). |
| 69, 70, 72 · 93, 94, 96 · 117, 118, 120 · 125, 126, 128 · 153, 154, 156 | Atenção | "Mais em conta" só R$ 3 mais barato que o recomendado (ponto 4). |
| 149, 150, 152 | Atenção | "13 ou mais" fixo em 15 (é dito no texto, mas 25 pessoas recebem 60% da comida). |
| 29, 30, 32 | **Problema** | 3 pessoas com fome normal levam Combo G por R$ 148,90 (R$ 49,63/pessoa, sobra 33%). O degrau anterior é a Trinca por R$ 70,90, e não há nada no meio (ponto 2). |
| 33, 34, 36 | **Problema** | 3 com fome de campeão levam Combo GG por R$ 212,90 (**R$ 70,97/pessoa**, sobra 48%). O Combo G cobre 4,0 de 4,05 (99%) e fica como "Mais em conta" (ponto 2). |
| 37, 38, 40 | **Problema** | 4 beliscando recebem o mesmo Combo G de 4 com fome normal (R$ 148,90). A resposta "Beliscar" não muda nada (ponto 2). |
| 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 71, 75, 79, 83, 87, 91, 95, 99, 103, 107, 111, 115, 119, 123, 127, 131, 135, 139, 143, 147, 151, 155 | **Problema** | Nome quebrado "2× 2× Prato feito N1 (cada um escolhe o seu)" no cartão, no "Fechado!" e no fechamento (ponto 1). |

## Pontos restantes (máx. 5)

**1. BLOQUEANTE para apresentação: "N× N× Prato feito N1" em todo almoço em grupo.**

Em `assistente.js`, linha 56, a regex é `/(d+× )?Tradicional N1/`. Falta a barra: `d+` casa a letra "d", não um dígito. O prefixo "2× " nunca é capturado e acaba duplicado. Aparece no cartão, na mensagem "Fechado!" do chat e no fechamento das 36 conversas.

Há também um efeito na sacola: o site adiciona N× "Tradicional N1" (`final.ids.forEach`), o que contradiz o "cada um escolhe o seu". A Parmegiana e o Frito com Salada custam R$ 30,90, então o total fica R$ 1 por pessoa acima se escolherem esses pratos.

**Correção:**
- Trocar por `/(\d+× )?Tradicional N1/`.
- Na sacola, lançar uma linha "N× Prato feito N1 (escolha os pratos)" que abre o detalhe para escolher cada um, ou mostrar o preço "a partir de R$ 30,90".
- Acrescentar ao teste `chk(!/(\d+× ){2}/.test(o.nome), 'multiplicador duplicado')`.

**2. Buraco de preço na faixa de 3–4 pessoas (#29–40).**

Com as capacidades novas, não existe nada entre a Trinca (2,7 · R$ 70,90) e o Combo G (4,0 · R$ 148,90). As combinações só são geradas acima de 4,2 de necessidade e só com M, G e GG. Resultado:
- 3 pessoas com fome normal pagam R$ 49,63 por pessoa.
- 3 com fome de campeão pagam R$ 70,97 por pessoa (Combo GG), quando o Combo G cobre 99% da necessidade.
- 4 beliscando pagam o mesmo que 4 com fome normal.

**Correção:**
- Tolerância no recomendado: `rec = ops.find(o => o.cap >= need * 0.97)`. Só isso já leva o caso de 3 com fome de campeão para o Combo G.
- Gerar candidatos intermediários com o que o cardápio já tem:
  - Combo M + Chicken Bites P (4,0 · R$ 118,80)
  - Trinca + Chicken Bites P (4,2 · R$ 101,80)
  - Combo M + batata individual (2,95 · R$ 95,80), ou o "turbo" do próprio combo
- Teste: com n ≤ 4, `rec.cap <= need * 1.35`.

**3. "Alimenta ~N" medido em pessoas com fome normal (33 conversas, inclusive a demo automática "2 · Beliscar · Série").**

No beliscar, o cartão recomendado mostra menos gente do que o grupo: "Chicken Bites P · alimenta ~1" para 2 pessoas, "Combo GG ~6" para 8, "3× Combo M + Combo G ~11" para 15. A Trinca (3 burgers) aparece como "~2". O cliente lê que vai faltar comida.

**Correção:**
- Exibir `inteiro(cap / fo.f)` ("dá pra ~2 beliscando"), na mesma unidade da necessidade. Isso também corrige "PF + batata ~3" para 2 pessoas com fome de campeão.
- Para burgers, mostrar a contagem ("3 burgers").
- Teste: `p.alimenta(p.rec) >= p.n`.

**4. Completão exagerado e "Mais em conta" que não economiza.**

- O Completão para 2 pessoas com fome de campeão é o Combo G (serve 3 a 5) por R$ 148,90, 2,1× o preço do recomendado.
- Para 4 com fome de campeão, é 2× Combo G por R$ 297,80 (R$ 74/pessoa). Esse caso aparece na demo automática do celular (`pc.run([3, 2, 0])`).
- Em 15 conversas, o "Mais em conta" é só R$ 3 mais barato (R$ 297,80 contra R$ 300,80; R$ 723,60 contra R$ 726,60).

**Correção:** `top.price <= rec.price * 1.6` e `econ.price <= rec.price * 0.92`; se não passar, omitir. Vale trocar a demo automática para um caso "limpo", como "4 · Fome normal · Jogo" (#41).

**5. Grupos grandes: muitas caixas e teto em 15.**

O desempate por número de combos só vale quando o preço empata. Por isso, 10 pessoas com fome normal levam 4× Combo M (R$ 351,60, 4 caixas) em vez de G + GG (R$ 361,80, 2 caixas). E 12 com fome de campeão levam 4 combos de 3 tamanhos diferentes. "13 ou mais" conta sempre 15.

**Correção:** penalizar cada combo adicional no `sort` com cerca de R$ 8 (embalagem e montagem); o preço exibido continua o real. Para 13+, um seletor 13–30. Não é bloqueante.

**Resumo para a apresentação:** o ponto 1 é bloqueante, porque é visível em qualquer teste de almoço com 2 ou mais pessoas. O ponto 2 é bloqueante se houver teste ao vivo com 3 ou 4 pessoas (não aparece na demo automática). Os pontos 3 e 4 aparecem na demo automática e convém corrigir antes, mas não quebram a apresentação. O ponto 5 pode esperar.
