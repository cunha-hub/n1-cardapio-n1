# N1 Chicken · O Cardápio Nº1

Novo cardápio navegável de alta conversão para a N1 Chicken (Tastefy), com vídeo de apresentação dentro do site. É o desafio do Laboratório de IA de setembro de 2026.

**Site:** abra o link do GitHub Pages deste repositório (`/site/`). O layout foi pensado primeiro para o celular.

## O que tem

- **Abertura com scroll:** o vídeo de abertura fica em `site/assets/abertura.mp4`. Sem o arquivo, aparece uma animação com as fotos dos produtos.
- **Diagnóstico:** números e funil do BI, antes × depois com prints reais do iFood (Vitória-ES, 30/09/2026) e as 4 correções principais.
- **CMV 28%:** todo preço é o menor valor terminado em ,90 com (custo + embalagem) ÷ preço ≤ 28%. Os custos vêm da planilha *CMV 2026 – Nova Operação*.
- **Cardápio mestre navegável:** 7 categorias e 32 itens, com complementos iguais aos do iFood e sacola.
- **Visão app:** Assistente N1 com IA (a bolinha no canto), Modo Jogo e N1 Points.
- **Vídeo de apresentação (88 s):** feito em canvas, com trilha original em Web Audio. `site/video.html` tem o botão **Exportar .webm**.
- **Projeção:** com a conversão estável, +R$ 298 mil/mês de GMV e +R$ 255 mil/mês de margem bruta.

## Rodar localmente

Sem Node nem Python, só com o PowerShell:

```
powershell -ExecutionPolicy Bypass -File site/serve.ps1
```

Depois, abra http://localhost:5173.

## Recalcular os preços

Os custos e a regra dos 28% estão em `pesquisa/precificar_cmv28.js`. O efeito no mix real de vendas está em `pesquisa/impacto_mix.js`, e a projeção em `pesquisa/projecao.js`. Para rodar:

```
cd pesquisa && bun precificar_cmv28.js > precos_cmv28.json && bun impacto_mix.js && bun projecao.js
```

## Premissas

- A base é setembro/2026: 60.850 pedidos e ticket de R$ 58,96.
- Os preços novos aplicados ao mix de jul–set dão +4,1%.
- As adesões aos complementos são hipóteses a validar no piloto em 3 lojas.
- O custo usa o "corte mais caro", com embalagem.
