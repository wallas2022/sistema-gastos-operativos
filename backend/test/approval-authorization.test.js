const test=require('node:test');
const assert=require('node:assert/strict');
const {PrismaClient}=require('@prisma/client');
const {ApprovalFlowService}=require('../dist/src/modules/approval/approval-flow.service');
const {JwtStrategy}=require('../dist/src/modules/auth/strategies/jwt.strategy');
const {ApprovalEngineService}=require('../dist/src/modules/approval/approval-engine.service');
const database=process.env.APPROVAL_AUTH_TEST_DATABASE_URL;

test('assigned approval authorization: seven PostgreSQL regression cases',{skip:!database},async t=>{
 assert.match(new URL(database).pathname,/^\/aprobaciones_.*qa_/,'Refusing an operational database');
 const p=new PrismaClient({datasources:{db:{url:database}}});
 const flows=new ApprovalFlowService(p);
 const jwt=new JwtStrategy({get:()=> 'QA-test-secret'},p);
 const suffix=Date.now();
 try{
  const manager=await p.user.findUniqueOrThrow({where:{email:'gerente@demo.com'}});
  const requester=await p.user.findUniqueOrThrow({where:{email:'solicitante@demo.com'},include:{company:true}});
  const role=await p.role.findUniqueOrThrow({where:{code:'GERENTE'}});
  const permission=await p.permission.findUniqueOrThrow({where:{code:'EXPENSE_REQUEST_APPROVE'}});
  await p.rolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:permission.id}},update:{},create:{roleId:role.id,permissionId:permission.id}});
  const otherCompany=await p.company.create({data:{code:`QA-AUTH-${suffix}`,name:'QA approval foreign company',countryId:requester.company.countryId,currencyId:requester.company.currencyId}});
  const user=async(label,companyId,inherit)=>p.user.create({data:{email:`qa-auth-${label}-${suffix}@test.local`,name:`QA ${label}`,passwordHash:'QA-NO-LOGIN',role:'GERENTE',companyId,...(inherit?{roles:{create:{roleId:role.id}}}:{})}});
  const other=await user('other',manager.companyId,true),none=await user('no-permission',manager.companyId,false),foreign=await user('foreign',otherCompany.id,true);
  const actor=async u=>jwt.validate({sub:u.id,credentialVersion:u.credentialVersion});
  const managerActor=await actor(manager),otherActor=await actor(other),noneActor=await actor(none),foreignActor=await actor(foreign);
  assert.ok(managerActor.permissions.includes('EXPENSE_REQUEST_APPROVE'));
  const create=async(label,assigned=manager.id,next)=>{
   const r=await p.expenseRequest.create({data:{code:`QA-AUTH-${label}-${suffix}`,type:'GASTO_OPERATIVO',status:'PENDIENTE_APROBACION',requesterId:requester.id,requesterName:requester.name,requesterRole:'SOLICITANTE',companyId:requester.companyId,companyName:requester.company.name,costCenter:'QA',concept:'Approval authorization regression',estimatedAmount:100,currency:'GTQ'}});
   const f=await p.approvalFlow.create({data:{entityType:'EXPENSE_REQUEST',entityId:r.id,expenseRequestId:r.id,status:'EN_REVISION',currentStepOrder:1,steps:{create:[{order:1,required:true,status:'ASIGNADA',assignedUserId:assigned,approverRoleCode:'GERENTE'},...(next?[{order:2,required:true,status:'PENDIENTE',assignedUserId:next,approverRoleCode:'GERENTE'}]:[])]}}});return {r,f};
  };
  await t.test('CASE 1 assigned authorized Gerente Demo succeeds',async()=>{
   const {r,f}=await create('success');assert.equal((await flows.getById(f.id,managerActor)).decisionAuthorization.allowed,true);
   await flows.approve(f.id,undefined,managerActor);assert.equal((await p.expenseRequest.findUnique({where:{id:r.id}})).status,'APROBADA');
  });
  await t.test('CASE 2 same-role authorized but unassigned manager rejected',async()=>{
   const {r,f}=await create('unassigned');assert.equal((await flows.getById(f.id,otherActor)).decisionAuthorization.allowed,false);
   await assert.rejects(()=>flows.approve(f.id,undefined,otherActor),e=>e.getStatus()===403);assert.equal((await p.expenseRequest.findUnique({where:{id:r.id}})).status,'PENDIENTE_APROBACION');
  });
  await t.test('CASE 3 assigned actor without permission rejected',async()=>{
   const {f}=await create('no-permission',none.id);assert.equal((await flows.getById(f.id,noneActor)).decisionAuthorization.allowed,false);
   await assert.rejects(()=>flows.approve(f.id,undefined,noneActor),e=>e.getStatus()===403);
  });
  await t.test('CASE 4 second level denied early and succeeds after first level',async()=>{
   const {r,f}=await create('order',manager.id,other.id);
   await assert.rejects(()=>flows.approve(f.id,undefined,otherActor),e=>e.getStatus()===403);
   await flows.approve(f.id,undefined,managerActor);assert.equal((await p.expenseRequest.findUnique({where:{id:r.id}})).status,'PENDIENTE_APROBACION');
   assert.equal((await flows.getById(f.id,otherActor)).decisionAuthorization.allowed,true);await flows.approve(f.id,undefined,otherActor);
   assert.equal((await p.expenseRequest.findUnique({where:{id:r.id}})).status,'APROBADA');
  });
  await t.test('CASE 5 already approved request cannot be approved again',async()=>{
   const {f}=await create('repeat');await flows.approve(f.id,undefined,managerActor);
   assert.equal((await flows.getById(f.id,managerActor)).decisionAuthorization.allowed,false);
   await assert.rejects(()=>flows.approve(f.id,undefined,managerActor),e=>e.getStatus()===400);
  });
  await t.test('CASE 6 two simultaneous operations resolve level exactly once',async()=>{
   const {r,f}=await create('concurrency');const results=await Promise.allSettled([flows.approve(f.id,'first',managerActor),flows.approve(f.id,'second',managerActor)]);
   assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(results.filter(x=>x.status==='rejected').length,1);
   assert.equal(await p.expenseRequestTrace.count({where:{requestId:r.id,event:'SOLICITUD_APROBADA'}}),1);
  });
  await t.test('CASE 7 assigned foreign company with global read permission denied',async()=>{
   assert.ok(foreignActor.permissions.includes('EXPENSE_REQUEST_VIEW_ALL'));
   const {f}=await create('company',foreign.id);assert.equal((await flows.getById(f.id,foreignActor)).decisionAuthorization.allowed,false);
   await assert.rejects(()=>flows.approve(f.id,undefined,foreignActor),e=>e.getStatus()===403);
  });
  await t.test('request terminal state, wrong role and earlier incomplete level rejected',async()=>{
   const {r,f}=await create('states');await p.expenseRequest.update({where:{id:r.id},data:{status:'RECHAZADA'}});
   await assert.rejects(()=>flows.approve(f.id,undefined,managerActor),e=>e.getStatus()===400);
   await p.expenseRequest.update({where:{id:r.id},data:{status:'PENDIENTE_APROBACION'}});
   await assert.rejects(()=>flows.approve(f.id,undefined,{...managerActor,role:'FINANZAS'}),e=>e.getStatus()===403);
   const ordered=await create('invalid-order',manager.id,other.id);
   await p.approvalFlow.update({where:{id:ordered.f.id},data:{currentStepOrder:2}});
   await p.approvalStep.updateMany({where:{flowId:ordered.f.id,order:2},data:{status:'ASIGNADA'}});
   await assert.rejects(()=>flows.approve(ordered.f.id,undefined,otherActor),e=>e.getStatus()===400);
  });
 }finally{await p.$disconnect()}
});

