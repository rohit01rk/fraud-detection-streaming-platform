"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {generateTxn,generateBatch,RULES,DQ_CHECKS,type Txn} from "@/lib/engine";

const fmt=(n:number)=>"₹"+n.toLocaleString("en-IN",{maximumFractionDigits:0});
type Tab="live"|"alerts"|"analytics"|"quality"|"architecture";

export default function Home(){
 const [tab,setTab]=useState<Tab>("live");
 const [running,setRunning]=useState(true);
 const [txns,setTxns]=useState<Txn[]>([]);
 const [speed,setSpeed]=useState(900);
 const [filter,setFilter]=useState("ALL");
 const [query,setQuery]=useState("");
 const chartRef=useRef<number[]>([]);

 useEffect(()=>{ setTxns(generateBatch(28).sort((a,b)=>b.ts-a.ts)); },[]);
 useEffect(()=>{
   if(!running) return;
   const id=setInterval(()=>{ setTxns(prev=>[generateTxn(),...prev].slice(0,220)); },speed);
   return ()=>clearInterval(id);
 },[running,speed]);

 const stats=useMemo(()=>{
   const total=txns.length||1; const flagged=txns.filter(t=>t.status!=="APPROVED");
   const blocked=txns.filter(t=>t.status==="BLOCKED");
   const blockedAmt=blocked.reduce((s,t)=>s+t.amount,0);
   const fraudRate=(flagged.length/total*100);
   const tps=(1000/speed*1).toFixed(1);
   const regions=["North","South","East","West"].map(r=>({r,count:txns.filter(t=>t.region===r).length, fraud:txns.filter(t=>t.region===r&&t.status!=="APPROVED").length}));
   const cats=[...new Set(txns.map(t=>t.category))].map(c=>({c,amt:txns.filter(t=>t.category===c).reduce((s,t)=>s+t.amount,0)})).sort((a,b)=>b.amt-a.amt).slice(0,6);
   return {total:txns.length,flagged:flagged.length,blocked:blocked.length,blockedAmt,fraudRate,tps,regions,cats,avgRisk:Math.round(txns.reduce((s,t)=>s+t.riskScore,0)/total)};
 },[txns]);

 const visible=txns.filter(t=>(filter==="ALL"||t.status===filter)&&(query===""||(t.userName+t.merchant+t.city+t.id).toLowerCase().includes(query.toLowerCase())));
 const alerts=txns.filter(t=>t.status!=="APPROVED");
 // spark data: last 30 in reverse
 const spark=useMemo(()=>txns.slice(0,30).reverse().map(t=>t.riskScore),[txns]);
 const maxSpark=Math.max(...spark,100);

 return (<main className="min-h-screen">
  {/* Header */}
  <header className="sticky top-0 z-20 backdrop-blur bg-[#070D18]/90 border-b border-[#1E344D]">
    <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00D4A6] text-black font-black grid place-items-center text-lg">◈</div>
        <div><div className="font-black text-lg leading-none">FraudStream</div><div className="text-[11px] text-slate-400">REAL-TIME FRAUD DETECTION · CSE499 CAPSTONE</div></div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"><span className="live-dot inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1"/> LIVE STREAM</span>
        <span className="badge bg-white/5 text-slate-300 border border-white/10">Kafka → Flink → Lakehouse → dbt</span>
        <button onClick={()=>setRunning(!running)} className="px-3 py-2 rounded-lg bg-[#00D4A6] text-black font-bold">{running?"Pause Stream":"Resume Stream"}</button>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollthin">
      {([["live","⚡ Live Dashboard"],["alerts",`🚨 Alerts (${alerts.length})`],["analytics","📊 Analytics / Star Schema"],["quality","✅ Data Quality"],["architecture","🏗 Architecture & Roadmap"]] as [Tab,string][]).map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold ${tab===k?"bg-white text-black":"bg-white/5 text-slate-300"}`}>{l}</button>
      ))}
    </div>
  </header>

  <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
    {/* KPI row - always visible */}
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {[
        ["Transactions Processed",stats.total.toLocaleString("en-IN"),"in current session window"],
        ["Throughput",`${stats.tps} txn/s`,"simulated Kafka producer"],
        ["Flagged / Blocked",`${stats.flagged} / ${stats.blocked}`,"rule engine decisions"],
        ["Fraud Rate",`${stats.fraudRate.toFixed(1)}%`,"flagged ÷ total"],
        ["Amount Protected",fmt(stats.blockedAmt),"blocked txn value"],
        ["Avg Risk Score",`${stats.avgRisk} / 100`,"windowed risk profile"],
      ].map(([t,v,s])=>(<div key={t} className="card p-4"><div className="text-[11px] uppercase tracking-wider text-slate-400">{t}</div><div className="text-xl md:text-2xl font-black mt-1">{v}</div><div className="text-[11px] text-slate-500 mt-1">{s}</div></div>))}
    </section>

    {tab==="live" && (<>
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="flex justify-between items-center"><h2 className="font-bold">Risk Score — Live Stream</h2><span className="text-xs text-slate-400">Last 30 events · Watermark: event-time · Allowed lateness: 2 min</span></div>
          <div className="flex items-end gap-1 h-32 mt-4">{spark.map((v,i)=>(<div key={i} title={`${v}`} className={`flex-1 rounded-t ${v>=75?"bg-[#FF4D6D]":v>=45?"bg-[#FFB020]":"bg-[#00D4A6]"}`} style={{height:`${Math.max(6,v/maxSpark*100)}%`}}/>))}</div>
          <div className="flex gap-4 text-[11px] mt-2 text-slate-400"><span>● Approved &lt;45</span><span>● Flagged 45–74</span><span>● Blocked ≥75</span></div>
          <div className="mt-4 flex flex-wrap gap-2 items-center text-xs"><span className="text-slate-400">Stream speed:</span>{[1400,900,450].map(s=>(<button key={s} onClick={()=>setSpeed(s)} className={`px-2 py-1 rounded ${speed===s?"bg-white text-black font-bold":"bg-white/5"}`}>{s===1400?"Normal":s===900?"Fast":"Burst"}</button>))}
          <span className="ml-2 text-slate-500">Producer injects geo-velocity, micro-burst & high-value edge cases from the proposal (§3).</span></div>
        </div>
        <div className="card p-4">
          <h2 className="font-bold">By Region</h2><div className="space-y-3 mt-3">{stats.regions.map(({r,count,fraud})=>(<div key={r}><div className="flex justify-between text-xs"><span>{r} India</span><span className="text-slate-400">{count} txns · {fraud} flagged</span></div><div className="h-2 bg-white/5 rounded mt-1"><div className="h-2 bg-[#7C5CFF] rounded" style={{width:`${count/Math.max(1,stats.total)*100}%`}}/></div></div>))}</div>
          <h3 className="font-bold mt-5 text-sm">Top Categories by Value</h3><div className="space-y-1 mt-2">{stats.cats.map(({c,amt})=>(<div key={c} className="flex justify-between text-xs py-1 border-b border-white/5"><span>{c}</span><b>{fmt(amt)}</b></div>))}</div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="p-4 flex flex-wrap gap-2 justify-between items-center"><h2 className="font-bold">Live Transaction Feed</h2>
          <div className="flex gap-2 flex-wrap"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search user, merchant, city, ID…" className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm w-64"/>
          {["ALL","APPROVED","FLAGGED","BLOCKED"].map(f=>(<button key={f} onClick={()=>setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-bold ${filter===f?"bg-white text-black":"bg-white/5"}`}>{f}</button>))}</div>
        </div>
        <div className="overflow-auto scrollthin max-h-[520px]"><table className="w-full text-sm min-w-[980px]"><thead className="sticky top-0 bg-[#0F1B2E] text-left text-xs text-slate-400"><tr>{["Time","Transaction","User","Merchant","City / Region","Method","Amount","Risk","Decision","Rules Triggered"].map(h=>(<th key={h} className="p-3">{h}</th>))}</tr></thead>
        <tbody>{visible.slice(0,60).map(t=>(<tr key={t.id} className="border-t border-white/5 hover:bg-white/[.02]"><td className="p-3 text-slate-400 text-xs">{new Date(t.ts).toLocaleTimeString("en-IN")}</td><td className="p-3 font-mono text-xs">{t.id}<div className="text-slate-500">{t.scenario}</div></td><td className="p-3">{t.userName}<div className="text-xs text-slate-500">{t.userId}</div></td><td className="p-3">{t.merchant}<div className="text-xs text-slate-500">{t.category}</div></td><td className="p-3">{t.city}<div className="text-xs text-slate-500">{t.region}</div></td><td className="p-3">{t.method}</td><td className="p-3 font-bold">{fmt(t.amount)}</td><td className="p-3"><span className={`badge ${t.riskScore>=75?"bg-red-500/15 text-red-300":t.riskScore>=45?"bg-amber-500/15 text-amber-300":"bg-emerald-500/15 text-emerald-300"}`}>{t.riskScore}</span></td><td className="p-3 font-bold">{t.status}</td><td className="p-3 text-xs text-slate-300">{t.rules.join(" · ")||"—"}</td></tr>))}</tbody></table></div>
      </section>
    </>)}

    {tab==="alerts" && (<section className="grid md:grid-cols-2 gap-4">{alerts.length===0&&<div className="card p-6 text-slate-400">No alerts yet — keep the stream running.</div>}{alerts.slice(0,24).map(t=>(<div key={t.id} className="card p-4 border-l-4" style={{borderLeftColor:t.status==="BLOCKED"?"#FF4D6D":"#FFB020"}}><div className="flex justify-between"><b>{t.status==="BLOCKED"?"⛔ Blocked":"⚠️ Flagged"} — {fmt(t.amount)}</b><span className="text-xs text-slate-400">{new Date(t.ts).toLocaleTimeString("en-IN")}</span></div><div className="text-sm mt-1">{t.userName} · {t.merchant} · {t.city} ({t.region})</div><div className="text-xs text-slate-400 mt-1">{t.scenario} · Risk {t.riskScore}/100 · {t.id}</div><div className="mt-2 flex flex-wrap gap-1">{t.rules.map(r=>(<span key={r} className="badge bg-white/5 border border-white/10">{r}</span>))}</div><div className="text-[11px] text-slate-500 mt-3">Action: {t.status==="BLOCKED"?"Held in Redis alert cache, routed to FastAPI — analyst review required before release.":"Sent to analyst queue, user notified for verification."}</div></div>))}</section>)}

    {tab==="analytics" && (<div className="space-y-4">
      <section className="card p-5"><h2 className="font-bold text-lg">Warehouse — Star Schema (dbt marts)</h2><p className="text-sm text-slate-400 mt-1">Exactly as proposed in §2/§6: raw lake (Parquet, partitioned by date + region) → staging → dimensional marts for BI & ML retraining.</p>
      <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">{[["fact_transactions","1 row per transaction","txn_id · user_key · merchant_key · date_key · amount · risk_score · is_fraud"],["dim_user","User dimension","user_key · user_id · name · home_region · avg_30d_spend"],["dim_merchant","Merchant dimension","merchant_key · name · category · risk_tier"],["dim_date","Date dimension","date_key · date · hour · is_odd_hour · day_type"],["dim_region","Region dimension","region_key · city · region · lat · lon"],["agg_fraud_daily","Daily fraud mart","date · region · flagged · blocked · blocked_amount"]].map(([t,d,f])=>(<div key={t} className="bg-black/20 rounded-xl p-3 border border-white/5"><b className="font-mono text-[#00D4A6]">{t}</b><div className="text-slate-300 mt-1">{d}</div><div className="text-xs text-slate-500 mt-1">{f}</div></div>))}</div></section>
      <section className="card p-5"><h2 className="font-bold">SQL — Try the model logic</h2><pre className="bg-black/40 rounded-xl p-4 text-xs overflow-auto mt-3 text-emerald-200">{`-- dbt/models/marts/agg_fraud_daily.sql
SELECT date_key, region,
  COUNT(*) AS total_txns,
  SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) AS flagged,
  SUM(CASE WHEN status='BLOCKED' THEN amount ELSE 0 END) AS blocked_amount
FROM {{ ref('fact_transactions') }}
GROUP BY 1,2 ORDER BY 1 DESC;`}</pre><p className="text-xs text-slate-500 mt-2">Full dbt project (staging + marts + schema.yml tests) is in the repo under <code>dbt/</code>.</p></section>
    </div>)}

    {tab==="quality" && (<div className="grid md:grid-cols-2 gap-4">{DQ_CHECKS.map(c=>(<div key={c.name} className="card p-4"><div className="flex justify-between"><b className="text-sm">{c.name}</b><span className="badge bg-emerald-500/15 text-emerald-300">{c.pass}% PASS</span></div><div className="text-xs text-slate-400 mt-1">Boundary: {c.target} · Great Expectations / Soda + dbt-expectations in CI</div><div className="h-2 bg-white/5 rounded mt-3"><div className="h-2 bg-[#00D4A6] rounded" style={{width:`${c.pass}%`}}/></div></div>))}
      <div className="card p-4 md:col-span-2 text-sm text-slate-300"><b>Governance from the proposal (§4):</b> Schema Registry enforces Avro/JSON evolution · Exactly-once Kafka sinks (transactional) eliminate duplicates on recovery · Watermarking + allowed lateness (2 min) handles late mobile transactions · GitHub Actions lints dbt SQL + runs tests on every PR.</div></div>)}

    {tab==="architecture" && (<div className="space-y-4">
      <section className="card p-5"><h2 className="font-bold text-lg">System Architecture</h2><div className="grid md:grid-cols-5 gap-2 mt-4 text-center text-xs">{[["1 · INGESTION","Python Producer\nApache Kafka","Simulated profiles +\nedge-case injection"],["2 · STREAM PROCESSING","Apache Flink","Windowed aggregations\nKeyed state · Watermarks"],["3 · LAKEHOUSE","MinIO (S3-compatible)","Raw JSON / Parquet\nPartition: date + region"],["4 · WAREHOUSE","Snowflake / DuckDB","Columnar analytics\nStar schema"],["5 · SERVING","dbt + FastAPI + This UI","Alerts in Redis\nBI + ML retraining"]].map(([t,b,d])=>(<div key={t} className="bg-black/20 border border-white/10 rounded-xl p-3"><div className="font-black text-[#00D4A6]">{t}</div><div className="font-bold mt-2 whitespace-pre-line">{b}</div><div className="text-slate-400 mt-2 whitespace-pre-line">{d}</div></div>))}</div>
      <p className="text-xs text-slate-500 mt-3">On Vercel, the same logic runs as a live simulation: the producer + Flink-style rule engine run in-browser / via <code>/api/transactions</code>, so the viva demo works without a Kafka cluster. The full Docker + Terraform stack is in the repo (<code>docker-compose.yml</code>, <code>infra/</code>) for local / cloud deployment.</p></section>
      <section className="card p-5"><h2 className="font-bold">Fraud Rules — Flink Windowed Logic</h2><div className="overflow-auto mt-3"><table className="w-full text-sm min-w-[640px]"><thead className="text-left text-xs text-slate-400"><tr><th className="p-2">Rule</th><th className="p-2">Name</th><th className="p-2">Description</th><th className="p-2">Window</th><th className="p-2">Severity</th></tr></thead><tbody>{RULES.map(r=>(<tr key={r.id} className="border-t border-white/5"><td className="p-2 font-mono">{r.id}</td><td className="p-2 font-bold">{r.name}</td><td className="p-2 text-slate-300">{r.desc}</td><td className="p-2">{r.window}</td><td className="p-2">{r.severity}</td></tr>))}</tbody></table></div></section>
      <section className="card p-5"><h2 className="font-bold">10-Week Roadmap (Proposal §6)</h2><div className="grid md:grid-cols-2 lg:grid-cols-5 gap-2 mt-3 text-xs">{[["Weeks 1–2","Infra & Ingestion","Docker Kafka/MinIO + Python generator"],["Weeks 3–5","Stream Processing","Flink windows + lake sink"],["Weeks 6–7","Warehousing","DuckDB/Snowflake + dbt star schema"],["Weeks 8–9","Quality & Orchestration","Great Expectations + Airflow DAGs"],["Week 10","Dashboard & Defense","This dashboard + docs + viva"]].map(([w,t,d])=>(<div key={w} className="bg-white/5 rounded-xl p-3"><b>{w}</b><div className="font-bold mt-1">{t}</div><div className="text-slate-400 mt-1">{d}</div></div>))}</div></section>
    </div>)}

    <footer className="text-center text-xs text-slate-500 py-4">FraudStream · Real-Time Fraud Detection & Financial Anomaly Streaming Platform · CSE499 Capstone · Kafka · Flink · MinIO/S3 · DuckDB/Snowflake · dbt · API: <code>/api/transactions</code> · <code>/api/health</code></footer>
  </div></main>);
}
