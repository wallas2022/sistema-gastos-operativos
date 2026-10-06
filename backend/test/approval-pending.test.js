const test = require('node:test');
const assert = require('node:assert/strict');
const { ApprovalFlowService } = require('../dist/src/modules/approval/approval-flow.service');
const { ApprovalDecisionService } = require('../dist/src/modules/approval/approval-decision.service');
const user = { id: 'approver', name: 'Approver', role: 'ADMIN' };
const request = { id:'request', requesterId:'requester', status:'PENDIENTE_APROBACION', companyId:'company', code:'REQ-1', concept:'Travel', companyName:'Company', requesterName:'Requester', estimatedAmount:'100', currency:'GTQ' };
const step = { id:'step', flowId:'flow', order:1, required:true, assignedUserId:user.id, approverRoleCode:'ADMIN', status:'ASIGNADA' };
function fixture({ next=false, changed=1 }={}) {
  const flow = { id:'flow', entityType:'EXPENSE_REQUEST', expenseRequestId:request.id, expenseRequest:{...request}, status:'EN_REVISION', currentStepOrder:1, steps:[{...step}] };
  if(next) flow.steps.push({id:'next',order:2,status:'PENDIENTE',required:true,assignedUserId:'second',assignedUser:{name:'Second'}});
  const calls=[];
  const tx={ approvalStep:{updateMany:async args=>{calls.push(['step',args]);if(args.where.id){if(changed===1)Object.assign(flow.steps[0],args.data);return {count:changed}}return {count:1}},update:async args=>{Object.assign(flow.steps.find(s=>s.id===args.where.id),args.data)}},approvalFlow:{update:async args=>Object.assign(flow,args.data)},expenseRequest:{update:async args=>Object.assign(flow.expenseRequest,args.data)},expenseRequestTrace:{create:async args=>calls.push(['trace',args])}};
  const prisma={approvalFlow:{findUnique:async()=>flow},$transaction:async fn=>fn(tx)};
  return {flow,calls,service:new ApprovalFlowService(prisma)};
}
test('pending query excludes settlement flows and preserves personal/company scope',async()=>{
  let query;
  const current={...step,flow:{expenseRequest:request,currentStepOrder:1}};
  const service=new ApprovalFlowService({approvalStep:{findMany:async q=>{query=q;return [current,{...step,order:2,flow:{expenseRequest:request,currentStepOrder:1}},{...step,flow:{expenseRequest:null,currentStepOrder:1}}]}}});
  const items=await service.getPending({...user,role:'GERENTE',companyId:'company'});
  assert.deepEqual(items,[current]);
  assert.equal(query.where.assignedUserId,user.id);
  assert.equal(query.where.flow.entityType,'EXPENSE_REQUEST');
  assert.deepEqual(query.where.flow.expenseRequestId,{not:null});
  assert.deepEqual(query.where.flow.expenseRequest,{companyId:'company'});
  assert.equal(query.include.flow.include.expenseRequest,true);
  assert.equal(items.length,1);
});
test('last approval updates request/flow and records trace',async()=>{
  const {flow,calls,service}=fixture();await service.approve(flow.id,undefined,user);
  assert.equal(flow.status,'APROBADA');assert.equal(flow.currentStepOrder,null);
  assert.equal(flow.expenseRequest.status,'APROBADA');assert.equal(flow.steps[0].status,'APROBADA');
  assert.equal(calls.find(c=>c[0]==='trace')[1].data.event,'SOLICITUD_APROBADA');
  await assert.rejects(()=>service.approve(flow.id,undefined,user));
});
test('intermediate approval assigns next level without finalizing request',async()=>{
  const {flow,service}=fixture({next:true});await service.approve(flow.id,'ok',user);
  assert.equal(flow.status,'EN_REVISION');assert.equal(flow.currentStepOrder,2);
  assert.equal(flow.steps[1].status,'ASIGNADA');assert.equal(flow.expenseRequest.status,'PENDIENTE_APROBACION');
});
test('rejection updates request/flow and records trimmed mandatory reason',async()=>{
  const {flow,calls,service}=fixture({next:true});await service.reject(flow.id,'  Invalid request  ',user);
  assert.equal(flow.status,'RECHAZADA');assert.equal(flow.currentStepOrder,null);assert.equal(flow.expenseRequest.status,'RECHAZADA');
  assert.equal(flow.steps[0].comment,'Invalid request');
  assert.equal(calls.find(c=>c[0]==='trace')[1].data.event,'SOLICITUD_RECHAZADA');
  assert.ok(calls.some(c=>c[1].data.status==='OMITIDA'));
});
test('empty rejection, wrong assignee and self approval cannot decide',async()=>{
  const {flow,service}=fixture();await assert.rejects(()=>service.reject(flow.id,'   ',user));
  await assert.rejects(()=>service.approve(flow.id,undefined,{...user,id:'other'}));
  flow.expenseRequest.requesterId=user.id;await assert.rejects(()=>service.approve(flow.id,undefined,user));
  assert.equal(flow.status,'EN_REVISION');
});
for(const action of ['approve','reject']) test(`${action} loses concurrent decision without updating request or trace`,async()=>{
  const {flow,calls,service}=fixture({changed:0});
  await assert.rejects(()=>service[action](flow.id,'reason',user));
  assert.equal(flow.status,'EN_REVISION');assert.equal(flow.expenseRequest.status,'PENDIENTE_APROBACION');
  assert.equal(calls.filter(c=>c[0]==='trace').length,0);
});
test('decision entry point publishes final state and returns refreshed flow',async()=>{
  const {flow,service}=fixture();const events=[];
  const decisions=new ApprovalDecisionService(service,{publish:async e=>events.push(e.type)});
  const result=await decisions.decideByRequest(request.id,'approve',undefined,user);
  assert.equal(result.status,'APROBADA');assert.deepEqual(events,['REQUEST_APPROVED','FLOW_COMPLETED']);
});
test('an assigned manager without approval permission remains denied',async()=>{
  const {flow,service}=fixture();flow.steps[0].approverRoleCode='GERENTE';
  await assert.rejects(()=>service.approve(flow.id,undefined,{...user,role:'GERENTE',companyId:'company',permissions:[]}),e=>e.getStatus()===403);
  assert.equal(flow.status,'EN_REVISION');
});