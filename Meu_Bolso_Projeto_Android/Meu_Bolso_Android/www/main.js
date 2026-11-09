
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import './style.css';

const KEY='meu_bolso_v1';
const defaults=['Casa','Moto','Carro','Contas','Gastos Diversos','Supermercado','Investimento','Salário','Outros ganhos'];
let state={items:[],categories:defaults};
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today=()=>new Date().toISOString().slice(0,10);
async function load(){
  try {
    const {value}=await Preferences.get({key:KEY});
    if(value) state={...state,...JSON.parse(value)};
  } catch(e) { console.error(e); }
}
async function save(){ await Preferences.set({key:KEY,value:JSON.stringify(state)}); render(); }
function sums(items){
  return items.reduce((a,x)=>{a[x.type]+=Number(x.amount);return a;},{income:0,expense:0});
}
function monthKey(d){return String(d||'').slice(0,7)}
function filtered(){
  const from=document.querySelector('#from')?.value||'';
  const to=document.querySelector('#to')?.value||'';
  return state.items.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));
}
function render(){
 const s=sums(state.items), balance=s.income-s.expense;
 const now=new Date(), ym=now.toISOString().slice(0,7);
 const ms=sums(state.items.filter(x=>monthKey(x.date)===ym));
 const byCat={}; state.items.filter(x=>x.type==='expense').forEach(x=>byCat[x.category]=(byCat[x.category]||0)+Number(x.amount));
 const cats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
 const months=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);const k=d.toISOString().slice(0,7);const z=sums(state.items.filter(x=>monthKey(x.date)===k));return {k,label:d.toLocaleDateString('pt-BR',{month:'short'}),...z};});
 const avg=months.length?months.reduce((a,m)=>a+m.income-m.expense,0)/6:0;
 const html=`<header><div class="brand"><span class="logo">R$</span><div><b>Meu Bolso</b><small>Seu dinheiro sob controle</small></div></div><span class="offline">● ${Capacitor.isNativePlatform()?'OFFLINE':'PRÉVIA'}</span></header>
 <main>
 <section class="hero"><small>SALDO ACUMULADO</small><h1>${money(balance)}</h1><div class="twocol"><div><small>ENTRADAS</small><b>${money(s.income)}</b></div><div><small>SAÍDAS</small><b>${money(s.expense)}</b></div></div></section>
 <section class="cards"><article><small>Ganhos do mês</small><strong class="green">${money(ms.income)}</strong></article><article><small>Gastos do mês</small><strong class="red">${money(ms.expense)}</strong></article></section>
 <section class="panel"><h2>Novo lançamento</h2><form id="entry"><div class="row"><label>Tipo<select name="type"><option value="expense">Gasto</option><option value="income">Ganho</option></select></label><label>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0,00"></label></div><div class="row"><label>Categoria<select name="category">${state.categories.map(c=>`<option>${esc(c)}</option>`).join('')}</select></label><label>Data<input name="date" type="date" value="${today()}" required></label></div><label>Descrição<input name="description" maxlength="90" placeholder="Ex.: mercado, salário..."></label><button class="primary">Adicionar lançamento</button></form></section>
 <section class="panel"><div class="titleline"><h2>Relatórios</h2><span>Período personalizado</span></div><div class="row"><label>De<input id="from" type="date"></label><label>Até<input id="to" type="date"></label></div><div id="period"></div><div class="chart">${cats.slice(0,6).map(([c,v])=>`<div class="barrow"><span>${esc(c)}</span><div><i style="width:${Math.max(3,v/Math.max(1,...cats.map(z=>z[1]))*100)}%"></i></div><b>${money(v)}</b></div>`).join('')||'<small>Sem despesas cadastradas.</small>'}</div></section>
 <section class="panel"><h2>Comparativo — últimos 6 meses</h2><div class="months">${months.map(m=>`<div><b>${m.label}</b><span class="green">+${money(m.income)}</span><span class="red">−${money(m.expense)}</span><strong>${money(m.income-m.expense)}</strong></div>`).join('')}</div></section>
 <section class="panel"><h2>Previsão de saldo</h2><p class="muted">Projeção simples usando a média mensal dos últimos seis meses.</p><div class="row"><label>Saldo atual (R$)<input id="base" type="number" step="0.01" value="${balance.toFixed(2)}"></label><label>Período<select id="horizon"><option value="3">3 meses</option><option value="6">6 meses</option><option value="12">12 meses</option></select></label></div><div class="forecast" id="forecast">${money(balance+avg*3)}</div><small class="muted">Estimativa, não garantia de resultado futuro.</small></section>
 <section class="panel"><div class="titleline"><h2>Lançamentos</h2><button id="export" class="light">Exportar CSV</button></div><div id="list">${listHtml(state.items)}</div></section>
 <section class="panel"><div class="titleline"><h2>Categorias</h2><button id="addcat" class="light">+ Categoria</button></div><div class="chips">${state.categories.map(c=>`<span>${esc(c)} <button data-cat="${esc(c)}" aria-label="Excluir ${esc(c)}">×</button></span>`).join('')}</div></section>
 <section class="panel backup"><h2>Backup dos dados</h2><p class="muted">Os registros ficam no armazenamento local deste aparelho. Exporte um backup para não perder seus dados ao trocar de celular ou limpar os dados do app.</p><div class="row"><button id="backup" class="light">Exportar backup</button><label class="filebtn">Restaurar backup<input id="restore" type="file" accept="application/json"></label></div></section>
 </main><footer>MEU BOLSO · CONTROLE FINANCEIRO PESSOAL</footer>`;
 document.querySelector('#app').innerHTML=html;
 document.querySelector('#entry').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);state.items.unshift({id:crypto.randomUUID(),type:f.get('type'),amount:Number(f.get('amount')),category:f.get('category'),date:f.get('date'),description:f.get('description')});await save();};
 document.querySelector('#from').onchange=updatePeriod; document.querySelector('#to').onchange=updatePeriod;
 document.querySelector('#horizon').onchange=updateForecast;document.querySelector('#base').oninput=updateForecast;
 document.querySelector('#list').addEventListener('click',async e=>{const b=e.target.closest('[data-del]');if(b&&confirm('Excluir este lançamento?')){state.items=state.items.filter(x=>x.id!==b.dataset.del);await save();}});
 document.querySelector('#addcat').onclick=async()=>{const c=prompt('Nome da nova categoria:');if(c?.trim()&&!state.categories.includes(c.trim())){state.categories.push(c.trim());await save();}};
 document.querySelector('.chips').onclick=async e=>{const c=e.target.dataset.cat;if(c&&confirm(`Excluir a categoria ${c}? Os lançamentos existentes serão mantidos.`)){state.categories=state.categories.filter(x=>x!==c);await save();}};
 document.querySelector('#export').onclick=()=>download('meu-bolso-lancamentos.csv','data,tipo,valor,categoria,descricao\n'+state.items.map(x=>[x.date,x.type,x.amount,x.category,x.description].map(csv).join(';')).join('\n'),'text/csv;charset=utf-8');
 document.querySelector('#backup').onclick=()=>download('meu-bolso-backup.json',JSON.stringify(state,null,2),'application/json');
 document.querySelector('#restore').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!Array.isArray(x.items)||!Array.isArray(x.categories))throw Error();if(confirm('Substituir os dados atuais pelo backup?')){state=x;await save();}}catch{alert('Arquivo de backup inválido.')}};
 updatePeriod();updateForecast();
}
function listHtml(items){return items.slice(0,60).map(x=>`<div class="item"><div><b>${esc(x.description||x.category)}</b><small>${x.date.split('-').reverse().join('/')} · ${esc(x.category)}</small></div><strong class="${x.type==='income'?'green':'red'}">${x.type==='income'?'+':'−'}${money(x.amount)}</strong><button class="delete" data-del="${x.id}">×</button></div>`).join('')||'<p class="muted">Nenhum lançamento cadastrado.</p>'}
function updatePeriod(){const xs=filtered(),s=sums(xs);document.querySelector('#period').innerHTML=`<div class="period"><span>${xs.length} lançamentos</span><b class="green">Entradas: ${money(s.income)}</b><b class="red">Saídas: ${money(s.expense)}</b><strong>Resultado: ${money(s.income-s.expense)}</strong></div>`}
function updateForecast(){const n=Number(document.querySelector('#horizon').value),base=Number(document.querySelector('#base').value||0),now=new Date(),ms=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1),k=d.toISOString().slice(0,7);const s=sums(state.items.filter(x=>monthKey(x.date)===k));return s.income-s.expense;});document.querySelector('#forecast').textContent=money(base+ms.reduce((a,b)=>a+b,0)/6*n)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function csv(s){return '"'+String(s??'').replace(/"/g,'""')+'"'}
function download(name,data,type){const a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type}));a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
load().then(render);
