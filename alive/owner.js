const API="/api/alive/";
let ownerAuthenticated=false;
let authClientPromise;
let enrollmentAuthClientPromise;
let enrollmentToken=new URLSearchParams(window.location.hash.replace(/^#/,"")).get("enroll")||"";
if(enrollmentToken)history.replaceState(null,"",window.location.pathname+window.location.search);
const createOwnerButton=document.getElementById("create-owner-account-button");
if(createOwnerButton)createOwnerButton.hidden=!enrollmentToken;
const signInButton=document.getElementById("password-signin-button");
if(signInButton)signInButton.hidden=!!enrollmentToken;
const confirmWrap=document.getElementById("password-confirm-wrap");
if(confirmWrap)confirmWrap.hidden=!enrollmentToken;
const passwordInput=document.getElementById("owner-password");
if(passwordInput)passwordInput.autocomplete=enrollmentToken?"new-password":"current-password";
const authHeading=document.getElementById("auth-heading");
if(authHeading)authHeading.textContent=enrollmentToken?"Create your ALIVE owner password":"Sign in to ALIVE";
const authDescription=document.getElementById("auth-description");
if(authDescription)authDescription.textContent=enrollmentToken?"Choose one password for ALIVE. Safari can save it in your iPad Passwords app. This does not change any other password.":"Use your owner email and password. Safari can save the password in your iPad Passwords app so you do not have to memorize it.";
function createAuthClient(includeEnrollmentToken=false){return import("https://esm.sh/better-auth@1.7.23/client").then(core=>core.createAuthClient({baseURL:window.location.origin+"/api/alive/auth",fetchOptions:{headers:includeEnrollmentToken&&enrollmentToken?{"x-alive-owner-enrollment-token":enrollmentToken}:{}}}));}
function getAuthClient(){if(!authClientPromise)authClientPromise=createAuthClient();return authClientPromise;}
function getEnrollmentAuthClient(){if(!enrollmentToken)throw new Error("Founder setup requires the private one-time invitation.");if(!enrollmentAuthClientPromise)enrollmentAuthClientPromise=createAuthClient(true);return enrollmentAuthClientPromise;}
let statusSnapshot=null;
let toastTimer=null;
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function notify(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),3200)}
async function request(action,{method="GET",body}={}){const response=await fetch(API+action,{method,credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined,cache:"no-store"});let payload={};try{payload=await response.json()}catch{}if(response.status===401){ownerAuthenticated=false;disconnect();throw new Error("Your ALIVE owner session expired. Sign in again.")}if(!response.ok)throw new Error(payload.error||"Request failed ("+response.status+").");return payload}
function statusCell(label,value){return '<div class="status-cell"><span>'+escapeHTML(label)+'</span><strong>'+escapeHTML(value)+'</strong></div>'}
function renderStatus(data){statusSnapshot=data;$("system-mode").textContent="Owner-controlled development";$("system-summary").textContent=data.executionConfigured?"Hosted one-shot execution is configured. A run starts only after you press the run button and confirm.":"Connected. Some hosted services are not configured; execution remains unavailable.";const pill=$("status-pill");pill.textContent=data.executionConfigured?"READY FOR OWNER-RUN":"CONNECTED / LIMITED";pill.className="pill "+(data.executionConfigured?"good":"warn");$("status-grid").innerHTML=[statusCell("DATABASE",data.databaseConfigured?"CONFIGURED":"NOT CONFIGURED"),statusCell("OPENAI KEY",data.openAIConfigured?"CONFIGURED":"NOT CONFIGURED"),statusCell("AI USAGE",data.aiEnabled?"ENABLED":"DISABLED"),statusCell("ISOLATED SANDBOX",data.sandboxEnabled?"ENABLED":"DISABLED")].join("");$("run-button").disabled=!data.executionConfigured;$("run-message").textContent=data.executionConfigured?"Ready. Pressing Run starts one task using OpenAI and a disposable test sandbox; usage may be billed.":"Execution is unavailable until the database migration, OpenAI key, allowlist, AI switch, and sandbox switch are correctly configured."}
function renderTasks(tasks,error){const root=$("tasks-list");if(error){root.innerHTML='<p class="muted">'+escapeHTML(error)+'</p>';return}if(!Array.isArray(tasks)||!tasks.length){root.innerHTML='<p class="muted">No tasks yet. Submit a direction above to begin.</p>';return}root.innerHTML=tasks.map(task=>{const id=escapeHTML(task.id||"");const actions=task.status==="pending_approval"?'<div class="task-actions"><button class="primary task-approve" data-task="'+id+'">APPROVE</button><button class="quiet task-reject" data-task="'+id+'">REJECT</button></div>':"";return '<article class="item"><div class="item-head"><div><h3>'+escapeHTML(task.title||task.id||"Untitled task")+'</h3><div class="meta">'+id+' · '+escapeHTML(task.area||task.runner||"world")+'</div></div><span class="pill neutral">'+escapeHTML(task.status||"unknown")+'</span></div><p>'+escapeHTML(task.description||"")+'</p>'+actions+'</article>'}).join("");root.querySelectorAll(".task-approve").forEach(button=>button.addEventListener("click",()=>decideTask(button,"approve")));root.querySelectorAll(".task-reject").forEach(button=>button.addEventListener("click",()=>decideTask(button,"reject")))}
async function decideTask(button,action){const accepted=window.confirm(action==="approve"?"Approve this task for one bounded, isolated run? It will still require owner review before any release.":"Reject this task? It will not be executed.");if(!accepted)return;button.disabled=true;try{await request("tasks",{method:"POST",body:{action,taskId:button.dataset.task,reason:"Owner rejected this task."}});notify(action==="approve"?"Task approved for isolated execution.":"Task rejected. It will not run.");await refreshAll()}catch(error){notify(error.message)}finally{button.disabled=false}}
function renderReviews(reviews,tasks,error){const root=$("reviews-list");if(error){root.innerHTML='<p class="muted">'+escapeHTML(error)+'</p>';return}if(!Array.isArray(reviews)||!reviews.length){root.innerHTML='<p class="muted">No owner reviews are waiting.</p>';return}const taskMap=new Map((tasks||[]).map(task=>[task.id,task]));root.innerHTML=reviews.map(review=>{const task=taskMap.get(review.taskId)||{};const files=Array.isArray(review.proposalFiles)?review.proposalFiles:[];const test=review.testResults||{};const id=escapeHTML(review.id||"");const fileHTML=files.map(file=>'<details class="file-block"><summary>'+escapeHTML(file.path||"Proposed file")+'</summary><pre>'+escapeHTML(file.content||"")+'</pre></details>').join("");const changes=typeof review.changes==="string"?review.changes:JSON.stringify(review.changes||{},null,2);return '<article class="item"><div class="item-head"><div><h3>'+escapeHTML(review.taskTitle||task.title||"Proposed change")+'</h3><div class="meta">Review '+id+' · Task '+escapeHTML(review.taskId||"")+'</div></div><span class="pill warn">'+escapeHTML(review.status||"awaiting_owner_review")+'</span></div><p>'+escapeHTML(changes)+'</p><p class="meta">Tests: '+(test.passed===true?"Passed":test.passed===false?"Failed":"Not reported")+(test.total!==undefined?" · "+escapeHTML(test.total)+" total":"")+(test.failed!==undefined?" · "+escapeHTML(test.failed)+" failed":"")+'</p>'+(files.length?fileHTML:'<p class="meta">No proposal file contents were attached to this review.</p>')+(review.status==="awaiting_owner_review"?'<div class="review-actions"><textarea class="change-note" rows="2" maxlength="2000" placeholder="Optional: describe what should change"></textarea><button class="primary perfect-button" data-review="'+id+'" data-task="'+escapeHTML(review.taskId||"")+'">PERFECT</button><button class="quiet change-button" data-review="'+id+'" data-task="'+escapeHTML(review.taskId||"")+'">CHANGE</button></div>':'')+'</article>'}).join("");root.querySelectorAll(".perfect-button").forEach(button=>button.addEventListener("click",()=>submitReview(button,"perfect")));root.querySelectorAll(".change-button").forEach(button=>button.addEventListener("click",()=>submitReview(button,"change")))}
async function submitReview(button,decision){const card=button.closest(".item");const note=card.querySelector("textarea")?.value.trim()||"";if(decision==="change"&&!note){notify("Add a short note explaining the requested change.");return}button.disabled=true;try{await request("reviews",{method:"POST",body:{reviewId:button.dataset.review,taskId:button.dataset.task,decision,ownerNote:note}});notify(decision==="perfect"?"PERFECT feedback saved. No code was published.":"CHANGE feedback saved. No code was published.");await refreshAll()}catch(error){notify(error.message)}finally{button.disabled=false}}
function renderPersonal(identity,memories,error){
  const root=$("memory-list");
  if(error){root.innerHTML='<p class="muted">'+escapeHTML(error)+'</p>';return}
  if(identity){$("identity-display-name").value=identity.displayName||""}
  if(!Array.isArray(memories)||!memories.length){root.innerHTML='<p class="muted">No private memories saved yet.</p>';return}
  root.innerHTML=memories.map(memory=>{
    const shared=memory.privacy?.shareWithDevelopment===true;
    const badge=shared?'<span class="pill neutral">Shared with ALIVE development</span>':'<span class="pill neutral">Private to owner</span>';
    return '<article class="item"><div class="item-head"><div><h3>'+escapeHTML(memory.category||"note")+'</h3><div class="meta">'+escapeHTML(memory.createdAt||"")+'</div>'+badge+'</div><button class="quiet memory-delete" data-memory="'+escapeHTML(memory.memoryId||"")+'">DELETE</button></div><p>'+escapeHTML(memory.content||"")+'</p>'+(Array.isArray(memory.tags)&&memory.tags.length?'<div class="meta">'+escapeHTML(memory.tags.join(", "))+'</div>':"")+'</article>';
  }).join("");
  root.querySelectorAll(".memory-delete").forEach(button=>button.addEventListener("click",()=>deleteMemory(button)));
}
function renderMemoryProposals(proposals,error){
  const root=$("memory-proposal-list");
  if(error){root.innerHTML='<p class="muted">'+escapeHTML(error)+'</p>';return}
  if(!Array.isArray(proposals)||!proposals.length){root.innerHTML='<p class="muted">No Companion suggestions are waiting for approval.</p>';return}
  root.innerHTML=proposals.map(proposal=>{
    const id=escapeHTML(proposal.memoryId||"");
    const tags=Array.isArray(proposal.tags)&&proposal.tags.length?'<div class="meta">'+escapeHTML(proposal.tags.join(", "))+'</div>':"";
    return '<article class="item"><div class="item-head"><div><h3>'+escapeHTML(proposal.category||"suggested memory")+'</h3><div class="meta">'+escapeHTML(proposal.createdAt||"")+' · Suggested by Companion</div></div><span class="pill warn">AWAITING YOUR APPROVAL</span></div><p>'+escapeHTML(proposal.content||"")+'</p>'+tags+'<div class="task-actions"><button class="primary memory-proposal-approve" data-memory="'+id+'">APPROVE MEMORY</button><button class="quiet memory-proposal-archive" data-memory="'+id+'">ARCHIVE</button></div></article>';
  }).join("");
  root.querySelectorAll(".memory-proposal-approve").forEach(button=>button.addEventListener("click",()=>decideMemoryProposal(button,"approve")));
  root.querySelectorAll(".memory-proposal-archive").forEach(button=>button.addEventListener("click",()=>decideMemoryProposal(button,"archive")));
}
async function decideMemoryProposal(button,action){
  const prompt=action==="approve"?"Add this Companion suggestion to your approved personal memories? It will remain private and will not be shared with ALIVE development.":"Archive this Companion suggestion without adding it to your memories?";
  if(!window.confirm(prompt))return;
  button.disabled=true;
  try{await request("personal/memory-proposals",{method:"POST",body:{action,memoryId:button.dataset.memory}});notify(action==="approve"?"Companion memory approved and kept private.":"Companion suggestion archived.");await refreshPersonal()}
  catch(error){notify(error.message)}finally{button.disabled=false}
}
async function refreshPersonal(){
  const results=await Promise.allSettled([request("personal/identity"),request("personal/memories"),request("personal/memory-proposals")]);
  if(results[0].status==="fulfilled"&&results[1].status==="fulfilled")renderPersonal(results[0].value.identity,results[1].value.memories||"");
  else renderPersonal(null,[],results[0].status==="rejected"?results[0].reason.message:results[1].reason.message);
  renderMemoryProposals(results[2].status==="fulfilled"?(results[2].value.proposals||[]):[],results[2].status==="rejected"?results[2].reason.message:"");
}
async function deleteMemory(button){if(!window.confirm("Delete this private memory permanently?"))return;button.disabled=true;try{await request("personal/memories",{method:"DELETE",body:{memoryId:button.dataset.memory}});notify("Private memory deleted.");await refreshPersonal()}catch(error){notify(error.message)}finally{button.disabled=false}}
async function refreshAll(){if(!ownerAuthenticated)return;const status=await request("status");renderStatus(status);const [tasksResult,reviewsResult]=await Promise.allSettled([request("tasks"),request("reviews")]);const tasks=tasksResult.status==="fulfilled"?(tasksResult.value.tasks||[]):[];renderTasks(tasks,tasksResult.status==="rejected"?tasksResult.reason.message:"");renderReviews(reviewsResult.status==="fulfilled"?(reviewsResult.value.reviews||[]):[],reviewsResult.status==="fulfilled"?(reviewsResult.value.tasks||tasks):tasks,reviewsResult.status==="rejected"?reviewsResult.reason.message:"");await refreshPersonal()}
function disconnect(){ownerAuthenticated=false;statusSnapshot=null;$("workspace").hidden=true;$("auth-panel").hidden=false;$("status-pill").textContent="NOT CONNECTED";$("status-pill").className="pill neutral";$("run-button").disabled=true}
async function enterOwnerConsole(){ownerAuthenticated=true;$("auth-panel").hidden=true;$("workspace").hidden=false;try{await refreshAll();notify("Secure ALIVE owner session connected.")}catch(error){disconnect();notify(error.message)}}
$("identity-form").addEventListener("submit",async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;try{await request("personal/identity",{method:"POST",body:{displayName:$("identity-display-name").value.trim()}});notify("Personal identity updated.");await refreshPersonal()}catch(error){notify(error.message)}finally{button.disabled=false}});
$("memory-form").addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget;const data=new FormData(form);const button=form.querySelector('button[type="submit"]');button.disabled=true;try{const tags=String(data.get("tags")||"").split(",").map(tag=>tag.trim()).filter(Boolean).slice(0,12);await request("personal/memories",{method:"POST",body:{category:data.get("category"),content:String(data.get("content")||"").trim(),tags,shareWithDevelopment:data.get("shareWithDevelopment")==="on"}});form.reset();notify("Private memory saved to your ALIVE identity.");await refreshPersonal()}catch(error){notify(error.message)}finally{button.disabled=false}});
// Owner access uses a password the owner chooses and can save in iPad Passwords.
$("create-owner-account-button").addEventListener("click",async()=>{
  const email=$("owner-email").value.trim().toLowerCase();
  const password=$("owner-password").value;
  const confirmation=$("owner-password-confirm").value;
  if(!enrollmentToken){notify("Open your private ALIVE owner setup link to create the first account.");return}
  if(!email){notify("Enter your configured owner email.");return}
  if(password.length<12){notify("Choose a password with at least 12 characters.");return}
  if(password!==confirmation){notify("The passwords do not match.");return}
  const button=$("create-owner-account-button");button.disabled=true;
  try{
    const enrollmentAuth=await getEnrollmentAuthClient();
    const result=await enrollmentAuth.signUp.email({email,password,name:"ALIVE Owner"});
    if(result.error)throw new Error(result.error.message||"Owner account could not be created.");
    enrollmentToken="";enrollmentAuthClientPromise=null;
    const auth=await getAuthClient();
    const session=await auth.getSession();
    if(!session.data?.user)throw new Error("The account was created, but the sign-in session did not start. Use the password you just chose to sign in.");
    $("owner-password").value="";$("owner-password-confirm").value="";
    await enterOwnerConsole();
    notify("ALIVE owner account created. Save the password in iPad Passwords when Safari offers.");
  }catch(error){notify(error.message)}
  finally{button.disabled=false}
});
$("password-signin-button").addEventListener("click",async()=>{
  const email=$("owner-email").value.trim().toLowerCase();
  const password=$("owner-password").value;
  if(!email||!password){notify("Enter your owner email and password.");return}
  const button=$("password-signin-button");button.disabled=true;
  try{
    const auth=await getAuthClient();
    const result=await auth.signIn.email({email,password});
    if(result.error)throw new Error(result.error.message||"Owner sign-in failed.");
    const session=await auth.getSession();
    if(!session.data?.user)throw new Error("The owner session could not be restored. Try signing in again.");
    $("owner-password").value="";
    await enterOwnerConsole();
  }catch(error){notify(error.message)}
  finally{button.disabled=false}
});
$("refresh-button").addEventListener("click",async()=>{const button=$("refresh-button");button.disabled=true;try{await refreshAll();notify("ALIVE status refreshed.")}catch(error){notify(error.message)}finally{button.disabled=false}});
$("disconnect-button").addEventListener("click",async()=>{try{const auth=await getAuthClient();await auth.signOut()}catch{}disconnect();notify("Owner session signed out.")});
$("task-form").addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget;const data=new FormData(form);const button=form.querySelector('button[type="submit"]');button.disabled=true;$("task-message").textContent="Submitting direction…";try{const criteria=String(data.get("acceptanceCriteria")||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);const result=await request("tasks",{method:"POST",body:{title:String(data.get("title")||"").trim(),area:data.get("area"),description:String(data.get("description")||"").trim(),acceptanceCriteria:criteria,requiresApproval:data.get("requiresApproval")==="on",runner:"world"}});$("task-message").textContent="Task received: "+(result.task?.id||"queued")+". It has not been executed.";form.reset();form.elements.requiresApproval.checked=true;await refreshAll()}catch(error){$("task-message").textContent=error.message}finally{button.disabled=false}});
$("run-button").addEventListener("click",async()=>{if(!statusSnapshot?.executionConfigured){notify("Execution is not configured.");return}const accepted=window.confirm("Run the next approved ALIVE world task now? This will send a proposal request to OpenAI and start an isolated Vercel Sandbox test. API and sandbox usage may incur charges. No production deployment will occur.");if(!accepted)return;const button=$("run-button");button.disabled=true;$("run-message").textContent="ALIVE is attempting one task. Keep this page open.";try{const result=await request("run",{method:"POST",body:{}});$("run-message").textContent=result.productionChangesMade===false?"Run finished. No production changes were made. Check owner review below.":"Run returned; inspect the result before proceeding.";notify("One-shot ALIVE run returned.");await refreshAll()}catch(error){$("run-message").textContent=error.message;notify(error.message)}finally{button.disabled=!statusSnapshot?.executionConfigured}});
getAuthClient().then(auth=>auth.getSession()).then(result=>{if(result.data?.user)enterOwnerConsole()}).catch(()=>{});
window.addEventListener("pagehide",()=>{ownerAuthenticated=false});
