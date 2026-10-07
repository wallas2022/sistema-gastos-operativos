const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const apiUrl=process.env.APPROVAL_AUTH_API;
if(!apiUrl || !process.env.APPROVAL_AUTH_TEMPLATE)throw Error('API and sanitized template required');
const template=JSON.parse(fs.readFileSync(process.env.APPROVAL_AUTH_TEMPLATE,'utf8'));
const output=process.env.APPROVAL_AUTH_OUTPUT || '/tmp/approval-assigned-evidence';fs.mkdirSync(output,{recursive:true});
async function until(fn){for(let i=0;i<150;i++){if(await fn())return;await new Promise(r=>setTimeout(r,100))}throw Error('Expected UI state was not reached')}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1440,height:1050}});
 await context.route(/http:\/\/(localhost|127\.0\.0\.1):3000\//,async route=>{try{const r=await route.fetch({url:route.request().url().replace(/http:\/\/(localhost|127\.0\.0\.1):3000\/api/,apiUrl)});await route.fulfill({response:r})}catch{await route.abort()}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const web=process.env.APPROVAL_AUTH_WEB || 'http://localhost:5173';
 const capture=async name=>page.screenshot({path:path.join(output,name+'.png'),fullPage:true});
 const login=async email=>{await page.goto(web+'/login');await page.locator('input[type=email]').fill(email);await page.locator('input[type=password]').fill(process.env.APPROVAL_AUTH_PASSWORD || 'Demo12345*');await page.getByRole('button',{name:/iniciar|ingresar|entrar/i}).click();await page.waitForURL(u=>!u.pathname.includes('login'))};
 const json=async endpoint=>{const token=await page.evaluate(()=>localStorage.getItem('access_token'));const r=await context.request.get(apiUrl+endpoint,{headers:{Authorization:`Bearer ${token}`}});assert.ok(r.ok());return r.json()};
 const field=(name,selector='input')=>page.getByText(name,{exact:true}).first().locator('..').locator(selector);
 const approve=async(req,label)=>{
  await login('gerente@demo.com');const actor=await page.evaluate(()=>JSON.parse(localStorage.getItem('user')));
  const pending=await json('/approval-flows/pending/me');const selected=pending.find(s=>s.flow.expenseRequestId===req.id);assert.ok(selected);assert.equal(selected.assignedUserId,actor.id);assert.equal(selected.order,1);assert.equal(selected.status,'ASIGNADA');
  await page.goto(web+'/trazabilidad-flujos/autorizaciones');await page.locator('input').first().fill(req.code);await until(async()=>await page.getByRole('button',{name:'Revisar',exact:true}).count()===1);
  await capture(label+'-pendiente');await page.getByRole('button',{name:'Revisar',exact:true}).click();await until(async()=>await page.getByRole('button',{name:'Aprobar',exact:true}).isEnabled());
  const before=await json('/approval-flows/'+selected.flowId);assert.equal(before.decisionAuthorization.allowed,true);await capture(label+'-asignada');
  await page.getByRole('button',{name:'Aprobar',exact:true}).click();const response=page.waitForResponse(r=>r.url().endsWith('/'+selected.flowId+'/approve')&&r.request().method()==='POST');await page.getByRole('button',{name:'Confirmar',exact:true}).click();assert.equal((await response).status(),201);
  await until(async()=>await page.getByRole('button',{name:'Revisar',exact:true}).count()===0);
  await until(async()=>(await page.getByText('Mis pendientes',{exact:true}).first().locator('..').innerText()).replace(/\s+/g,' ').trim()==='Mis pendientes '+(pending.length-1));
  const nextPending=await json('/approval-flows/pending/me');assert.equal(nextPending.length,pending.length-1);assert.ok(!nextPending.some(s=>s.flowId===selected.flowId));
  const flow=await json('/approval-flows/'+selected.flowId),after=await json('/expense-requests/'+req.id),history=await json('/approval-flows/'+selected.flowId+'/history');assert.equal(after.status,'APROBADA');assert.equal(flow.status,'APROBADA');assert.equal(flow.steps[0].status,'APROBADA');assert.equal(flow.steps[0].decidedByUserId,actor.id);assert.ok(history.traces.some(t=>t.event==='SOLICITUD_APROBADA'));
  await capture(label+'-resultado');return {code:req.code,requestId:req.id,flowId:flow.id,stepId:flow.steps[0].id,assignedUserId:selected.assignedUserId,authenticatedUserId:actor.id,permission:actor.permissions.filter(p=>p.includes('APPROVE')),requestStatus:after.status,flowStatus:flow.status,stepStatus:flow.steps[0].status,pendingBefore:pending.length,pendingAfter:nextPending.length,history:history.traces};
 };
 try{
  if(process.env.APPROVAL_AUTH_BEFORE_ONLY==='1') {
   await login('gerente@demo.com');await page.goto(web+'/trazabilidad-flujos/autorizaciones');await page.locator('input').first().fill(template.request.code);
   await until(async()=>await page.getByRole('button',{name:'Revisar',exact:true}).count()===1);await page.getByRole('button',{name:'Revisar',exact:true}).click();
   await page.getByRole('button',{name:'Aprobar',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Aprobar',exact:true}).isDisabled(),true);
   const flow=await json('/approval-flows/'+template.request.approvalFlow.id);assert.equal(flow.decisionAuthorization.allowed,false);assert.match(flow.decisionAuthorization.reason,/autoridad/);
   await capture('00-sin-permiso');fs.writeFileSync(path.join(output,'antes-permiso.json'),JSON.stringify({code:template.request.code,flowId:flow.id,assignedUserId:flow.steps[0].assignedUserId,decisionAuthorization:flow.decisionAuthorization,approveButtonDisabled:true},null,2));
   console.log(JSON.stringify({flowId:flow.id,decisionAuthorization:flow.decisionAuthorization,approveButtonDisabled:true}));return;
  }
  const existing=process.env.APPROVAL_AUTH_SKIP_EXISTING==='1' ? {code:template.request.code,requestId:template.request.id,verifiedInPriorRun:true} : await approve(template.request,'01-reportada');
  if(process.env.APPROVAL_AUTH_EXISTING_ONLY==='1'){
   fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify({existing,errors},null,2));console.log(JSON.stringify({existing,errors},null,2));return;
  }
  if(page.url()!=='about:blank') await page.evaluate(()=>{localStorage.removeItem('access_token');localStorage.removeItem('user')});await login('solicitante@demo.com');await page.goto(web+'/solicitudes-gastos/nueva');
  await field('País','select').selectOption(template.request.countryId);await field('Empresa','select').selectOption(template.request.companyId);await field('Moneda de origen','select').selectOption(template.request.currencyId);await field('Tipo de gasto','select').selectOption('GASTO_VIAJE');await field('Modalidad de ejecución financiera','select').selectOption('ANTICIPO_VIATICOS');
  await field('Fecha estimada').fill(template.request.estimatedDate.slice(0,10));await field('Concepto').fill('QA autorizacion asignada '+Date.now());await field('Destino').fill('Ciudad de Guatemala');await field('Justificación','textarea').fill('Validacion de creacion y aprobacion con usuario realmente asignado');await field('Días').fill('3');
  const budget=field('Partida del presupuesto activo');await until(async()=>!(await budget.isDisabled()));await budget.fill(template.request.budgetAccount);await until(async()=>await page.locator('datalist option').count()>0);const options=await page.locator('datalist option').evaluateAll(xs=>xs.map(x=>x.value));const option=options.find(x=>x.includes(template.request.budgetAccount));assert.ok(option,'Original budget line must be available');await budget.fill(option);
  await page.getByRole('button',{name:'Agregar ítem',exact:true}).click();
  await field('Nombre').fill('Viatico QA autorizacion');await field('Descripción').fill('Prueba controlada de asignacion');await field('Cantidad').fill('1');await field('Monto unitario').fill('100');
  await capture('02-nueva-formulario');const response=page.waitForResponse(r=>r.url().endsWith('/expense-requests')&&r.request().method()==='POST');await page.getByRole('button',{name:'Crear solicitud',exact:true}).click();const result=await response;assert.equal(result.status(),201);const created=await result.json();await page.waitForURL(u=>u.pathname.endsWith('/'+created.id));
  await capture('02-nueva-borrador');const submit=page.waitForResponse(r=>r.url().endsWith('/'+created.id+'/submit')&&r.request().method()==='PATCH');await page.getByRole('button',{name:/Enviar a autorizaci/i}).click();assert.equal((await submit).status(),200);
  const flow=await json('/approval-flows/request/'+created.id);assert.equal(flow.steps[0].assignedUserId,template.user.id);assert.equal(flow.steps[0].approverRoleCode,'GERENTE');assert.equal(flow.steps[0].status,'ASIGNADA');
  await page.evaluate(()=>{localStorage.removeItem('access_token');localStorage.removeItem('user')});const fresh=await approve(created,'03-nueva');assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify({existing,fresh,errors},null,2));console.log(JSON.stringify({existing,fresh,errors},null,2));
 }catch(e){await capture('error');fs.writeFileSync(path.join(output,'error.txt'),String(e.stack)+'\n'+await page.locator('body').innerText());throw e}finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});