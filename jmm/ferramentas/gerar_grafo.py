import pathlib
AQUI=pathlib.Path(__file__).resolve().parent
import json, itertools, numpy as np, networkx as nx
src=open(AQUI.parent/'data'/'dados.js',encoding='utf-8').read()
import re
def get(name): return json.loads(re.search(rf"window\.{name} = (.*);\n", src).group(1))
PUBS=get("PUBS"); REDE=get("REDE")
G=nx.Graph(); C="José Maria Monteiro"
for p in PUBS:
    for a in p["autores"]:
        G.add_node(a)
    for a,b in itertools.combinations(sorted(p["autores"]),2):
        G.add_edge(a,b,w=G[a][b]["w"]+1 if G.has_edge(a,b) else 1)
H=G.copy()
for a in list(G): H.add_edge(C,a,w=0.12)
pos=nx.spring_layout(H,weight="w",k=2.4/np.sqrt(len(H)),iterations=900,seed=11)
xs=np.array([p[0] for p in pos.values()]); ys=np.array([p[1] for p in pos.values()])
cx,cy=pos[C]; r=max(np.abs(xs-cx).max(),np.abs(ys-cy).max())
fase={n["nome"]:n["anel"] for n in REDE["nos"]}
tot={}; 
for p in PUBS:
    for a in p["autores"]: tot[a]=tot.get(a,0)+1
nodes=[dict(n=a,x=round((pos[a][0]-cx)/r,4),y=round((pos[a][1]-cy)/r,4),f=fase[a],t=tot[a]) for a in G]
idx={d["n"]:i for i,d in enumerate(nodes)}
edges=[[idx[a],idx[b],d["w"]] for a,b,d in G.edges(data=True)]
open(AQUI.parent/'data'/'grafo.js','w',encoding='utf-8').write("window.GRAFO = "+json.dumps(dict(nodes=nodes,edges=edges),ensure_ascii=False)+";\n")
print(len(nodes),len(edges))
