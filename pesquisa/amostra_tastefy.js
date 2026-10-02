globalThis.window = globalThis; require('../site/js/menu-data.js'); const A = require('../site/js/assistente.js'); const menu = window.N1.categories.flatMap(c => c.items);
const show = (r, rot) => { const p = A.plano(Object.assign({ hora: 20 }, r), menu); console.log('\n# ' + rot + '\n' + p.intro.replace(/<[^>]+>/g, '')); p.opcoes.forEach(o => console.log('  - ' + o.papel + ': ' + o.o.nome + ' (R$ ' + o.o.price.toFixed(2) + ') alimenta ~' + p.alimenta(o.o))); const ex = p.extra(p.rec); console.log('  extra: ' + ex.texto.replace(/<[^>]+>/g, '')); };
show({ desejo: 1, quem: 2, pessoas: 4, grande: 4, fome: 1, ocasiao: 0 }, 'burger, amigos, ~12 (grande)');
show({ desejo: 2, quem: 2, pessoas: 3, fome: 0, ocasiao: 1 }, 'belisco, amigos, 4, série');
show({ desejo: 0, quem: 1, pessoas: 1, fome: 2, ocasiao: 3 }, 'frango, a dois, campeão');
show({ desejo: 4, quem: 0, pessoas: 0, fome: 1, ocasiao: 1 }, 'doce, solo, série');
show({ desejo: 3, quem: 3, pessoas: 3, fome: 1 }, 'prato feito, família 4 (às 20h)');
show({ desejo: 5, quem: 4, pessoas: 4, grande: 7, fome: 1, ocasiao: 2 }, 'surpresa, trabalho, ~12, almoço');
