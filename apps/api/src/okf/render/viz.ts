/**
 * Self-contained OKF visualizer. Embeds the bundle as JSON; a small client
 * script parses frontmatter + internal links into a Cytoscape graph with
 * type filters, search, a detail panel (marked-rendered markdown), and
 * "Cited by" backlinks. CDN deps mirror the OKF reference visualizer.
 */
export function renderViz(bundle: Record<string, string>): string {
  const data = JSON.stringify(bundle).replace(/<\/script>/gi, "<\\/script>");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>OurNigeria Knowledge Bundle</title>
<script src="https://cdn.jsdelivr.net/npm/cytoscape@3.30.2/dist/cytoscape.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@14.1.2/marked.min.js"></script>
<style>
  body{margin:0;font-family:system-ui,sans-serif;display:flex;height:100vh}
  #graph{flex:1;background:#0b0d12}
  #panel{width:420px;overflow:auto;padding:16px;border-left:1px solid #243;background:#11141b;color:#e6e6e6}
  #panel a{color:#7fb3ff}
  #toolbar{position:absolute;top:8px;left:8px;z-index:10}
  input,select{padding:6px;margin-right:6px}
</style>
</head>
<body>
<div id="toolbar">
  <input id="search" placeholder="Search…" />
  <select id="typeFilter"><option value="">all types</option></select>
</div>
<div id="graph"></div>
<div id="panel"><em>Click a node.</em></div>
<script id="bundle" type="application/json">${data}</script>
<script>
  const bundle = JSON.parse(document.getElementById("bundle").textContent);
  const COLORS = { officials:"#4f9", cases:"#f55", parties:"#fd5", states:"#5af", lgas:"#a8f" };
  function parse(path, raw){
    const m = raw.match(/^---\\n([\\s\\S]*?)\\n---/);
    const fm = {}; if(m){ for(const line of m[1].split("\\n")){ const i=line.indexOf(":"); if(i>0){ fm[line.slice(0,i).trim()] = line.slice(i+1).trim().replace(/^"|"$/g,""); } } }
    const links = [...raw.matchAll(/\\]\\((\\/[a-z]+\\/[^)]+\\.md)\\)/g)].map(x=>x[1].replace(/^\\//,""));
    return { fm, links, body: raw.replace(/^---[\\s\\S]*?---/, "") };
  }
  const nodes=[], edges=[], byId={}, backlinks={};
  for(const [path,raw] of Object.entries(bundle)){
    if(path.endsWith("/index.md")||path==="index.md"||path==="README.md"||!path.endsWith(".md")) continue;
    const p = parse(path, raw); byId[path]=p;
    nodes.push({ data:{ id:path, label:p.fm.title||path, type:p.fm.type||"officials" } });
  }
  for(const [path,p] of Object.entries(byId)){
    for(const to of p.links){ if(byId[to]){ edges.push({ data:{ source:path, target:to } }); (backlinks[to]=backlinks[to]||[]).push(path); } }
  }
  const types=[...new Set(nodes.map(n=>n.data.type))];
  const sel=document.getElementById("typeFilter");
  for(const t of types){ const o=document.createElement("option"); o.value=t; o.textContent=t; sel.appendChild(o); }
  const cy = cytoscape({
    container: document.getElementById("graph"),
    elements: [...nodes, ...edges],
    style: [
      { selector:"node", style:{ "background-color": n=>COLORS[n.data("type")]||"#999", "label":"data(label)", "color":"#cdd", "font-size":"8px" } },
      { selector:"edge", style:{ "width":1, "line-color":"#345", "curve-style":"haystack" } },
    ],
    layout: { name:"cose", animate:false },
  });
  cy.on("tap","node", e=>{
    const id=e.target.id(), p=byId[id];
    const cited=(backlinks[id]||[]).map(b=>'<li><a href="#" data-go="'+b+'">'+(byId[b].fm.title||b)+"</a></li>").join("");
    document.getElementById("panel").innerHTML =
      "<h2>"+(p.fm.title||id)+"</h2>"+
      (p.fm.resource?'<p><a href="'+p.fm.resource+'" target="_blank">canonical page ↗</a></p>':"")+
      marked.parse(p.body)+
      (cited?"<h3>Cited by</h3><ul>"+cited+"</ul>":"");
    document.querySelectorAll("#panel [data-go]").forEach(a=>a.onclick=ev=>{ ev.preventDefault(); cy.$("#"+CSS.escape(a.dataset.go)).emit("tap"); });
  });
  document.getElementById("search").addEventListener("input", e=>{
    const q=e.target.value.toLowerCase();
    cy.nodes().forEach(n=>n.style("display", !q||n.data("label").toLowerCase().includes(q)?"element":"none"));
  });
  sel.addEventListener("change", e=>{
    const t=e.target.value;
    cy.nodes().forEach(n=>n.style("display", !t||n.data("type")===t?"element":"none"));
  });
</script>
</body>
</html>`;
}
