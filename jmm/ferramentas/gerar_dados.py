import json, re, unicodedata, itertools
import numpy as np, pandas as pd, networkx as nx
from collections import Counter
from networkx.algorithms.community import greedy_modularity_communities

import sys, pathlib
AQUI=pathlib.Path(__file__).resolve().parent
CSV=sys.argv[1] if len(sys.argv)>1 else AQUI/"planilha_publicacoes.csv"
FASES=[("Até 2009",2000,2009),("2010–2017",2010,2017),("2018–2026",2018,2026)]
TIPOS={"E":"Evento","P":"Periódico","C":"Capítulo / minicurso"}
def norm(t): return "".join(c for c in unicodedata.normalize("NFKD",str(t)) if not unicodedata.combining(c)).strip().upper()
df=pd.read_csv(CSV,header=2,encoding="cp1252"); df.columns=[str(c).strip() for c in df.columns]
df=df.rename(columns={c:norm(c) for c in df.columns[:6]}).dropna(subset=["TITULO","ANO"]).copy()
df["ANO"]=df["ANO"].astype(int)
df["TITULO"]=(df["TITULO"].astype(str).str.strip().str.replace(r"^\.\s*","",regex=True)
  .str.replace("FakeWhastApp","FakeWhatsApp").str.replace(r"is Comin$","is Coming",regex=True)
  .str.replace(r"\s+In: .*$","",regex=True).str.replace(r"\s{2,}"," ",regex=True))
df["EVENTO"]=df["EVENTO"].astype(str).str.strip()
df["TIPO"]=df["ANAIS/REVISTA"].str.strip().map(TIPOS)
df["QUALIS"]=df["QUALIS"].fillna("").astype(str).str.strip()
fase=lambda a: next(i for i,(n,s,e) in enumerate(FASES) if s<=a<=e)
df["FASE"]=df["ANO"].map(fase)
cols=[c for c in df.columns[df.columns.get_loc("QUALIS")+1:] if c not in ("TIPO","FASE")]
M=df[cols].apply(pd.to_numeric,errors="coerce").fillna(0).astype(int)
def nome(c):
    t=c.title().replace("Jos� ","José ")
    return re.sub(r"\b([A-Z])\. ",r"\1. ",t)
M.columns=[nome(c) for c in M.columns]; M=M.loc[:,M.sum()>0]
TEMAS={
 "Desinformação e mensageria":["whatsapp","telegram","misinformation","desinforma","(dis)information","fake","extrema direita","far-right","fundamentalism","lgbtfobia","prejudice","influenciadores","twitter","mensagens instant","instant messaging"],
 "Privacidade e LGPD":["lgpd","privacy","privacidade","confidentiality","proteção de dados"],
 "Segurança de software":["vulnerab","sast","pentest","intrus","osint","fraudes de cartão"],
 "Saúde digital":["ecg","eeg","heart","eletrocardiograma","epilép"],
 "Educação e jogos":["ensino","jogo","game","gamifica","m-learning"],
 "Web semântica":["r2rml","rdf","semântic","semantic","ontolog","linked"],
 "Engenharia de software":["feature model","product line","dspl","software","smell","change-prone","requirements","usability","estimation","estimativa","pattern language","padrões","c# projects","c++ projects","predictive tasks","features em"],
 "Bancos de dados":["database","banco de dados","bancos de dados","sgbd","dbms","query","consulta","sql","index","indexa","tuning","sintonia","join","recovery","nosql","transaction","replicated","concurrency","mm-direct","data management","piglatin","dados frios","etl","dados em memória","log file","physical design"],
 "Computação móvel e distribuída":["mobile","móvel","ubiquitous","broadcast","cloud","nuvem","serverless","distributed","distribuíd","road networks","trajectory","big data","iot"],
 "Ciência de dados e IA":["learning","neural","classif","predict","sentiment","dataset","data science","recognition","fraud","mining","fuzzy","time-series","data quality","qualidade de dados","aprendizado"],
}
df["TEMA"]=df["TITULO"].map(lambda t: next((k for k,v in TEMAS.items() if any(x in t.lower() for x in v)),"Outros"))

pubs=[dict(id=int(r.SEQ),ano=int(r.ANO),titulo=r.TITULO,veiculo=r.EVENTO,tipo=r.TIPO,qualis=r.QUALIS,tema=r.TEMA,fase=int(r.FASE),
           autores=list(M.columns[M.loc[i]>0])) for i,r in df.sort_values(["ANO","SEQ"],ascending=[False,True]).iterrows()]

# rede radial
tot=M.sum(); prim=M.apply(lambda c: df.loc[c>0,"ANO"].min())
G=nx.Graph()
for a in M.columns: G.add_node(a)
for _,l in M.iterrows():
    for a,b in itertools.combinations(sorted(l.index[l.values>0]),2):
        G.add_edge(a,b,w=G[a][b]["w"]+1 if G.has_edge(a,b) else 1)
com=greedy_modularity_communities(G,weight="w")
og={n:i for i,c in enumerate(sorted(com,key=len,reverse=True)) for n in sorted(c,key=lambda x:(prim[x],-tot[x]))}
nos=[]
for k in range(3):
    anel=sorted([n for n in G if fase(int(prim[n]))==k],key=lambda n:(og[n],n))
    for j,n in enumerate(anel):
        an=df.loc[M[n]>0,"ANO"].value_counts().sort_index()
        nos.append(dict(nome=n,anel=k,ang=2*np.pi*(j+.5)/len(anel)-np.pi/2,anos={int(a):int(c) for a,c in an.items()}))
idn={d["nome"]:i for i,d in enumerate(nos)}
rpubs=[dict(ano=int(r.ANO),titulo=r.TITULO,veiculo=r.EVENTO,qualis=r.QUALIS or "—",autores=[idn[a] for a in M.columns[M.loc[i]>0]])
       for i,r in df.sort_values("ANO").iterrows()]
rede=dict(central="José Maria Monteiro",fases=[f[0] for f in FASES],ano_min=int(df.ANO.min()),ano_max=int(df.ANO.max()),nos=nos,pubs=rpubs)

alto=lambda s: s.isin(["A1","A2","A3","A4"]).mean()*100
stats=dict(pubs=len(df),coautores=int(M.shape[1]),periodicos=int((df.TIPO=="Periódico").sum()),
  a1a4_recente=round(alto(df.loc[df.FASE==2,"QUALIS"])),ano_min=int(df.ANO.min()),ano_max=int(df.ANO.max()),
  fases=[dict(nome=n,ini=s,fim=e,n=int((df.FASE==i).sum()),a1a4=round(alto(df.loc[df.FASE==i,"QUALIS"])),
              media_coaut=round(float(M[df.FASE==i].sum(axis=1).mean()),1)) for i,(n,s,e) in enumerate(FASES)],
  temas=list(df.TEMA.value_counts().index))
with open(AQUI.parent/"data"/"dados.js","w") as f:
    f.write("// Gerado a partir de planilha_publicacoes.csv por site_data.py\n")
    for k,v in dict(PUBS=pubs,REDE=rede,STATS=stats).items():
        f.write(f"window.{k} = {json.dumps(v,ensure_ascii=False)};\n")
print(stats)
