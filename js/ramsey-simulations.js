/* Phase portraits for one-off stock/level shocks, with unchanged parameters. */
(() => {
  'use strict';
  const data = window.ramseySaddleData;
  if (!data) return;
  const points = data.points;
  function saddle(x) {
    let lo = 0, hi = points.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (points[mid][0] < x) lo = mid; else hi = mid; }
    const a = points[lo], b = points[hi];
    return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
  }
  const steadyConsumption = x => (data.D * x ** data.alpha - data.b * x) / data.Q;
  const f = n => Number(n).toFixed(2);
  const colors = { red: '#fb7185', blue: '#60a5fa', green: '#34d399', path: '#cbd5e1', shock: '#fbbf24', muted: '#94a3b8' };
  function chart(kind, initialX, progress) {
    const W=720, H=480, left=62, right=675, top=48, bottom=412, xmax=2.8, ymax=1.85;
    const X=x=>left+x/xmax*(right-left), Y=z=>bottom-z/ymax*(bottom-top);
    const line=(x1,y1,x2,y2,color,extra='')=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${color}" ${extra}/>`;
    const txt=(x,y,t,color=colors.muted,extra='')=>`<text x="${f(x)}" y="${f(y)}" fill="${color}" ${extra}>${t}</text>`;
    const path=(arr,color,extra='')=>`<path d="${arr.map((p,i)=>`${i?'L':'M'}${f(X(p[0]))},${f(Y(p[1]))}`).join(' ')}" fill="none" stroke="${color}" ${extra}/>`;
    const trajectory=(a,b,n=60)=>Array.from({length:n+1},(_,i)=>{const x=a+(b-a)*i/n;return[x,saddle(x)]});
    const initialC=saddle(initialX), passiveC=kind==='capital'?1:initialX;
    const currentX=initialX+(1-initialX)*progress, currentC=saddle(currentX);
    const id=`ramsey-${kind}`;
    let out=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-title ${id}-desc" xmlns="http://www.w3.org/2000/svg"><title id="${id}-title">${kind==='capital'?'Capital halved':'One-off population increase'}: unchanged steady state</title><desc id="${id}-desc">Red vertical consumption-change-zero line, blue capital-change-zero curve, dashed saddle path. Dotted gold lines separate the shock from the immediate consumption adjustment. B is the optimal post-shock position; the green path returns to E. The steady state and both curves do not move.</desc><defs>`;
    for(const [key,c] of Object.entries(colors)) out+=`<marker id="${id}-marker-${key}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${c}"/></marker>`;
    out+=`<clipPath id="${id}-clip"><rect x="${left}" y="${top}" width="${right-left}" height="${bottom-top}"/></clipPath></defs><g font-family="Outfit, sans-serif" font-size="13">`;
    for(const x of [.5,1,1.5,2,2.5]) {out+=line(X(x),top,X(x),bottom,'#ffffff0c');out+=txt(X(x),bottom+22,x.toFixed(1),colors.muted,'text-anchor="middle"');}
    for(const z of [.5,1,1.5]) {out+=line(left,Y(z),right,Y(z),'#ffffff0c');out+=txt(left-10,Y(z)+4,z.toFixed(1),colors.muted,'text-anchor="end"');}
    out+=line(left,bottom,right+8,bottom,colors.muted,'stroke-width="1.5"')+line(left,bottom,left,top-10,colors.muted,'stroke-width="1.5"');
    out+=txt(right,bottom+49,'k / k*',colors.path,'text-anchor="end" font-size="15"')+txt(left,22,'c / c*',colors.path,'font-size="15"');
    out+=`<g clip-path="url(#${id}-clip)">`;
    const curve=Array.from({length:301},(_,i)=>{const x=.001+xmax*i/300;return[x,steadyConsumption(x)]});
    out+=path(curve,colors.blue,'stroke-width="2.6"');
    out+=line(X(1),top,X(1),bottom,colors.red,'stroke-width="2.5"');
    out+=path(points.filter(p=>p[0]<=xmax),colors.path,'stroke-width="2" stroke-dasharray="6 6"');
    const gr=((data.b+data.rho)/data.b)**(1/(1-data.alpha));
    out+=line(X(gr),Y(steadyConsumption(gr)),X(gr),bottom,colors.blue,'stroke-width="1" stroke-dasharray="4 6" opacity=".4"');
    out+=line(X(1),Y(1),X(initialX),Y(passiveC),colors.shock,`stroke-width="1.7" stroke-dasharray="3 5" marker-end="url(#${id}-marker-shock)"`);
    out+=line(X(initialX),Y(passiveC),X(initialX),Y(initialC),colors.shock,`stroke-width="1.7" stroke-dasharray="3 5" marker-end="url(#${id}-marker-shock)"`);
    out+=path(trajectory(initialX,1),colors.green,'stroke-width="4" opacity=".32"');
    if(progress>0) out+=path(trajectory(initialX,currentX),colors.green,'stroke-width="4"');
    const ax=initialX+(1-initialX)*.64,bx=initialX+(1-initialX)*.79;
    out+=line(X(ax),Y(saddle(ax)),X(bx),Y(saddle(bx)),colors.green,`stroke-width="2" marker-end="url(#${id}-marker-green)"`);
    out+='</g>';
    out+=txt(X(1)+9,top+4,'dc/dt = 0',colors.red)+txt(X(2.38),Y(steadyConsumption(2.38))+26,'dk/dt = 0',colors.blue);
    out+=txt(X(1.55),Y(saddle(1.55))-35,'Saddle path',colors.path);
    const dot=(x,z,c,r=4)=>`<circle cx="${f(X(x))}" cy="${f(Y(z))}" r="${r}" fill="${c}" stroke="#060907" stroke-width="1.5"/>`;
    out+=dot(initialX,passiveC,colors.shock,3.5)+dot(initialX,initialC,colors.green,4.5)+dot(1,1,'#f8fafc',5);
    out+=txt(X(1)+13,Y(1)+20,'E · unchanged', '#f8fafc');
    const by=Y(initialC)+(kind==='capital'?55:-46), py=Y(passiveC)+(kind==='capital'?-28:60);
    out+=line(X(initialX)-4,Y(initialC),X(initialX)-25,by-5,colors.green,'stroke-width="1"');
    out+=txt(X(initialX)-28,by,'B · optimal',colors.green,'text-anchor="end"');
    out+=line(X(initialX)-4,Y(passiveC),X(initialX)-25,py-5,colors.shock,'stroke-width="1"');
    out+=txt(X(initialX)-28,py,'P · reference',colors.shock,'text-anchor="end"');
    out+=dot(currentX,currentC,colors.green,6);
    out+=txt(right,25,`Initial k / k* = ${f(initialX)}`,colors.green,'text-anchor="end"');
    out+='</g></svg>';
    return {svg:out,initialX,initialC,currentX,currentC};
  }
  for(const kind of ['capital','population']) {
    const container=document.getElementById(`${kind}-chart`);
    if(!container)continue;
    const range=document.getElementById(`${kind}-progress`), play=document.getElementById(`${kind}-play`), reset=document.getElementById(`${kind}-reset`);
    const population=document.getElementById('population-before');
    let raf=0,playing=false;
    function render(){
      const L=Number(population.value), x=kind==='capital'?.5:L/(L+1), p=Number(range.value)/100;
      const r=chart(kind,x,p); container.innerHTML=r.svg;
      document.getElementById(`${kind}-progress-label`).textContent=`${range.value}%`;
      document.getElementById('population-before-label').textContent=`${L} million`;
      document.getElementById(`${kind}-status`).textContent=`After the shock: k/k* = ${f(x)}, optimal c/c* = ${f(r.initialC)}. Current point: (${f(r.currentX)}, ${f(r.currentC)}). Steady state: (1, 1), unchanged.`;
    }
    function stop(){if(raf)cancelAnimationFrame(raf);raf=0;playing=false;play.textContent='Play adjustment';}
    range.addEventListener('input',()=>{stop();render();});
    reset.addEventListener('click',()=>{stop();range.value=0;render();});
    if(kind==='population')population.addEventListener('input',()=>{stop();range.value=0;render();});
    play.addEventListener('click',()=>{
      if(playing){stop();return;}
      if(Number(range.value)>=100)range.value=0;
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){range.value=100;render();return;}
      playing=true;play.textContent='Pause adjustment';const start=performance.now(),initial=Number(range.value);
      function tick(now){range.value=Math.min(100,initial+(now-start)/55);render();if(Number(range.value)<100){raf=requestAnimationFrame(tick);}else stop();}
      raf=requestAnimationFrame(tick);
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    render();
  }
})();
