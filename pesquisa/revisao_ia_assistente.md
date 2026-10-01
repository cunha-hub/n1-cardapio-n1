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