const eligibleUser=(permissions=['EXPENSE_REQUEST_APPROVE'])=>({id:'manager',companyId:'company',role:'GERENTE',active:true,blocked:false,roles:[{role:{code:'GERENTE',permissions:permissions.map(code=>({permission:{active:true,code}}))}}]});
const entity={entityType:'EXPENSE_REQUEST',entityId:'request',expenseRequestId:'request',companyId:'company',requesterId:'requester'};
const evaluation={approvalsRequired:[{ruleId:'rule',code:'POL-004'}]};
function engineFixture(u){let saved=false;const prisma={approvalFlow:{findUnique:async()=>null},policyRule:{findMany:async()=>[{id:'rule',code:'POL-004',approvalSteps:[{approverUserId:'manager',approverRoleId:'role',approverRole:{code:'GERENTE'},required:true}]}]},user:{findFirst:async()=>u,findUnique:async()=>u},$transaction:async fn=>fn({approvalFlow:{create:async()=>{saved=true;return {id:'flow',steps:[{assignedUser:{name:'Manager'}}]}}},expenseRequestTrace:{createMany:async()=>{}}})};return {engine:new ApprovalEngineService(prisma),saved:()=>saved};}
test('request assignment accepts canonical permission',async()=>{const f=engineFixture(eligibleUser());await f.engine.generateFlow(entity,evaluation,'Requester');assert.equal(f.saved(),true)});
test('request assignment refuses configured manager without permission before creating flow',async()=>{const f=engineFixture(eligibleUser([]));await assert.rejects(()=>f.engine.generateFlow(entity,evaluation,'Requester'));assert.equal(f.saved(),false)});
test('request assignment refuses blocked user or role mismatch',async()=>{for(const u of [{...eligibleUser(),blocked:true},{...eligibleUser(),roles:[{role:{code:'FINANZAS',permissions:[]}}]}]){const f=engineFixture(u);await assert.rejects(()=>f.engine.generateFlow(entity,evaluation,'Requester'));assert.equal(f.saved(),false)}});
test('settlement assignment does not acquire new request-permission requirement',async()=>{const f=engineFixture(eligibleUser([]));await f.engine.generateFlow({...entity,entityType:'EXPENSE_SETTLEMENT',expenseRequestId:undefined},evaluation,'Requester');assert.equal(f.saved(),true)});