"""Fill the generic AF4AI pipeline with a project's facts.
python fill-pipeline.py generic.pipeline.json facts.json out.pipeline.json [--clean]
facts.json = the JSON returned by step BRF-00. --clean drops the board sentence and the signature from every prompt."""
import json,sys,re
src,facts,out=sys.argv[1:4];clean='--clean' in sys.argv
F=json.load(open(facts,encoding='utf-8'))
def val(v):
    if isinstance(v,list): return '; '.join(val(x) for x in v)
    if isinstance(v,dict): return '; '.join(f"{k}: {val(x)}" for k,x in v.items())
    return str(v)
F={k.upper():val(v) for k,v in F.items()}
if not F.get('SIGNATURE'): clean=True
def fill(s):
    if clean: s=re.sub(r' ?Presented as a wide horizontal 16:9 board:.*?insets of key materials\.','',s); s=re.sub(r' ?Integrate the authorship signature.*?correctly spelled\.','',s)
    return re.sub(r'\{\{([A-Z_]+)\}\}',lambda m:F.get(m.group(1),m.group(0)),s)
def walk(o):
    if isinstance(o,dict): return {k:(o[k] if k=='code' else walk(v)) for k,v in o.items()}
    if isinstance(o,list): return [walk(x) for x in o]
    return fill(o) if isinstance(o,str) else o
J=walk(json.load(open(src,encoding='utf-8')))
J['stages'][0]['steps']=[s for s in J['stages'][0]['steps'] if s['code']!='BRF-00']   # the intake step is done
J['count']=sum(len(s['steps']) for s in J['stages'])
left=sorted(set(re.findall(r'\{\{([A-Z_]+)\}\}',json.dumps(J,ensure_ascii=False))))
json.dump(J,open(out,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print(out,J['count'],'steps','· missing facts: '+', '.join(left) if left else '· all placeholders filled')
