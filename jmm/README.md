# José Maria Monteiro — site acadêmico (versão moderna)

Site estático em HTML, CSS e JavaScript, sem dependências. Abre direto no navegador (`index.html`)
e pode ser publicado no GitHub Pages.

## Páginas
- `index.html`: abertura com a rede real de coautoria (interativa), números, linhas de pesquisa em cards, as três fases da carreira, publicações por ano, rede radial com animação, orientandos e prêmios.
- `publicacoes.html`: bibliografia completa com busca e filtros.
- `orientacoes.html`: orientações, projetos, formação, trajetória e contato.

## Antes de publicar
1. Em `js/app.js` (`CONFIG`), preencha os links do Lattes, Google Scholar e ORCID. Links vazios não aparecem.
2. Revise os textos das linhas de pesquisa e das fases em `index.html` e os dados do Lattes em `data/academico.js`.

## Atualizar as publicações
```
cd ferramentas
pip install pandas numpy networkx
python gerar_dados.py planilha_publicacoes.csv
```

## Atualizar a rede da abertura
A posição dos pontos da rede da abertura fica em `data/grafo.js`. Depois de regenerar `data/dados.js`,
rode também `python gerar_grafo.py` (na pasta `ferramentas`).

## Cores e fontes
Em `css/app.css`: `--f1`, `--f2` e `--f3` são as cores das fases (validadas para daltonismo em fundo escuro);
`--grad` é o gradiente de destaque. Fontes: Geist e Geist Mono, do Google Fonts.
