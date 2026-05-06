import { useState, useEffect, useRef } from "react";

/* ───────────────────────────────────────────────
   GLOBAL STYLES
─────────────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; background: #F4F0EB; }
body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1C1917; }
::-webkit-scrollbar { width: 0; }
input, select, textarea, button { font-family: inherit; }
input[type=date], input[type=time] { color-scheme: light; }
select option { background: #fff; }

:root {
  --bg:       #F4F0EB;
  --surface:  #FFFFFF;
  --border:   #E8E2D9;
  --muted:    #A89F94;
  --text:     #1C1917;
  --accent:   #E86A2E;
  --accent-l: #FDF0E8;
  --blue:     #2D6BE4;
  --blue-l:   #EBF1FD;
  --green:    #1A9E6A;
  --green-l:  #E6F7F1;
  --purple:   #7B4FD4;
  --purple-l: #F1ECFC;
  --rose:     #D94F6F;
  --rose-l:   #FDEEF3;
  --gold:     #C4820A;
  --gold-l:   #FDF4E1;
  --teal:     #1098A6;
  --teal-l:   #E5F6F8;
  --radius:   18px;
  --shadow:   0 2px 16px rgba(0,0,0,0.07);
  --shadow-l: 0 8px 40px rgba(0,0,0,0.12);
}

/* Animations */
@keyframes slideUp   { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes popIn     { 0%{transform:scale(0.8);opacity:0} 70%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
@keyframes sheetUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes bellRing  { 0%,100%{transform:rotate(0)} 15%{transform:rotate(-18deg)} 30%{transform:rotate(18deg)} 45%{transform:rotate(-12deg)} 60%{transform:rotate(8deg)} 75%{transform:rotate(-4deg)} }
@keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
@keyframes notifIn   { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
@keyframes sparkle   { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-50px) scale(0);opacity:0} }
@keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(232,106,46,0.35)} 70%{box-shadow:0 0 0 12px rgba(232,106,46,0)} 100%{box-shadow:0 0 0 0 rgba(232,106,46,0)} }
@keyframes progressBar { from{width:0} to{width:100%} }

.anim-slide  { animation: slideUp 0.38s cubic-bezier(0.22,1,0.36,1) both; }
.anim-fade   { animation: fadeIn 0.28s ease both; }
.anim-pop    { animation: popIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both; }
.anim-sheet  { animation: sheetUp 0.42s cubic-bezier(0.32,1.12,0.44,1) both; }

/* Tap states */
.tap { cursor:pointer; -webkit-tap-highlight-color:transparent; user-select:none; transition:transform 0.13s, opacity 0.13s; }
.tap:active { transform:scale(0.94); opacity:0.82; }
.tap-scale:active { transform:scale(0.96); }

