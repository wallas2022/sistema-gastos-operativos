// Requires Playwright supplied by the validation environment; does not change app dependencies.
// First create fixtures with backend/test/approval-pending.fixture.cjs in an isolated QA database.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const apiUrl=process.env.APPROVAL_QA_API;
if(!apiUrl || !process.env.APPROVAL_QA_FIXTURES)throw new Error('APPROVAL_QA_API and APPROVAL_QA_FIXTURES are required');
const fixtures=JSON.parse(fs.readFileSync(process.env.APPROVAL_QA_FIXTURES,'utf8'));
const output=process.env.APPROVAL_QA_OUTPUT || '/tmp/aprobaciones-evidencia';
fs.mkdirSync(output,{recursive:true});
async function until(fn){const end=Date.now()+15000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,100))}throw new Error('UI did not reach expected state')}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 const failures=[];const evidence=[];
 await context.route(/http:\/\/(localhost|127\.0\.0\.1):3000\//,async route=>{
   try { const response=await route.fetch({url:route.request().url().replace(/http:\/\/(localhost|127\.0\.0\.1):3000\/api/,apiUrl)});await route.fulfill({response}); } catch { await route.abort(); }
 });
 const page=await context.newPage();page.on('pageerror',e=>failures.push(e.message));
 const api=async(route,options={})=>{const token=await page.evaluate(()=>localStorage.getItem('access_token'));return context.request.fetch(apiUrl+route,{...options,headers:{Authorization:`Bearer ${token}`}})};
 const json=async(route)=>{const r=await api(route);assert.ok(r.ok(),`${route}: ${r.status()}`);return r.json()};
 const login=async(email)=>{await page.goto((process.env.APPROVAL_QA_WEB || 'http://localhost:5173')+'/login');await page.locator('input[type=email]').fill(email);await page.locator('input[type=password]').fill(process.env.APPROVAL_QA_PASSWORD || 'Demo12345*');await page.getByRole('button',{name:/iniciar|ingresar|entrar/i}).click();await page.waitForURL(u=>!u.pathname.includes('login'));await page.goto((process.env.APPROVAL_QA_WEB || 'http://localhost:5173')+'/trazabilidad-flujos/autorizaciones')};
 const checkCount=async(n)=>{
   await until(async()=>await page.getByRole('button',{name:'Revisar',exact:true}).count()===n);
   await until(async()=>(await page.getByText('Mis pendientes',{exact:true}).first().locator('..').innerText()).replace(/\s+/g,' ').trim()==='Mis pendientes '+n);
   await until(async()=>new RegExp(`Aprobaciones\\s*${n}(?:\\s|$)`).test(await page.locator('a[href="/trazabilidad-flujos/autorizaciones"]').innerText()) || n===0 && !/\d/.test(await page.locator('a[href="/trazabilidad-flujos/autorizaciones"]').innerText()));
 };
 const screenshot=async(name)=>page.screenshot({path:path.join(output,name+'.png'),fullPage:true});
 const open=async(f)=>{const row=page.getByText(f.code,{exact:true}).locator('..').locator('..').locator('..');await row.getByRole('button',{name:'Revisar',exact:true}).click();await page.getByRole('button',{name:'Aprobar',exact:true}).waitFor()};
 const decide=async(f,action,expected,n)=>{
   await open(f);await screenshot(f.name.toLowerCase()+'-detalle');
   await page.getByRole('button',{name:action==='approve'?'Aprobar':'Rechazar',exact:true}).click();
   if(action==='reject'){
     await page.getByRole('button',{name:'Confirmar',exact:true}).click();
     await page.getByRole('dialog').getByRole('alert').waitFor();
     assert.match(await page.getByRole('dialog').getByRole('alert').innerText(),/comentario.*obligatorio/i);
     assert.equal((await json('/approval-flows/'+f.flowId)).status,'EN_REVISION');
     await page.getByRole('dialog').locator('textarea').fill('Rechazo de prueba: solicitud no autorizada');
   }
   const response=page.waitForResponse(r=>r.url().endsWith('/'+action)&&r.request().method()==='POST');
   await page.getByRole('button',{name:'Confirmar',exact:true}).click();
   assert.equal((await response).status(),201);
   await checkCount(n);
   assert.equal(await page.getByText(f.code,{exact:true}).count(),0);
   const flow=await json('/approval-flows/'+f.flowId),request=await json('/expense-requests/'+f.requestId);
   assert.equal(flow.status,expected.flow);assert.equal(request.status,expected.request);
   const history=await json('/approval-flows/'+f.flowId+'/history');assert.ok(history.traces.length>0);
   await screenshot(f.name.toLowerCase()+'-resultado');
   evidence.push({case:f.name,action,flowStatus:flow.status,requestStatus:request.status,pending:n,history:history.traces.map(t=>t.event)});
 };
 try{
   await login('admin@demo.com');await checkCount(3);await screenshot('01-pendientes');
   const pending=await json('/approval-flows/pending/me');assert.equal(pending.length,3);
   for(const s of pending){assert.ok(s.flow.expenseRequest);assert.equal(s.order,s.flow.currentStepOrder);assert.equal(s.flow.entityType,'EXPENSE_REQUEST')}
   await page.locator('input').first().fill('NO-EXISTE-QA');await until(async()=>await page.getByRole('button',{name:'Revisar',exact:true}).count()===0);
   await page.locator('input').first().fill('');await checkCount(3);
   const [approve,reject,levels]=fixtures;
   await decide(approve,'approve',{flow:'APROBADA',request:'APROBADA'},2);
   const repeat=await api('/approval-flows/'+approve.flowId+'/approve',{method:'POST',data:{}});assert.equal(repeat.status(),400);
   await decide(reject,'reject',{flow:'RECHAZADA',request:'RECHAZADA'},1);
   await decide(levels,'approve',{flow:'EN_REVISION',request:'PENDIENTE_APROBACION'},0);
   const unassigned=await api('/approval-flows/'+levels.flowId+'/approve',{method:'POST',data:{}});assert.equal(unassigned.status(),403);
   await page.reload();await checkCount(0);assert.equal((await json('/approval-flows/pending/me')).length,0);
   await page.evaluate(()=>{localStorage.removeItem('access_token');localStorage.removeItem('user')});
   await login('gerente@demo.com');await checkCount(1);await screenshot('02-segundo-nivel');
   const wrong=await api('/approval-flows/'+reject.flowId+'/approve',{method:'POST',data:{}});assert.equal(wrong.status(),400);
   await decide(levels,'approve',{flow:'APROBADA',request:'APROBADA'},0);
   assert.equal((await json('/approval-flows/pending/me')).length,0);
   assert.deepEqual(failures,[]);
   fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify({passed:true,evidence,pageErrors:failures},null,2));
   console.log(JSON.stringify({passed:true,evidence,pageErrors:failures},null,2));
 }catch(e){await screenshot('error');fs.writeFileSync(path.join(output,'error.txt'),String(e.stack)+'\n'+await page.locator('body').innerText());throw e}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});