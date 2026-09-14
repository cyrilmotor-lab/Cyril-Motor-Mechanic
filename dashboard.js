import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const sb=createClient(window.CYRIL_CONFIG.supabaseUrl,window.CYRIL_CONFIG.publishableKey);
const login=document.querySelector("#login"), app=document.querySelector("#app"), recovery=document.querySelector("#recovery"), list=document.querySelector("#bookings");
const setStatus=(id,msg)=>document.querySelector(id).textContent=msg;
function showApp(){login.hidden=true;recovery.hidden=true;app.hidden=false;load()}
async function load(){
 const {data,error}=await sb.from("bookings").select("id,service,preferred_date,preferred_time,status,notes,created_at,customers(full_name,phone,email),vehicles(registration,make,model,year)").order("preferred_date",{ascending:true}).order("preferred_time",{ascending:true}).limit(100);
 if(error){list.textContent=error.message;return}
 const counts={pending:0,confirmed:0,in_progress:0,ready:0};data.forEach(b=>counts[b.status]=(counts[b.status]||0)+1);
 for(const [k,id] of Object.entries({pending:"#pending",confirmed:"#confirmed",in_progress:"#progress",ready:"#ready"}))document.querySelector(id).textContent=counts[k]||0;
 list.innerHTML=data.length?data.map(b=>`<article class="booking"><div><span class="status">${esc(b.status)}</span><h3>${esc(b.customers?.full_name||"Customer")} — ${esc(b.vehicles?.registration||"No rego")}</h3><p>${esc(b.service)} · ${esc(b.preferred_date)} · ${esc(b.preferred_time||"")}</p><p>${esc([b.vehicles?.make,b.vehicles?.model,b.vehicles?.year].filter(Boolean).join(" "))} · ${esc(b.customers?.phone||"")}</p><p>${esc(b.notes||"")}</p></div><div class="actions"><select data-id="${b.id}">${["pending","confirmed","in_progress","ready","completed","cancelled"].map(s=>`<option ${s===b.status?"selected":""}>${s}</option>`).join("")}</select></div></article>`).join(""):`<div class="booking">No bookings yet.</div>`;
 list.querySelectorAll("select").forEach(s=>s.addEventListener("change",async e=>{const id=e.target.dataset.id,status=e.target.value;const {error}=await sb.from("bookings").update({status}).eq("id",id);if(error)alert(error.message);else load()}));
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
document.querySelector("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);setStatus("#loginStatus","Signing in…");const {data,error}=await sb.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});if(error){setStatus("#loginStatus",error.message);return}if(data?.session){showApp()}else{setStatus("#loginStatus","Signed in, but no session was returned. Please try again.")}});
document.querySelector("#signup").addEventListener("click",async()=>{const f=new FormData(document.querySelector("#loginForm"));const {error}=await sb.auth.signUp({email:f.get("email"),password:f.get("password")});setStatus("#loginStatus",error?error.message:"Account created. Check your email if confirmation is enabled.")});
document.querySelector("#forgot").addEventListener("click",async()=>{const email=document.querySelector('#loginForm input[name="email"]').value.trim();if(!email){setStatus("#loginStatus","Enter your email address first.");return}const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/reset-password.html"});setStatus("#loginStatus",error?error.message:"Password reset email sent. Check your email.")});
document.querySelector("#logout").addEventListener("click",()=>sb.auth.signOut());
document.querySelector("#refresh").addEventListener("click",load);
sb.auth.onAuthStateChange((event,s)=>{if(event==="PASSWORD_RECOVERY"){login.hidden=true;app.hidden=true;if(recovery)recovery.hidden=false;return}if(s){showApp()}else{login.hidden=false;if(recovery)recovery.hidden=true;app.hidden=true}});
sb.auth.getSession().then(({data})=>{if(data?.session)showApp()});