/* Input focus ring */
.inp-focus:focus { outline:none; border-color:var(--accent) !important; box-shadow:0 0 0 3px rgba(232,106,46,0.15); }
`;

/* ───────────────────────────────────────────────
   DATA
─────────────────────────────────────────────── */
const CATS = [
  { id:"work",     label:"Work",     icon:"💼", color:"var(--blue)",   light:"var(--blue-l)",   hex:"#2D6BE4" },
  { id:"personal", label:"Personal", icon:"🌿", color:"var(--green)",  light:"var(--green-l)",  hex:"#1A9E6A" },
  { id:"health",   label:"Health",   icon:"❤️", color:"var(--rose)",   light:"var(--rose-l)",   hex:"#D94F6F" },
  { id:"social",   label:"Social",   icon:"🎉", color:"var(--purple)", light:"var(--purple-l)", hex:"#7B4FD4" },
  { id:"travel",   label:"Travel",   icon:"✈️", color:"var(--teal)",   light:"var(--teal-l)",   hex:"#1098A6" },
  { id:"reminder", label:"Reminder", icon:"📌", color:"var(--gold)",   light:"var(--gold-l)",   hex:"#C4820A" },
];

const ALERT_OPTS = [
  {v:0,l:"At event time"},{v:5,l:"5 min before"},{v:10,l:"10 min before"},
  {v:15,l:"15 min before"},{v:30,l:"30 min before"},{v:60,l:"1 hour before"},
  {v:120,l:"2 hours before"},{v:1440,l:"1 day before"},
];

const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const HOURS = Array.from({length:24},(_,i)=>i);

/* ───────────────────────────────────────────────
   UTILS
─────────────────────────────────────────────── */
const uid      = () => Math.random().toString(36).slice(2,10);
const pad      = n => String(n).padStart(2,"0");
const toDStr   = (y,m,d) => `${y}-${pad(m+1)}-${pad(d)}`;
const todayStr = () => { const n=new Date(); return toDStr(n.getFullYear(),n.getMonth(),n.getDate()); };
const parseDT  = (date,time) => { const[y,mo,d]=date.split("-").map(Number); const[h,mi]=(time||"00:00").split(":").map(Number); return new Date(y,mo-1,d,h,mi); };
const parseD   = s => { const[y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const fmt12    = t => { if(!t) return ""; const[h,m]=t.split(":").map(Number); return `${h%12||12}:${pad(m)} ${h>=12?"PM":"AM"}`; };
const getCat   = id => CATS.find(c=>c.id===id)||CATS[0];
const getDIM   = (y,m) => new Date(y,m+1,0).getDate();
const getFirst = (y,m) => new Date(y,m,1).getDay();

const relTime = (ms) => {
  if(ms<0) return "Past";
  const m=Math.floor(ms/60000);
  if(m<60) return `${m}m`;
  const h=Math.floor(m/60);
  if(h<24) return `${h}h`;
  return `${Math.floor(h/24)}d`;
};

/* ───────────────────────────────────────────────
   AUDIO
─────────────────────────────────────────────── */
let _ac=null;
const ac=()=>{ if(!_ac) _ac=new(window.AudioContext||window.webkitAudioContext)(); return _ac; };
const beep=(f,d,t="sine",v=0.28)=>{ try{const c=ac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=f;o.type=t;g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+d);o.start();o.stop(c.currentTime+d);}catch{} };
const chime=()=>[[523,0],[659,140],[784,280],[1047,460]].forEach(([f,t])=>setTimeout(()=>beep(f,0.3),t));
const alarmSound=()=>[880,1100,880,1100,1320].forEach((f,i)=>setTimeout(()=>beep(f,0.2,"square",0.25),i*180));
const successSound=()=>{ beep(880,0.08); setTimeout(()=>beep(1100,0.12),100); };

/* ───────────────────────────────────────────────
   STORAGE
─────────────────────────────────────────────── */
const ls = {
  get: (k,fb) => { try{const v=localStorage.getItem(k); return v?JSON.parse(v):fb;}catch{return fb;} },
  set: (k,v) => { try{localStorage.setItem(k,JSON.stringify(v));}catch{} },
};

/* ───────────────────────────────────────────────
   DEFAULT EVENT FORM
─────────────────────────────────────────────── */
const newForm = (date="",time="09:00") => ({
  title:"", date:date||todayStr(), time, endTime:"10:00",
  allDay:false, category:"work", alertMin:10,
  repeat:"none", location:"", notes:"", isAlarm:false, priority:"normal",
});

/* ═══════════════════════════════════════════════
   APP
═══════════════════════════════════════════════ */
export default function App() {
  /* State */
  const [now, setNow]           = useState(new Date());
  const [view, setView]         = useState("month");   // month|week|day|agenda
  const [cursor, setCursor]     = useState(new Date());
  const [events, setEvents]     = useState(() => ls.get("pac5",[]));
  const [fired, setFired]       = useState(() => new Set(ls.get("pac5f",[])));
  const [modal, setModal]       = useState(null);       // null|"form"|"view"|"onboard"
  const [selEv, setSelEv]       = useState(null);
  const [form, setForm]         = useState(newForm());
  const [formMode, setFormMode] = useState("new");      // new|edit
  const [notifs, setNotifs]     = useState([]);
  const [alarmEv, setAlarmEv]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [sparks, setSparks]     = useState([]);
  const alarmRef = useRef(null);

  /* Persist */
  useEffect(()=>ls.set("pac5",events),[events]);
  useEffect(()=>ls.set("pac5f",[...fired]),[fired]);

  /* Onboard */
  useEffect(()=>{ if(!ls.get("pac5ob",false)) setModal("onboard"); },[]);

  /* Clock */
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); },[]);

  /* Alert checker */
  useEffect(()=>{
    const check=()=>{
      const cur=new Date();
      events.forEach(ev=>{
        if(ev.allDay) return;
        const evT=parseDT(ev.date,ev.time);
        const alertT=new Date(evT-Number(ev.alertMin||0)*60000);
        const ak=`a_${ev.id}_${ev.date}`, rk=`r_${ev.id}_${ev.date}`;
        if(!fired.has(ak)&&Math.abs(alertT-cur)<14000){
          const nf=new Set(fired); nf.add(ak); setFired(nf);
          const cat=getCat(ev.category);
          pushNotif(`${cat.icon} ${ev.title}`, ev.alertMin>0?`Starting in ${ev.alertMin} min`:"Starting now!", cat.hex);
          chime();
          if(Notification?.permission==="granted") new Notification("PA Calendar",{body:ev.title});
        }
        if(ev.isAlarm&&!fired.has(rk)&&Math.abs(evT-cur)<14000){
          const nf=new Set(fired); nf.add(rk); setFired(nf);
          setAlarmEv(ev); startAlarm();
        }
      });
    };
    const t=setInterval(check,8000); check(); return ()=>clearInterval(t);
  },[events,fired]);

  const startAlarm=()=>{ stopAlarm(); alarmSound(); alarmRef.current=setInterval(alarmSound,2000); };
  const stopAlarm =()=>{ if(alarmRef.current){clearInterval(alarmRef.current);alarmRef.current=null;} };
  const dismiss   =()=>{ stopAlarm(); setAlarmEv(null); };
  const snooze    =(mins)=>{
    stopAlarm();
    const orig=parseDT(alarmEv.date,alarmEv.time), at=new Date(orig.getTime()+mins*60000);
    setEvents(p=>[...p,{...alarmEv,id:uid(),time:`${pad(at.getHours())}:${pad(at.getMinutes())}`,title:`↩ ${alarmEv.title}`,alertMin:0}]);
    pushNotif("⏱ Snoozed",`"${alarmEv.title}" coming back in ${mins} min`,"#C4820A");
    setAlarmEv(null);
  };

  const pushNotif=(title,body,color="#2D6BE4")=>{
    const id=uid();
    setNotifs(p=>[{id,title,body,color},...p.slice(0,3)]);
    setTimeout(()=>setNotifs(p=>p.filter(n=>n.id!==id)),7000);
  };

  const addSparks=(x,y)=>{
    const items=["✨","⭐","💫"].map(e=>({id:uid(),e,x:x+(Math.random()-0.5)*40,y:y+(Math.random()-0.5)*40}));
    setSparks(p=>[...p,...items]);
    setTimeout(()=>setSparks(p=>p.filter(s=>!items.find(i=>i.id===s.id))),900);
  };

  /* CRUD */
  const openNew=(date="",time="",clientX,clientY)=>{
    setForm(newForm(date,time)); setFormMode("new"); setModal("form");
    if(clientX) addSparks(clientX,clientY);
  };
  const openEdit=(ev)=>{ setForm({...ev}); setFormMode("edit"); setModal("form"); };
  const openView=(ev)=>{ setSelEv(ev); setModal("view"); };
  const closeM  =()=>{ setModal(null); setSelEv(null); };

  const saveForm=async()=>{
    if(!form.title.trim()) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,280));
    const ev={...form,id:form.id||uid(),alertMin:Number(form.alertMin||0)};
    if(formMode==="edit"){ setEvents(p=>p.map(e=>e.id===ev.id?ev:e)); }
    else { setEvents(p=>[...p,ev]); successSound(); }
    setSaving(false); closeM();
    const cat=getCat(ev.category);
    pushNotif(formMode==="edit"?"✅ Event updated":"✅ Event saved",ev.title,cat.hex);
  };

  const deleteEv=(id)=>{
    const ev=events.find(e=>e.id===id);
    setEvents(p=>p.filter(e=>e.id!==id));
    closeM();
    if(ev) pushNotif("🗑 Deleted",ev.title,"#D94F6F");
  };

  /* Calendar math */
  const cy=cursor.getFullYear(), cm=cursor.getMonth();
  const dim=getDIM(cy,cm), fd=getFirst(cy,cm);
  const cells=[...Array(fd).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
  while(cells.length%7) cells.push(null);

  const evOn=ds=>events.filter(e=>e.date===ds).sort((a,b)=>(a.time||"").localeCompare(b.time||""));

  /* Week */
  const wkStart=new Date(cursor); wkStart.setDate(wkStart.getDate()-wkStart.getDay()); wkStart.setHours(0,0,0,0);
  const wkDays=Array.from({length:7},(_,i)=>{ const d=new Date(wkStart); d.setDate(wkStart.getDate()+i); return d; });

  /* Upcoming for agenda */
  const upcoming=[...events]
    .filter(e=>parseDT(e.date,e.time||"00:00")>=now)
    .sort((a,b)=>parseDT(a.date,a.time||"00:00")-parseDT(b.date,b.time||"00:00"))
    .slice(0,20);

  /* Grouped agenda by date */
  const agendaGroups=upcoming.reduce((acc,ev)=>{ (acc[ev.date]||(acc[ev.date]=[])).push(ev); return acc; },{});

  /* Nav */
  const goNext=()=>setCursor(c=>{ const d=new Date(c); if(view==="month")d.setMonth(d.getMonth()+1); else if(view==="week")d.setDate(d.getDate()+7); else d.setDate(d.getDate()+1); return d; });
  const goPrev=()=>setCursor(c=>{ const d=new Date(c); if(view==="month")d.setMonth(d.getMonth()-1); else if(view==="week")d.setDate(d.getDate()-7); else d.setDate(d.getDate()-1); return d; });
  const goToday=()=>setCursor(new Date());

  /* View label */
  const viewLabel=()=>{
    if(view==="month") return MONTH_NAMES[cm]+" "+cy;
    if(view==="week"){ const e=new Date(wkStart); e.setDate(wkStart.getDate()+6); return `${MONTH_SHORT[wkStart.getMonth()]} ${wkStart.getDate()} – ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}, ${cy}`; }
    if(view==="day") return `${DAY_NAMES[cursor.getDay()]}, ${MONTH_SHORT[cursor.getMonth()]} ${cursor.getDate()}, ${cy}`;
    return "Agenda";
  };

  /* Time grid helpers */
  const nowPct=(now.getHours()*60+now.getMinutes())/1440*100;
  const etop =t=>{ const[h,m]=t.split(":").map(Number); return(h*60+m)/1440*100; };
  const eheight=(t,e)=>{ if(!e) return 3; const[h1,m1]=t.split(":").map(Number),[h2,m2]=e.split(":").map(Number); return Math.max(((h2*60+m2)-(h1*60+m1))/1440*100,2.5); };

  const todayEvs=evOn(todayStr());
  const todayDStr=toDStr(cursor.getFullYear(),cursor.getMonth(),cursor.getDate());

  /* ═══════ RENDER ═══════ */
  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"var(--bg)",fontFamily:"'Plus Jakarta Sans',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{G}</style>

      {/* Sparkles */}
      {sparks.map(s=>(
        <div key={s.id} style={{position:"fixed",left:s.x,top:s.y,fontSize:16,zIndex:9999,pointerEvents:"none",animation:"sparkle 0.8s ease forwards"}}>{s.e}</div>
      ))}

      {/* ── NOTIFICATIONS ── */}
      <div style={{position:"fixed",top:12,right:12,zIndex:1100,display:"flex",flexDirection:"column",gap:8,maxWidth:300}}>
        {notifs.map(n=>(
          <div key={n.id} className="tap" style={{background:"#fff",borderRadius:14,padding:"11px 15px",boxShadow:"var(--shadow-l)",borderLeft:`4px solid ${n.color}`,display:"flex",gap:10,animation:"notifIn 0.32s ease"}}
            onClick={()=>setNotifs(p=>p.filter(x=>x.id!==n.id))}>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:13,color:"var(--text)"}}>{n.title}</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:1}}>{n.body}</div>
            </div>
            <span style={{color:"var(--muted)",fontSize:14,lineHeight:1.2}}>×</span>
          </div>
        ))}
      </div>

      {/* ── ALARM SCREEN ── */}
      {alarmEv&&(()=>{
        const cat=getCat(alarmEv.category);
        return (
          <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(28,25,23,0.72)",backdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} className="anim-fade">
            <div className="anim-pop" style={{background:"#fff",borderRadius:28,padding:"36px 28px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.25)"}}>
              <div style={{fontSize:60,animation:"bellRing 0.7s ease infinite",display:"inline-block",marginBottom:12}}>⏰</div>
              <div style={{fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:cat.hex,marginBottom:8}}>{cat.icon} {cat.label}</div>
              <div style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:6,lineHeight:1.25,fontFamily:"'Fraunces',serif"}}>{alarmEv.title}</div>
              <div style={{fontSize:42,fontWeight:900,color:cat.hex,letterSpacing:-1,marginBottom:alarmEv.location?6:24}}>{fmt12(alarmEv.time)}</div>
              {alarmEv.location&&<div style={{fontSize:13,color:"var(--muted)",marginBottom:20}}>📍 {alarmEv.location}</div>}
              {alarmEv.notes&&<div style={{fontSize:12,color:"var(--muted)",marginBottom:20,fontStyle:"italic"}}>{alarmEv.notes}</div>}

              <button className="tap" style={{width:"100%",padding:16,background:cat.hex,border:"none",borderRadius:14,color:"#fff",fontSize:16,fontWeight:800,marginBottom:12,cursor:"pointer"}} onClick={dismiss}>
                Dismiss Alarm
              </button>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[5,10].map(m=>(
                  <button key={m} className="tap" style={{padding:12,background:"var(--bg)",border:"2px solid var(--border)",borderRadius:12,color:"var(--text)",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={()=>snooze(m)}>
                    ⏱ {m} min
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ONBOARDING ── */}
      {modal==="onboard"&&(
        <div style={{position:"fixed",inset:0,zIndex:1900,background:"linear-gradient(145deg,#E86A2E,#C4520A)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}} className="anim-fade">
          <div className="anim-pop" style={{background:"#fff",borderRadius:28,padding:"40px 28px",maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:64,marginBottom:16}}>📅</div>
            <div style={{fontSize:30,fontWeight:900,fontFamily:"'Fraunces',serif",color:"var(--text)",marginBottom:8,lineHeight:1.2}}>Your Personal<br/>PA Calendar</div>
            <div style={{fontSize:14,color:"var(--muted)",marginBottom:28,lineHeight:1.7}}>Schedule events, set smart alerts, and never miss what matters.</div>
            {[["⏰","Smart Alarms","Rings even in silent mode"],["🔔","Early Alerts","Get notified before it's too late"],["📋","4 Views","Month, Week, Day & Agenda"]].map(([ic,t,s])=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:"var(--bg)",borderRadius:14,marginBottom:10,textAlign:"left"}}>
                <span style={{fontSize:26,flexShrink:0}}>{ic}</span>
                <div><div style={{fontWeight:700,fontSize:14}}>{t}</div><div style={{fontSize:12,color:"var(--muted)"}}>{s}</div></div>
              </div>
            ))}
            <button className="tap" style={{width:"100%",marginTop:8,padding:16,background:"var(--accent)",border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer"}} onClick={()=>{ ls.set("pac5ob",true); setModal(null); if(Notification?.permission==="default") Notification?.requestPermission(); }}>
              Let's Go! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{background:"var(--surface)",padding:"14px 18px 12px",borderBottom:"1px solid var(--border)",flexShrink:0,boxShadow:"0 1px 8px rgba(0,0,0,0.05)"}}>
        {/* Row 1 – Date + Time */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"var(--muted)",letterSpacing:1,textTransform:"uppercase"}}>
              {now.toLocaleDateString([],{weekday:"long"})}
            </div>
            <div style={{fontSize:20,fontWeight:800,color:"var(--text)",fontFamily:"'Fraunces',serif",lineHeight:1.15}}>
              {now.toLocaleDateString([],{month:"long",day:"numeric",year:"numeric"})}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:26,fontWeight:800,color:"var(--accent)",fontFamily:"'Fraunces',serif",lineHeight:1,letterSpacing:-0.5}}>
              {now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
            </div>
            <div style={{fontSize:11,color:"var(--muted)",fontWeight:600,marginTop:1}}>:{pad(now.getSeconds())}</div>
          </div>
        </div>

        {/* Row 2 – Stats + Add Button */}
        <div style={{display:"flex",gap:8,alignItems:"stretch"}}>
          {[
            {l:"Today",     v:todayEvs.length, c:"var(--blue)", bg:"var(--blue-l)"},
            {l:"Upcoming",  v:events.filter(e=>parseDT(e.date,e.time||"00:00")>=now).length, c:"var(--green)", bg:"var(--green-l)"},
            {l:"Alarms",    v:events.filter(e=>e.isAlarm).length, c:"var(--rose)", bg:"var(--rose-l)"},
          ].map(s=>(
            <div key={s.l} style={{flex:1,background:s.bg,borderRadius:12,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9,fontWeight:700,color:s.c,opacity:0.75,marginTop:2,letterSpacing:0.5}}>{s.l.toUpperCase()}</div>
            </div>
          ))}
          <button className="tap" aria-label="Add new event"
            style={{padding:"8px 16px",background:"var(--accent)",border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",gap:5}}
            onClick={e=>openNew("","",e.clientX,e.clientY)}>
            <span style={{fontSize:18,lineHeight:1}}>+</span> Add
          </button>
        </div>

        {/* Row 3 – Navigation */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}>
          <button className="tap" aria-label="Previous" style={{width:38,height:38,background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:10,cursor:"pointer",fontSize:20,color:"var(--text)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}} onClick={goPrev}>‹</button>
          <button className="tap" style={{fontSize:14,fontWeight:800,color:"var(--text)",background:"none",border:"none",cursor:"pointer",padding:"6px 10px"}} onClick={goToday}>
            {viewLabel()}
          </button>
          <button className="tap" aria-label="Next" style={{width:38,height:38,background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:10,cursor:"pointer",fontSize:20,color:"var(--text)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}} onClick={goNext}>›</button>
        </div>
      </header>

      {/* ── SCROLL AREA ── */}
      <div style={{flex:1,overflow:"auto",position:"relative"}}>

        {/* ══ MONTH VIEW ══ */}
        {view==="month"&&(
          <div className="anim-fade">
            {/* Day headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"var(--surface)",borderBottom:"1px solid var(--border)",position:"sticky",top:0,zIndex:10}}>
              {DAY_NAMES.map(d=>(
                <div key={d} style={{textAlign:"center",padding:"8px 0",fontSize:10,fontWeight:800,color:"var(--muted)",letterSpacing:1}}>{d[0]}</div>
              ))}
            </div>
            {/* Grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"1px",background:"var(--border)",padding:"1px"}}>
              {cells.map((day,i)=>{
                if(!day) return <div key={`g${i}`} style={{background:"var(--bg)",minHeight:76}}/>;
                const ds=toDStr(cy,cm,day), dayEvs=evOn(ds), isT=ds===todayStr();
                return (
                  <div key={ds} role="button" aria-label={`${MONTH_NAMES[cm]} ${day}`} className="tap-scale"
                    style={{background:isT?"#FFFBF4":"var(--surface)",minHeight:76,padding:"6px 4px",cursor:"pointer",border:isT?"2px solid var(--accent)":"2px solid transparent",transition:"background 0.15s"}}
                    onClick={e=>{ setCursor(new Date(cy,cm,day)); openNew(ds,"",e.clientX,e.clientY); }}>
                    {/* Day number */}
                    <div style={{display:"flex",justifyContent:"center",marginBottom:3}}>
                      <span style={{width:24,height:24,borderRadius:"50%",background:isT?"var(--accent)":"transparent",color:isT?"#fff":"var(--text)",fontSize:12,fontWeight:isT?900:600,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                        {day}
                      </span>
                    </div>
                    {/* Events */}
                    {dayEvs.slice(0,2).map(ev=>{
                      const cat=getCat(ev.category);
                      return (
                        <div key={ev.id} role="button" aria-label={ev.title} className="tap"
                          style={{background:cat.light,borderRadius:5,padding:"2px 5px",marginBottom:2,display:"flex",alignItems:"center",gap:3,overflow:"hidden"}}
                          onClick={e=>{ e.stopPropagation(); openView(ev); }}>
                          <span style={{fontSize:8}}>{ev.isAlarm?"⏰":cat.icon}</span>
                          <span style={{fontSize:9,fontWeight:700,color:cat.hex,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvs.length>2&&<div style={{fontSize:9,color:"var(--muted)",textAlign:"center",fontWeight:700}}>+{dayEvs.length-2} more</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ WEEK VIEW ══ */}
        {view==="week"&&(
          <div className="anim-fade" style={{display:"flex",flexDirection:"column",height:"100%"}}>
            {/* Day headers */}
            <div style={{display:"flex",background:"var(--surface)",borderBottom:"1px solid var(--border)",position:"sticky",top:0,zIndex:10,flexShrink:0}}>
              <div style={{width:44,flexShrink:0}}/>
              {wkDays.map((d,i)=>{
                const ds=toDStr(d.getFullYear(),d.getMonth(),d.getDate()), isT=ds===todayStr(), cnt=evOn(ds).length;
                return (
                  <div key={i} className="tap" style={{flex:1,textAlign:"center",padding:"8px 2px",cursor:"pointer"}}
                    onClick={()=>{ setCursor(new Date(d)); setView("day"); }}>
                    <div style={{fontSize:9,fontWeight:800,color:"var(--muted)",letterSpacing:1}}>{DAY_NAMES[d.getDay()]}</div>
                    <div style={{width:28,height:28,borderRadius:"50%",background:isT?"var(--accent)":"transparent",color:isT?"#fff":"var(--text)",fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",margin:"3px auto"}}>
                      {d.getDate()}
                    </div>
                    {cnt>0&&<div style={{width:5,height:5,borderRadius:"50%",background:isT?"var(--accent)":"var(--blue)",margin:"1px auto 0"}}/>}
                  </div>
                );
              })}
            </div>
            {/* Time grid */}
            <div style={{display:"flex",overflow:"auto",flex:1}}>
              <div style={{width:44,flexShrink:0,background:"var(--surface)",borderRight:"1px solid var(--border)"}}>
                {HOURS.map(h=>(
                  <div key={h} style={{height:60,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:6,paddingTop:2,fontSize:9,color:"var(--muted)",fontWeight:600}}>
                    {h===0?"":h<12?`${h}a`:h===12?"12p":`${h-12}p`}
                  </div>
                ))}
              </div>
              <div style={{flex:1,position:"relative",minWidth:0}}>
                {HOURS.map(h=>(
                  <div key={h} style={{height:60,borderBottom:"1px solid var(--border)"}}/>
                ))}
                {/* Now line */}
                <div style={{position:"absolute",top:`${nowPct}%`,left:0,right:0,height:2,background:"var(--accent)",zIndex:5,display:"flex",alignItems:"center"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",marginLeft:-4,flexShrink:0,boxShadow:"0 0 0 3px rgba(232,106,46,0.25)"}}/>
                </div>
                {/* Events */}
                {wkDays.map((d,di)=>{
                  const ds=toDStr(d.getFullYear(),d.getMonth(),d.getDate());
                  return evOn(ds).filter(e=>!e.allDay).map(ev=>{
                    const cat=getCat(ev.category), colW=100/7, colX=di*colW;
                    return (
                      <div key={ev.id} className="tap" style={{
                        position:"absolute",left:`${colX+0.3}%`,width:`${colW-0.6}%`,
                        top:`${etop(ev.time)*60*24/100}px`,
                        height:`${Math.max(eheight(ev.time,ev.endTime)*60*24/100,24)}px`,
                        background:cat.light,borderRadius:7,padding:"3px 4px",
                        border:`1.5px solid ${cat.hex}30`,overflow:"hidden",zIndex:3,
                      }} onClick={()=>openView(ev)}>
                        <div style={{fontSize:9,fontWeight:800,color:cat.hex,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{ev.title}</div>
                        <div style={{fontSize:8,color:cat.hex,opacity:0.75}}>{fmt12(ev.time)}</div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ DAY VIEW ══ */}
        {view==="day"&&(
          <div className="anim-fade">
            {/* Day banner */}
            <div style={{background:"var(--surface)",padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--muted)"}}>{DAY_NAMES[cursor.getDay()]}</div>
                <div style={{fontSize:30,fontWeight:900,color:toDStr(cursor.getFullYear(),cursor.getMonth(),cursor.getDate())===todayStr()?"var(--accent)":"var(--text)",fontFamily:"'Fraunces',serif",lineHeight:1}}>
                  {cursor.getDate()}
                </div>
                <div style={{fontSize:13,color:"var(--muted)"}}>{MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}</div>
              </div>
              <button className="tap" style={{padding:"10px 18px",background:"var(--accent)",border:"none",borderRadius:12,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}
                onClick={e=>openNew(todayDStr,"",e.clientX,e.clientY)}>
                + Add Event
              </button>
            </div>

            {/* Time grid */}
            <div style={{display:"flex"}}>
              <div style={{width:52,flexShrink:0}}>
                {HOURS.map(h=>(
                  <div key={h} style={{height:64,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:8,paddingTop:3,fontSize:10,color:"var(--muted)",fontWeight:600}}>
                    {h===0?"":h<12?`${h}am`:h===12?"12pm":`${h-12}pm`}
                  </div>
                ))}
              </div>
              <div style={{flex:1,position:"relative",marginRight:10}}
                onClick={e=>{
                  if(e.target===e.currentTarget){
                    const r=e.currentTarget.getBoundingClientRect(), pct=(e.clientY-r.top)/r.height;
                    const mins=Math.round(pct*1440/30)*30, h=Math.floor(mins/60), m=mins%60;
                    openNew(todayDStr,`${pad(h)}:${pad(m)}`,e.clientX,e.clientY);
                  }
                }}>
                {HOURS.map(h=><div key={h} style={{height:64,borderBottom:"1px solid var(--border)"}}/>)}
                <div style={{position:"absolute",top:`${nowPct}%`,left:0,right:0,height:2,background:"var(--accent)",zIndex:5,display:"flex",alignItems:"center"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",marginLeft:-4,boxShadow:"0 0 0 3px rgba(232,106,46,0.25)"}}/>
                </div>
                {evOn(todayDStr).filter(e=>!e.allDay).map(ev=>{
                  const cat=getCat(ev.category), tp=etop(ev.time)*64*24/100, ht=Math.max(eheight(ev.time,ev.endTime)*64*24/100,36);
                  return (
                    <div key={ev.id} className="tap" style={{
                      position:"absolute",left:4,right:4,top:tp,height:ht,
                      background:`linear-gradient(135deg,${cat.light},${cat.hex}10)`,
                      borderRadius:14,padding:"8px 12px",
                      border:`2px solid ${cat.hex}25`,overflow:"hidden",zIndex:3,
                    }} onClick={()=>openView(ev)}>
                      <div style={{fontWeight:800,fontSize:14,color:cat.hex,marginBottom:2}}>{ev.isAlarm?"⏰ ":cat.icon+" "}{ev.title}</div>
                      <div style={{fontSize:12,color:cat.hex,opacity:0.8}}>{fmt12(ev.time)}{ev.endTime?" – "+fmt12(ev.endTime):""}</div>
                      {ev.location&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>📍 {ev.location}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Empty state */}
            {evOn(todayDStr).length===0&&(
              <div style={{textAlign:"center",padding:"40px 20px",color:"var(--muted)"}}>
                <div style={{fontSize:48,marginBottom:10}}>🌤️</div>
                <div style={{fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:6}}>Free day!</div>
                <div style={{fontSize:13,marginBottom:20}}>Tap the time grid to add an event</div>
              </div>
            )}
          </div>
        )}

        {/* ══ AGENDA VIEW ══ */}
        {view==="agenda"&&(
          <div className="anim-fade" style={{padding:"16px 14px 20px"}}>
            {upcoming.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:60,marginBottom:14}}>🎉</div>
                <div style={{fontSize:22,fontWeight:800,fontFamily:"'Fraunces',serif",color:"var(--text)",marginBottom:8}}>All clear!</div>
                <div style={{fontSize:14,color:"var(--muted)",marginBottom:24}}>No upcoming events. Enjoy the calm!</div>
                <button className="tap" style={{padding:"14px 28px",background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}
                  onClick={e=>openNew("","",e.clientX,e.clientY)}>
                  + Create First Event
                </button>
              </div>
            ):(
              Object.entries(agendaGroups).map(([ds,dayEvs],gi)=>{
                const d=parseD(ds), isT=ds===todayStr();
                return (
                  <div key={ds} className="anim-slide" style={{marginBottom:16,animationDelay:`${gi*0.04}s`}}>
                    {/* Date label */}
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                      <div style={{width:46,height:46,borderRadius:14,background:isT?"var(--accent)":"var(--surface)",border:isT?"none":"1.5px solid var(--border)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:isT?"0 4px 14px rgba(232,106,46,0.3)":"none"}}>
                        <span style={{fontSize:9,fontWeight:800,color:isT?"rgba(255,255,255,0.8)":"var(--muted)",letterSpacing:1}}>{DAY_NAMES[d.getDay()].toUpperCase()}</span>
                        <span style={{fontSize:18,fontWeight:900,color:isT?"#fff":"var(--text)",fontFamily:"'Fraunces',serif",lineHeight:1}}>{d.getDate()}</span>
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:isT?"var(--accent)":"var(--text)"}}>{isT?"Today – ":""}{MONTH_NAMES[d.getMonth()]} {d.getFullYear()}</div>
                        <div style={{fontSize:12,color:"var(--muted)"}}>{dayEvs.length} event{dayEvs.length!==1?"s":""}</div>
                      </div>
                    </div>
                    {/* Events */}
                    {dayEvs.map((ev,ei)=>{
                      const cat=getCat(ev.category), t=parseDT(ev.date,ev.time||"00:00"), ms=t-now;
                      return (
                        <div key={ev.id} className="tap" style={{
                          display:"flex",alignItems:"stretch",gap:0,
                          background:"var(--surface)",borderRadius:16,marginBottom:8,
                          boxShadow:"var(--shadow)",overflow:"hidden",
                          border:`1px solid var(--border)`,
                          animationDelay:`${(gi*5+ei)*0.03}s`,
                        }} onClick={()=>openView(ev)}>
                          <div style={{width:5,background:cat.hex,flexShrink:0,borderRadius:"0 0 0 0"}}/>
                          <div style={{flex:1,padding:"14px 14px"}}>
                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                                  <span style={{fontSize:15}}>{ev.isAlarm?"⏰":cat.icon}</span>
                                  <span style={{fontWeight:800,fontSize:15,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</span>
                                </div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:"3px 10px",fontSize:12,color:"var(--muted)"}}>
                                  {!ev.allDay&&<span>🕐 {fmt12(ev.time)}{ev.endTime?" – "+fmt12(ev.endTime):""}</span>}
                                  {ev.allDay&&<span>📆 All day</span>}
                                  {ev.location&&<span>📍 {ev.location}</span>}
                                  <span style={{fontWeight:700,color:cat.hex}}>{cat.icon} {cat.label}</span>
                                </div>
                                {ev.notes&&<div style={{fontSize:12,color:"var(--muted)",marginTop:6,fontStyle:"italic",lineHeight:1.4}}>{ev.notes.slice(0,80)}{ev.notes.length>80?"…":""}</div>}
                              </div>
                              {ms>0&&(
                                <div style={{textAlign:"center",background:cat.light,borderRadius:10,padding:"6px 10px",flexShrink:0,minWidth:44}}>
                                  <div style={{fontSize:14,fontWeight:900,color:cat.hex}}>{relTime(ms)}</div>
                                  <div style={{fontSize:8,color:cat.hex,fontWeight:700,opacity:0.7}}>LEFT</div>
                                </div>
                              )}
                              {ms<=0&&<div style={{fontSize:11,color:"var(--muted)",background:"var(--bg)",borderRadius:8,padding:"4px 8px",fontWeight:600,alignSelf:"flex-start"}}>Done</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}

            {/* All events section */}
            {events.length>0&&(
              <div style={{marginTop:8}}>
                <div style={{fontSize:11,fontWeight:800,color:"var(--muted)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>All Events ({events.length})</div>
                {[...events].sort((a,b)=>a.date.localeCompare(b.date)||(a.time||"").localeCompare(b.time||"")).map(ev=>{
                  const cat=getCat(ev.category);
                  return (
                    <div key={ev.id} className="tap" style={{display:"flex",alignItems:"center",gap:12,background:"var(--surface)",borderRadius:12,padding:"11px 14px",marginBottom:7,boxShadow:"var(--shadow)"}} onClick={()=>openView(ev)}>
                      <div style={{width:36,height:36,borderRadius:11,background:cat.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ev.isAlarm?"⏰":cat.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                        <div style={{fontSize:11,color:"var(--muted)"}}>{ev.date}{ev.allDay?" · All day":ev.time?" · "+fmt12(ev.time):""}</div>
                      </div>
                      <div style={{width:8,height:8,borderRadius:"50%",background:cat.hex,flexShrink:0}}/>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>{/* end scroll area */}

      {/* ── BOTTOM NAV ── */}
      <nav aria-label="Main navigation" style={{background:"var(--surface)",borderTop:"1px solid var(--border)",display:"flex",flexShrink:0,boxShadow:"0 -2px 12px rgba(0,0,0,0.06)"}}>
        {[
          {id:"month",  label:"Month",  icon:"📅"},
          {id:"week",   label:"Week",   icon:"📆"},
          {id:"day",    label:"Day",    icon:"🌅"},
          {id:"agenda", label:"Agenda", icon:"📋"},
        ].map(v=>{
          const active=view===v.id;
          return (
            <button key={v.id} role="tab" aria-selected={active} aria-label={v.label} className="tap"
              style={{flex:1,padding:"10px 8px 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,outline:"none"}}
              onClick={()=>setView(v.id)}>
              <span style={{fontSize:21,filter:active?"none":"grayscale(1)",opacity:active?1:0.4,transition:"all 0.2s"}}>{v.icon}</span>
              <span style={{fontSize:10,fontWeight:active?800:600,color:active?"var(--accent)":"var(--muted)",transition:"color 0.2s",letterSpacing:0.3}}>{v.label}</span>
              {active&&<div style={{width:20,height:3,borderRadius:99,background:"var(--accent)",animation:"popIn 0.28s ease"}}/>}
            </button>
          );
        })}
      </nav>

      {/* ══════════ EVENT FORM SHEET ══════════ */}
      {modal==="form"&&(
        <div className="anim-fade" style={{position:"fixed",inset:0,zIndex:900,background:"rgba(28,25,23,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end"}} onClick={closeM}>
          <div className="anim-sheet" style={{background:"var(--surface)",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:540,maxHeight:"92vh",overflowY:"auto",paddingBottom:24,margin:"0 auto"}} onClick={e=>e.stopPropagation()}>
            {/* Handle */}
            <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:40,height:4,borderRadius:99,background:"var(--border)"}}/></div>

            {/* Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 20px 16px"}}>
              <div style={{fontSize:20,fontWeight:900,fontFamily:"'Fraunces',serif",color:"var(--text)"}}>
                {formMode==="edit"?"Edit Event":"New Event"}
              </div>
              <button className="tap" aria-label="Close" style={{width:34,height:34,background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:10,cursor:"pointer",fontSize:18,color:"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={closeM}>×</button>
            </div>

            <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:16}}>

              {/* Title */}
              <div>
                <input aria-label="Event title" className="inp-focus"
                  autoFocus
                  style={{width:"100%",fontSize:18,fontWeight:700,border:"none",borderBottom:"2.5px solid var(--border)",padding:"8px 0",color:"var(--text)",background:"transparent",transition:"border-color 0.2s"}}
                  placeholder="What's this event? ✏️"
                  value={form.title}
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                />
              </div>

              {/* Category */}
              <div>
                <Label>Category</Label>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:6}}>
                  {CATS.map(c=>{
                    const active=form.category===c.id;
                    return (
                      <button key={c.id} aria-pressed={active} className="tap"
                        style={{padding:"7px 12px",border:"none",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.15s",background:active?c.hex:c.light,color:active?"#fff":c.hex,transform:active?"scale(1.04)":"scale(1)"}}
                        onClick={()=>setForm(f=>({...f,category:c.id}))}>
                        {c.icon} {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date + All Day */}
              <Row2>
                <FGrp label="📅 Date">
                  <Inp type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} aria="Event date"/>
                </FGrp>
                <FGrp label="📆 All Day">
                  <Toggle on={form.allDay} onToggle={()=>setForm(f=>({...f,allDay:!f.allDay}))} label={form.allDay?"Yes":"No"} color="var(--blue)"/>
                </FGrp>
              </Row2>

              {/* Start + End Time */}
              {!form.allDay&&(
                <Row2>
                  <FGrp label="🕐 Start Time">
                    <Inp type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} aria="Start time"/>
                  </FGrp>
                  <FGrp label="🏁 End Time">
                    <Inp type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} aria="End time"/>
                  </FGrp>
                </Row2>
              )}

              {/* Location */}
              <FGrp label="📍 Location">
                <Inp placeholder="Add a location (optional)" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} aria="Location"/>
              </FGrp>

              {/* Alert + Repeat */}
              <Row2>
                <FGrp label="🔔 Alert Me">
                  <Select value={form.alertMin} onChange={e=>setForm(f=>({...f,alertMin:e.target.value}))} aria="Alert time">
                    {ALERT_OPTS.map(a=><option key={a.v} value={a.v}>{a.l}</option>)}
                  </Select>
                </FGrp>
                <FGrp label="🔁 Repeat">
                  <Select value={form.repeat} onChange={e=>setForm(f=>({...f,repeat:e.target.value}))} aria="Repeat">
                    <option value="none">Never</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </FGrp>
              </Row2>

              {/* Notes */}
              <FGrp label="📝 Notes">
                <textarea aria-label="Notes" className="inp-focus"
                  style={{width:"100%",background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:11,padding:"10px 12px",fontSize:13,color:"var(--text)",height:72,resize:"none",transition:"border-color 0.2s,box-shadow 0.2s"}}
                  placeholder="Add notes or extra details…"
                  value={form.notes}
                  onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                />
              </FGrp>

              {/* Priority + Alarm */}
              <Row2>
                <FGrp label="🚦 Priority">
                  <div style={{display:"flex",gap:6}}>
                    {[["low","Low","var(--green)"],["normal","Med","var(--gold)"],["high","High","var(--rose)"]].map(([v,l,c])=>(
                      <button key={v} aria-pressed={form.priority===v} className="tap"
                        style={{flex:1,padding:"8px 0",border:"none",borderRadius:9,cursor:"pointer",fontSize:11,fontWeight:700,background:form.priority===v?c:c+"22",color:form.priority===v?"#fff":c,transition:"all 0.15s"}}
                        onClick={()=>setForm(f=>({...f,priority:v}))}>
                        {l}
                      </button>
                    ))}
                  </div>
                </FGrp>
                <FGrp label="⏰ Ring Alarm">
                  <Toggle on={form.isAlarm} onToggle={()=>setForm(f=>({...f,isAlarm:!f.isAlarm}))} label={form.isAlarm?"On":"Off"} color="var(--rose)"/>
                </FGrp>
              </Row2>

              {/* Alarm tip */}
              {form.isAlarm&&(
                <div className="anim-slide" style={{background:"var(--rose-l)",borderRadius:12,padding:"10px 14px",display:"flex",gap:10,alignItems:"center",fontSize:12,color:"var(--rose)",fontWeight:600}}>
                  <span style={{fontSize:18}}>⏰</span>
                  Will ring at {fmt12(form.time)} — even in silent mode
                </div>
              )}

              {/* Buttons */}
              <div style={{display:"flex",gap:10,paddingBottom:4}}>
                {formMode==="edit"&&(
                  <button className="tap" aria-label="Delete event" style={{padding:"14px 18px",background:"var(--rose-l)",border:"1.5px solid var(--rose)",borderRadius:14,color:"var(--rose)",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={()=>deleteEv(form.id)}>
                    🗑
                  </button>
                )}
                <button className="tap" aria-label="Cancel" style={{padding:"14px 16px",background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:14,color:"var(--muted)",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={closeM}>
                  Cancel
                </button>
                <button className="tap" aria-label={formMode==="edit"?"Update event":"Save event"}
                  style={{flex:1,padding:14,background:saving?"var(--border)":"var(--accent)",border:"none",borderRadius:14,color:saving?"var(--muted)":"#fff",fontSize:15,fontWeight:800,cursor:saving?"not-allowed":"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
                  onClick={saveForm} disabled={saving}>
                  {saving?(
                    <>{[0,1,2].map(i=><span key={i} style={{width:7,height:7,borderRadius:"50%",background:"var(--muted)",display:"inline-block",animation:`dotBounce 1s ease infinite`,animationDelay:`${i*0.16}s`}}/>)}</>
                  ):(
                    formMode==="edit"?"✓ Update Event":"✓ Save Event"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ VIEW EVENT SHEET ══════════ */}
      {modal==="view"&&selEv&&(()=>{
        const ev=selEv, cat=getCat(ev.category), t=parseDT(ev.date,ev.time||"00:00"), inFuture=t>now;
        return (
          <div className="anim-fade" style={{position:"fixed",inset:0,zIndex:900,background:"rgba(28,25,23,0.55)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end"}} onClick={closeM}>
            <div className="anim-sheet" style={{background:"var(--surface)",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:540,maxHeight:"80vh",overflowY:"auto",paddingBottom:28,margin:"0 auto"}} onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:40,height:4,borderRadius:99,background:"var(--border)"}}/></div>

              {/* Event header card */}
              <div style={{margin:"0 16px",borderRadius:18,background:`linear-gradient(135deg,${cat.light},${cat.hex}18)`,padding:"18px 18px",marginBottom:16,border:`1.5px solid ${cat.hex}20`}}>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{width:50,height:50,borderRadius:14,background:cat.hex,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:`0 4px 12px ${cat.hex}40`}}>
                    {ev.isAlarm?"⏰":cat.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:20,fontWeight:900,color:"var(--text)",fontFamily:"'Fraunces',serif",lineHeight:1.2,marginBottom:4}}>{ev.title}</div>
                    <div style={{fontSize:12,fontWeight:700,color:cat.hex}}>{cat.icon} {cat.label} · {ev.priority||"Normal"} priority</div>
                  </div>
                  {inFuture&&(
                    <div style={{textAlign:"center",background:cat.hex,borderRadius:12,padding:"8px 12px",flexShrink:0,boxShadow:`0 4px 12px ${cat.hex}30`}}>
                      <div style={{fontSize:16,fontWeight:900,color:"#fff"}}>{relTime(t-now)}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,0.75)",fontWeight:700}}>LEFT</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:0}}>
                {[
                  ["📅","Date",ev.date],
                  !ev.allDay&&["🕐","Time",`${fmt12(ev.time)}${ev.endTime?" – "+fmt12(ev.endTime):""}`],
                  ev.allDay&&["📆","Duration","All day"],
                  ["🔔","Alert",ev.alertMin>0?`${ev.alertMin} min before`:"At event time"],
                  ev.repeat!=="none"&&["🔁","Repeat",{none:"Never",daily:"Daily",weekly:"Weekly",monthly:"Monthly"}[ev.repeat]],
                  ev.isAlarm&&["⏰","Alarm","Rings at event time"],
                  ev.location&&["📍","Location",ev.location],
                  ev.notes&&["📝","Notes",ev.notes],
                ].filter(Boolean).map(([icon,label,val])=>(
                  <div key={label} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontSize:18,width:24,flexShrink:0,marginTop:1}}>{icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:10,fontWeight:800,color:"var(--muted)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>{label}</div>
                      <div style={{fontSize:14,color:"var(--text)",lineHeight:1.5,fontWeight:500}}>{val}</div>
                    </div>
                  </div>
                ))}

                {!inFuture&&<div style={{background:"var(--bg)",borderRadius:12,padding:"10px 14px",textAlign:"center",fontSize:13,color:"var(--muted)",fontWeight:600,margin:"10px 0"}}>✓ This event has passed</div>}

                {/* Actions */}
                <div style={{display:"flex",gap:10,marginTop:16}}>
                  <button className="tap" aria-label="Delete event" style={{flex:1,padding:13,background:"var(--rose-l)",border:"1.5px solid var(--rose)",borderRadius:14,color:"var(--rose)",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={()=>deleteEv(ev.id)}>
                    🗑 Delete
                  </button>
                  <button className="tap" aria-label="Edit event" style={{flex:2,padding:13,background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer"}} onClick={()=>openEdit(ev)}>
                    ✏️ Edit Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Reusable small components ─────────────────── */
const Label = ({children}) => (
  <div style={{fontSize:10,fontWeight:800,color:"var(--muted)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{children}</div>
);
const Row2 = ({children}) => (
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{children}</div>
);
const FGrp = ({label,children}) => (
  <div><Label>{label}</Label>{children}</div>
);
const Inp = ({type,placeholder,value,onChange,aria}) => (
  <input aria-label={aria} className="inp-focus" type={type||"text"} placeholder={placeholder||""} value={value} onChange={onChange}
    style={{width:"100%",background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:11,padding:"10px 12px",fontSize:13,color:"var(--text)",transition:"border-color 0.2s,box-shadow 0.2s"}}
  />
);
const Select = ({value,onChange,children,aria}) => (
  <select aria-label={aria} className="inp-focus" value={value} onChange={onChange}
    style={{width:"100%",background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:11,padding:"10px 12px",fontSize:13,color:"var(--text)",cursor:"pointer",transition:"border-color 0.2s,box-shadow 0.2s"}}>
    {children}
  </select>
);
const Toggle = ({on,onToggle,label,color}) => (
  <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginTop:4}} onClick={onToggle} role="switch" aria-checked={on} tabIndex={0} onKeyDown={e=>e.key==="Enter"&&onToggle()}>
    <div style={{width:44,height:24,borderRadius:12,background:on?color:"var(--border)",position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:2,width:20,height:20,background:"#fff",borderRadius:"50%",transition:"transform 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transform:on?"translateX(22px)":"translateX(2px)"}}/>
    </div>
    <span style={{fontSize:13,fontWeight:600,color:on?color:"var(--muted)",transition:"color 0.2s"}}>{label}</span>
  </div>
);
