const assert = require('node:assert/strict');
const test = require('node:test');
const { PrismaClient, Prisma, ExpenseRequestStatus, ExpenseType, RequestPriority, PaymentModality, PaymentMethod, DocumentStatus, DocumentComplianceResult, ApprovalFlowStatus, ApprovalStepStatus, BudgetSourceType, BudgetVersionStatus } = require('@prisma/client');
const { createOcrFixtureIdentity } = require('./settlements-e2e.fixture');
const { BudgetRepository } = require('../dist/src/modules/budget/budget.repository');
const { BudgetEngineService } = require('../dist/src/modules/budget/budget-engine.service');
const { BudgetReservationService } = require('../dist/src/modules/budget/budget-reservation.service');
const { MoneyService } = require('../dist/src/modules/exchange-rates/money.service');
const { StorageService } = require('../dist/src/modules/documents/storage/storage.service');
const { ExpenseRequestPaymentsService } = require('../dist/src/modules/expense-request-payments/expense-request-payments.service');
const { ApprovalFlowService } = require('../dist/src/modules/approval/approval-flow.service');
const { ApprovalDecisionService } = require('../dist/src/modules/approval/approval-decision.service');
const { WorkflowEventBus } = require('../dist/src/modules/workflow/workflow-event-bus.service');
const { BudgetWorkflowSubscriber } = require('../dist/src/modules/budget/budget-workflow.subscriber');
const { SettlementsService } = require('../dist/src/modules/settlements/settlements.service');

const prisma = new PrismaClient();
const cfg = { get: (key) => ({ S3_BUCKET:'documents', S3_REGION:'us-east-1', S3_ENDPOINT:process.env.S3_ENDPOINT || 'http://127.0.0.1:9000', S3_ACCESS_KEY:process.env.S3_ACCESS_KEY || 'minioadmin', S3_SECRET_KEY:process.env.S3_SECRET_KEY || 'minioadmin' }[key]) };
const storage = new StorageService(cfg);
const file = (name, type='application/pdf') => ({ fieldname:'file', originalname:name, encoding:'7bit', mimetype:type, size:Buffer.byteLength('E2E-TEST'), buffer:Buffer.from('E2E-TEST') });
const actor = (u, permissions=[]) => ({ id:u.id, name:u.name, role:u.role, companyId:u.companyId, permissions });

async function ensureBase(suffix) {
  const shortCode = `E${String(suffix).slice(-9)}${Math.floor(Math.random()*1000)}`;
  const country = await prisma.country.create({ data:{code:shortCode,name:'E2E Country',active:true} });
  const currency = await prisma.currency.create({ data:{code:shortCode,name:'E2E Currency',symbol:'E2E',active:true} });
  const company = await prisma.company.create({ data:{ code:`E2E-LIQ-${suffix}`, name:'E2E-LIQUIDATION-COMPANY', countryId:country.id, currencyId:currency.id, active:true } });
  const requester = await prisma.user.create({data:{email:`e2e-requester-${suffix}@test.local`,name:'E2E Requester',passwordHash:'E2E_ONLY',role:'SOLICITANTE',companyId:company.id}});
  const approver = await prisma.user.create({data:{email:`e2e-approver-${suffix}@test.local`,name:'E2E Approver',passwordHash:'E2E_ONLY',role:'ADMIN',companyId:company.id}});
  const finance = await prisma.user.create({data:{email:`e2e-finance-${suffix}@test.local`,name:'E2E Finance',passwordHash:'E2E_ONLY',role:'FINANZAS',companyId:company.id}});
  const ocr = await createOcrFixtureIdentity(prisma,{companyId:company.id,suffix});
  const year = new Date().getFullYear(); const month = new Date().getMonth()+1;
  const version = await prisma.budgetVersion.create({data:{fiscalYear:year,versionNumber:Math.floor(Date.now()%100000000)+Math.floor(Math.random()*1000),sourceType:BudgetSourceType.EXCEL,sourceHash:`e2e-${suffix}`,status:BudgetVersionStatus.ACTIVE,active:true,importedByUserId:finance.id,rowCount:1,approvedTotal:new Prisma.Decimal(100000),currencyId:currency.id}});
  const line = await prisma.budgetLine.create({data:{versionId:version.id,naturalKey:`E2E-${suffix}`,sourceRow:1,sourceCountryCode:country.code,countryId:country.id,companyId:company.id,businessUnit:'E2E',objectCode:'E2E',subCode:'E2E',accountCode:`E2E-${suffix}`,accountDescription:'E2E',detailDescription:'E2E',area:'E2E',currency:currency.code,annualAmount:new Prisma.Decimal(100000)}});
  const period = await prisma.budgetPeriod.create({data:{budgetLineId:line.id,fiscalYear:year,month,approvedAmount:new Prisma.Decimal(100000)}});
  const bank = await prisma.bank.create({data:{code:`E2E-BANK-${suffix}`,name:`E2E Bank ${suffix}`,active:true}});
  return {country,currency,company,requester,approver,finance,ocr,version,line,period,bank,year,month};
}

async function createRequest(f, suffix) {
  const request = await prisma.expenseRequest.create({data:{code:`E2E-REQ-${suffix}`,type:ExpenseType.GASTO_OPERATIVO,status:ExpenseRequestStatus.PENDIENTE_APROBACION,priority:RequestPriority.NORMAL,paymentModality:PaymentModality.PAGO_DIRECTO,intendedBeneficiaryName:'E2E Beneficiary',requesterId:f.requester.id,requesterName:f.requester.name,requesterRole:'SOLICITANTE',companyName:f.company.name,costCenter:'E2E',budgetAccount:f.line.accountCode,concept:'E2E financial chain',justification:'Integration fixture',companyId:f.company.id,currencyId:f.currency.id,estimatedAmount:new Prisma.Decimal(10000),currency:f.currency.code,exchangeRate:new Prisma.Decimal(1),budgetAmount:new Prisma.Decimal(10000),budgetCurrencyId:f.currency.id,countryId:f.country.id,budgetLineId:f.line.id,budgetPeriodId:f.period.id,estimatedDate:new Date(f.year,f.month-1,10)}});
  const flow = await prisma.approvalFlow.create({data:{entityType:'EXPENSE_REQUEST',entityId:request.id,expenseRequestId:request.id,status:ApprovalFlowStatus.EN_REVISION,currentStepOrder:1,steps:{create:{order:1,required:true,status:ApprovalStepStatus.ASIGNADA,assignedUserId:f.approver.id,approverRoleCode:'ADMIN',assignedAt:new Date()}}}});
  return {request,flow};
}

async function createOcrDocument(f, suffix, amount = 10000) {
  const doc = await prisma.document.create({data:{fileName:`e2e-invoice-${suffix}.pdf`,fileType:'INVOICE',mimeType:'application/pdf',storagePath:`e2e/${suffix}.pdf`,sizeBytes:BigInt(8),status:DocumentStatus.CONFIRMADO,userId:f.ocr.user.id,expenseRequestId:null,ocrResult:{create:{processStatus:'COMPLETED',currencyCode:f.currency.code,totalAmount:new Prisma.Decimal(amount),confirmedAt:new Date(),eligibleForSettlement:true,usedInSettlement:false,fiscalCompanyId:f.company.id,fiscalCompanyIdentificationStatus:'EMPRESA_IDENTIFICADA',complianceResult:DocumentComplianceResult.VALIDACION_FISCAL_APROBADA,receiverType:'EMPRESA',fiscalCompanyTaxId:'E2E-TAX'}}}});
  return doc;
}

async function run() {
  const suffix = `${Date.now()}${Math.floor(Math.random()*1000)}`;
  const f = await ensureBase(suffix);
  const budgetRepo = new BudgetRepository(prisma); const budgetEngine = new BudgetEngineService(budgetRepo); const reservations = new BudgetReservationService(budgetRepo,budgetEngine);
  const events = new WorkflowEventBus(); const subscriber = new BudgetWorkflowSubscriber(events,reservations); subscriber.onModuleInit();
  const flowService = new ApprovalFlowService(prisma,events); const decisions = new ApprovalDecisionService(flowService,events);
  const money = new MoneyService(prisma); const payments = new ExpenseRequestPaymentsService(prisma,storage);
  const policy = { evaluate: async()=>({approvalsRequired:[]}) }; const approvalEngine = { generateFlow: async()=>null };
  const settlements = new SettlementsService(prisma,money,storage,policy,approvalEngine);
  const reqData = await createRequest(f,suffix);
  const requester = actor(f.requester); const approver = actor(f.approver); const finance = actor(f.finance); const ocrActor = f.ocr.actor;
  await reservations.reserve(reqData.request.id);
  let reservation = await prisma.budgetReservation.findFirst({where:{expenseRequestId:reqData.request.id}}); assert.equal(reservation.status,'RESERVED');
  await decisions.decideByRequest(reqData.request.id,'approve','Aprobaci�n E2E',approver);
  const requestApproved = await prisma.expenseRequest.findUnique({where:{id:reqData.request.id}}); assert.equal(requestApproved.status,'APROBADA');
  reservation = await prisma.budgetReservation.findFirst({where:{expenseRequestId:reqData.request.id}}); assert.equal(reservation.status,'EXECUTED');
  const paymentResult = await payments.create({expenseRequestId:reqData.request.id,paymentMethod:PaymentMethod.TRANSFERENCIA,currencyId:f.currency.id,amountPaid:10000,referenceNumber:`E2E-PAY-${suffix}`,beneficiaryName:'E2E Beneficiary',bankName:'E2E Bank',accountNumber:'E2E-ACCOUNT'},file(`e2e-payment-${suffix}.pdf`),finance);
  assert.equal(paymentResult.payment.paymentStatus,'PAGADO');
  const doc = await createOcrDocument(f,suffix);
  const settlement = await settlements.create({expenseRequestId:reqData.request.id,paymentId:paymentResult.payment.id},requester);
  await settlements.selectDocument(settlement.id,doc.id,ocrActor);
  const reconciled = await settlements.get(settlement.id,finance); assert.equal(reconciled.balanceStatus,'CUADRADA'); assert.equal(new Prisma.Decimal(reconciled.documentsTotal).toString(),'10000');
  await settlements.submit(settlement.id,requester);
  await settlements.approve(settlement.id,'Liquidaci�n aprobada',finance);
  await settlements.close(settlement.id,finance);
  await settlements.certify(settlement.id,finance);
  const final = await prisma.expenseSettlement.findUnique({where:{id:settlement.id},include:{documents:true,refunds:true,payment:true,expenseRequest:true}});
  const finalDoc = await prisma.oCRResult.findUnique({where:{documentId:doc.id}});
  assert.equal(final.status,'CERRADA'); assert.equal(final.certificationStatus,'CERTIFICADA'); assert.equal(final.refunds.length,0); assert.equal(finalDoc.usedInSettlement,true);
  console.log(JSON.stringify({scenario:'E2E_FINANCIERO_COMPLETO',database:await prisma.$queryRawUnsafe('SELECT current_database() AS db'),companyId:f.company.id,requestId:reqData.request.id,requestStatus:final.expenseRequest.status,reservationId:reservation.id,reservationStatus:reservation.status,paymentId:final.paymentId,paymentStatus:final.payment.paymentStatus,documentId:doc.id,usedInSettlement:finalDoc.usedInSettlement,settlementId:final.id,code:final.code,documentsTotal:final.documentsTotal.toString(),differenceAmount:final.differenceAmount.toString(),balanceStatus:final.balanceStatus,status:final.status,certificationStatus:final.certificationStatus},null,2));
  subscriber.onModuleDestroy();
  return {f,request:reqData.request,settlement:final,doc};
}

test('E2E financiero completo contra PostgreSQL usando fixture RBAC real', async (t) => {
  if (!process.env.DATABASE_URL && !process.env.SECURITY_TEST_DATABASE_URL) { t.skip('DATABASE_URL no configurada'); return; }
  if (process.env.SECURITY_TEST_DATABASE_URL) process.env.DATABASE_URL=process.env.SECURITY_TEST_DATABASE_URL;
  let result;
  try { result = await run(); } catch (e) { console.error('E2E_FINANCIAL_FAILURE', e); throw e; }
  assert.ok(result.settlement);
});



async function buildServices() { const br=new BudgetRepository(prisma); const be=new BudgetEngineService(br); const reservations=new BudgetReservationService(br,be); const events=new WorkflowEventBus(); const sub=new BudgetWorkflowSubscriber(events,reservations); sub.onModuleInit(); const flows=new ApprovalFlowService(prisma,events); const decisions=new ApprovalDecisionService(flows,events); const payments=new ExpenseRequestPaymentsService(prisma,storage); const settlements=new SettlementsService(prisma,new MoneyService(prisma),storage,{evaluate:async()=>({approvalsRequired:[]})},{generateFlow:async()=>null}); return {reservations,decisions,payments,settlements,sub}; }
async function runScenario({documentsAmount,refundAmount,suffix}) { const f=await ensureBase(suffix); const x=await buildServices(); const r=await createRequest(f,suffix); const requester=actor(f.requester), approver=actor(f.approver), finance=actor(f.finance); await x.reservations.reserve(r.request.id); await x.decisions.decideByRequest(r.request.id,'approve','Aprobaci�n E2E',approver); const pay=await x.payments.create({expenseRequestId:r.request.id,paymentMethod:PaymentMethod.TRANSFERENCIA,currencyId:f.currency.id,amountPaid:10000,referenceNumber:'E2E-PAY-'+suffix,beneficiaryName:'E2E Beneficiary',bankName:'E2E Bank',accountNumber:'E2E-ACCOUNT'},file('e2e-payment-'+suffix+'.pdf'),finance); const doc=await createOcrDocument(f,suffix,documentsAmount); const st=await x.settlements.create({expenseRequestId:r.request.id,paymentId:pay.payment.id},requester); await x.settlements.selectDocument(st.id,doc.id,f.ocr.actor); let refund=null; let refundError=null; if(refundAmount){ try { const after=await x.settlements.registerRefund(st.id,{paymentMethod:PaymentMethod.TRANSFERENCIA,amount:String(refundAmount),currencyId:f.currency.id,operationDate:new Date().toISOString(),referenceNumber:'E2E-REF-'+suffix,bankId:f.bank.id,observations:'E2E refund'},file('e2e-refund-'+suffix+'.pdf'),finance); refund=after.refunds[0]; await x.settlements.validateRefund(st.id,refund.id,'APPROVE',undefined,finance); } catch(e) { refundError=e; } } if(refundError) { const failed=await prisma.expenseSettlement.findUnique({where:{id:st.id},include:{refunds:true,payment:true,expenseRequest:true}}); x.sub.onModuleDestroy(); return {f,r:r.request,pay:pay.payment,doc,refund,refundError,final:failed,ocr:null,closeError:refundError}; } await x.settlements.submit(st.id,requester); await x.settlements.approve(st.id,'Liquidaci�n aprobada',finance); let closeError=null; try { await x.settlements.close(st.id,finance); } catch(e){ closeError=e; } if(!closeError) await x.settlements.certify(st.id,finance); const final=await prisma.expenseSettlement.findUnique({where:{id:st.id},include:{refunds:true,payment:true,expenseRequest:true}}); x.sub.onModuleDestroy(); return {f,r:r.request,pay:pay.payment,doc,refund,final,closeError}; }

test('E2E financiero con reintegro real contra PostgreSQL',async()=>{ const s=await runScenario({documentsAmount:8500,refundAmount:1500,suffix:'R'+Date.now()+Math.floor(Math.random()*1000)}); assert.equal(s.final.status,'CERRADA'); assert.equal(s.final.certificationStatus,'CERTIFICADA'); assert.equal(s.final.balanceStatus,'CUADRADA'); assert.equal(s.final.refunds.length,1); console.log(JSON.stringify({scenario:'E2E_REINTEGRO',requestId:s.r.id,settlementId:s.final.id,refundId:s.final.refunds[0].id,documentsTotal:s.final.documentsTotal.toString(),refundTotal:s.final.validatedRefundTotal.toString(),difference:s.final.differenceAmount.toString(),status:s.final.status,certification:s.final.certificationStatus},null,2)); });
test('E2E inconsistente rechaza reintegro parcial seg�n regla vigente',async()=>{ const s=await runScenario({documentsAmount:8500,refundAmount:1000,suffix:'I'+Date.now()+Math.floor(Math.random()*1000)}); assert.ok(s.refundError); assert.notEqual(s.final.status,'CERRADA'); assert.notEqual(s.final.certificationStatus,'CERTIFICADA'); console.log(JSON.stringify({scenario:'E2E_INCONSISTENTE',requestId:s.r.id,settlementId:s.final.id,difference:s.final.differenceAmount.toString(),balance:s.final.balanceStatus,refundRejected:s.refundError.message,status:s.final.status,certification:s.final.certificationStatus},null,2)); });



async function createApprovedPaidFixture(suffix) {
  const f=await ensureBase(suffix); const x=await buildServices(); const r=await createRequest(f,suffix); const requester=actor(f.requester), approver=actor(f.approver), finance=actor(f.finance);
  await x.reservations.reserve(r.request.id); await x.decisions.decideByRequest(r.request.id,'approve','Concurrency fixture',approver);
  const pay=await x.payments.create({expenseRequestId:r.request.id,paymentMethod:PaymentMethod.TRANSFERENCIA,currencyId:f.currency.id,amountPaid:10000,referenceNumber:'CONC-PAY-'+suffix,beneficiaryName:'E2E Beneficiary',bankName:'E2E Bank',accountNumber:'E2E-ACCOUNT'},file('conc-payment-'+suffix+'.pdf'),finance);
  const dbReq=await prisma.expenseRequest.findUnique({where:{id:r.request.id}}); const dbPay=await prisma.expenseRequestPayment.findUnique({where:{id:pay.payment.id}}); const dbRes=await prisma.budgetReservation.findFirst({where:{expenseRequestId:r.request.id}});
  assert.equal(dbReq.status,'APROBADA'); assert.equal(dbPay.paymentStatus,'PAGADO'); assert.equal(dbRes.status,'EXECUTED');
  return {f,x,request:r.request,payment:pay.payment,requester};
}

test('concurrencia PostgreSQL de creaci�n de liquidaci�n - tres ejecuciones', async()=>{
  const runs=[];
  for(let i=1;i<=3;i++){
    const suffix='C'+Date.now()+i+Math.floor(Math.random()*1000); const fx=await createApprovedPaidFixture(suffix); const a=actor(fx.f.finance), b=actor(fx.f.finance); const started=Date.now();
    const results=await Promise.all([Promise.resolve().then(()=>fx.x.settlements.create({expenseRequestId:fx.request.id,paymentId:fx.payment.id},a)).then(v=>({ok:true,id:v.id,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()})),Promise.resolve().then(()=>fx.x.settlements.create({expenseRequestId:fx.request.id,paymentId:fx.payment.id},b)).then(v=>({ok:true,id:v.id,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()}))]);
    const rows=await prisma.expenseSettlement.findMany({where:{expenseRequestId:fx.request.id},select:{id:true,code:true,status:true,paymentId:true}}); assert.equal(rows.length,1); assert.equal(results.filter(v=>v.ok).length,1); assert.ok(results.every(v=>v.at>=started)); runs.push({run:i,requestId:fx.request.id,results,rows}); fx.x.sub.onModuleDestroy();
  }
  console.log('CONCURRENCY_LIQUIDATION_RUNS',JSON.stringify(runs,null,2));
});



async function createRefundConcurrencyFixture(suffix) {
  const f=await ensureBase(suffix); const x=await buildServices(); const r=await createRequest(f,suffix); const requester=actor(f.requester), approver=actor(f.approver), finance=actor(f.finance);
  await x.reservations.reserve(r.request.id); await x.decisions.decideByRequest(r.request.id,'approve','Refund concurrency fixture',approver);
  const pay=await x.payments.create({expenseRequestId:r.request.id,paymentMethod:PaymentMethod.TRANSFERENCIA,currencyId:f.currency.id,amountPaid:10000,referenceNumber:'REF-CONC-PAY-'+suffix,beneficiaryName:'E2E Beneficiary',bankName:'E2E Bank',accountNumber:'E2E-ACCOUNT'},file('ref-conc-payment-'+suffix+'.pdf'),finance);
  const doc=await createOcrDocument(f,suffix,8500); const settlement=await x.settlements.create({expenseRequestId:r.request.id,paymentId:pay.payment.id},requester); await x.settlements.selectDocument(settlement.id,doc.id,f.ocr.actor);
  const before=await prisma.expenseSettlement.findUnique({where:{id:settlement.id},include:{refunds:true}}); assert.equal(before.status,'BORRADOR'); assert.equal(before.balanceStatus,'PENDIENTE_DEVOLUCION'); assert.equal(before.differenceAmount.toString(),'1500'); assert.equal(before.refunds.length,0);
  return {f,x,r:r.request,pay:pay.payment,settlement,finance};
}

test('concurrencia PostgreSQL de reintegros - tres ejecuciones', async()=>{ const runs=[]; for(let i=1;i<=3;i++){ const suffix='RC'+Date.now()+i+Math.floor(Math.random()*1000); const fx=await createRefundConcurrencyFixture(suffix); const p2=new PrismaClient(); const svc2=new SettlementsService(p2,new MoneyService(p2),storage,{evaluate:async()=>({approvalsRequired:[]})},{generateFlow:async()=>null}); const u=actor(fx.f.finance); const dto={paymentMethod:PaymentMethod.TRANSFERENCIA,amount:'1500',currencyId:fx.f.currency.id,operationDate:new Date().toISOString(),referenceNumber:'REF-RACE-'+suffix,bankId:fx.f.bank.id,observations:'Concurrent refund'}; const started=Date.now(); const result=await Promise.all([Promise.resolve().then(()=>fx.x.settlements.registerRefund(fx.settlement.id,dto,file('refund-a-'+suffix+'.pdf'),u)).then(v=>({ok:true,refundId:v.refunds[0]?.id,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()})),Promise.resolve().then(()=>svc2.registerRefund(fx.settlement.id,{...dto,referenceNumber:'REF-RACE-B-'+suffix},file('refund-b-'+suffix+'.pdf'),u)).then(v=>({ok:true,refundId:v.refunds[0]?.id,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()}))]); const rows=await prisma.settlementRefund.findMany({where:{settlementId:fx.settlement.id}}); assert.equal(rows.length,1); assert.equal(rows[0].amount.toString(),'1500'); await fx.x.settlements.validateRefund(fx.settlement.id,rows[0].id,'APPROVE',undefined,u); const final=await prisma.expenseSettlement.findUnique({where:{id:fx.settlement.id},include:{refunds:true}}); assert.equal(final.refunds.length,1); assert.equal(final.validatedRefundTotal.toString(),'1500'); assert.equal(final.differenceAmount.toString(),'0'); assert.equal(final.balanceStatus,'CUADRADA'); assert.ok(result.some(v=>v.ok)); assert.ok(result.every(v=>v.at>=started)); runs.push({run:i,settlementId:fx.settlement.id,results:result,refundCount:rows.length,total:final.validatedRefundTotal.toString(),difference:final.differenceAmount.toString(),balance:final.balanceStatus}); await p2.$disconnect(); fx.x.sub.onModuleDestroy(); } console.log('CONCURRENCY_REFUND_RUNS',JSON.stringify(runs,null,2)); });



async function createApprovedSquaredFixture(suffix) { const f=await ensureBase(suffix); const x=await buildServices(); const r=await createRequest(f,suffix); const requester=actor(f.requester), approver=actor(f.approver), finance=actor(f.finance); await x.reservations.reserve(r.request.id); await x.decisions.decideByRequest(r.request.id,'approve','Close concurrency fixture',approver); const pay=await x.payments.create({expenseRequestId:r.request.id,paymentMethod:PaymentMethod.TRANSFERENCIA,currencyId:f.currency.id,amountPaid:10000,referenceNumber:'CLOSE-PAY-'+suffix,beneficiaryName:'E2E Beneficiary',bankName:'E2E Bank',accountNumber:'E2E-ACCOUNT'},file('close-payment-'+suffix+'.pdf'),finance); const doc=await createOcrDocument(f,suffix,10000); const st=await x.settlements.create({expenseRequestId:r.request.id,paymentId:pay.payment.id},requester); await x.settlements.selectDocument(st.id,doc.id,f.ocr.actor); await x.settlements.submit(st.id,requester); await x.settlements.approve(st.id,'Approved for close race',finance); const db=await prisma.expenseSettlement.findUnique({where:{id:st.id},include:{expenseRequest:true,refunds:true,documents:true}}); assert.equal(db.status,'APROBADA'); assert.equal(db.balanceStatus,'CUADRADA'); assert.equal(db.differenceAmount.toString(),'0'); assert.equal(db.certificationStatus,'PENDIENTE'); return {f,x,settlement:st,finance}; }

test('concurrencia PostgreSQL de cierre - tres ejecuciones', async()=>{ const runs=[]; for(let i=1;i<=3;i++){ const suffix='CC'+Date.now()+i+Math.floor(Math.random()*1000); const fx=await createApprovedSquaredFixture(suffix); const p2=new PrismaClient(); const svc2=new SettlementsService(p2,new MoneyService(p2),storage,{evaluate:async()=>({approvalsRequired:[]})},{generateFlow:async()=>null}); const u1=actor(fx.f.finance), u2=actor(fx.f.finance); const started=Date.now(); const result=await Promise.all([Promise.resolve().then(()=>fx.x.settlements.close(fx.settlement.id,u1)).then(v=>({ok:true,status:v.status,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()})),Promise.resolve().then(()=>svc2.close(fx.settlement.id,u2)).then(v=>({ok:true,status:v.status,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()}))]); const row=await prisma.expenseSettlement.findUnique({where:{id:fx.settlement.id}}); const audits=await prisma.settlementAudit.count({where:{settlementId:fx.settlement.id,action:'CIERRE'}}); assert.equal(row.status,'CERRADA'); assert.equal(row.certificationStatus,'PENDIENTE'); if(audits!==1) console.log('CERT_AUDIT_DIAGNOSTIC',JSON.stringify({audits,result},null,2)); console.log('CERT_AUDITS_DEBUG',fx.settlement.id,audits,result); assert.equal(audits,1); assert.ok(result.filter(v=>v.ok).length>=1); assert.ok(result.every(v=>v.at>=started)); runs.push({run:i,settlementId:fx.settlement.id,results:result,finalStatus:row.status,certification:row.certificationStatus,closeAudits:audits}); await p2.$disconnect(); fx.x.sub.onModuleDestroy(); } console.log('CONCURRENCY_CLOSE_RUNS',JSON.stringify(runs,null,2)); });



test('concurrencia PostgreSQL de certificaci�n - tres ejecuciones', async()=>{ const runs=[]; for(let i=1;i<=3;i++){ const suffix='CERTC'+Date.now()+i+Math.floor(Math.random()*1000); const fx=await createApprovedSquaredFixture(suffix); const fin=actor(fx.f.finance); await fx.x.settlements.close(fx.settlement.id,fin); const before=await prisma.expenseSettlement.findUnique({where:{id:fx.settlement.id}}); assert.equal(before.status,'CERRADA'); assert.equal(before.certificationStatus,'PENDIENTE'); const p2=new PrismaClient(); const svc2=new SettlementsService(p2,new MoneyService(p2),storage,{evaluate:async()=>({approvalsRequired:[]})},{generateFlow:async()=>null}); const u1=actor(fx.f.finance),u2=actor(fx.f.finance); const started=Date.now(); const result=await Promise.all([Promise.resolve().then(()=>fx.x.settlements.certify(fx.settlement.id,u1)).then(v=>({ok:true,status:v.certificationStatus,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()})),Promise.resolve().then(()=>svc2.certify(fx.settlement.id,u2)).then(v=>({ok:true,status:v.certificationStatus,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()}))]); const row=await prisma.expenseSettlement.findUnique({where:{id:fx.settlement.id}}); const audits=await prisma.settlementAudit.count({where:{settlementId:fx.settlement.id,action:'CERTIFICACION'}}); assert.equal(row.status,'CERRADA'); assert.equal(row.certificationStatus,'CERTIFICADA'); assert.equal(audits,1); assert.ok(result.filter(v=>v.ok).length>=1); assert.ok(result.every(v=>v.at>=started)); runs.push({run:i,settlementId:fx.settlement.id,results:result,finalState:row.status,certification:row.certificationStatus,certificationAudits:audits}); await p2.$disconnect(); fx.x.sub.onModuleDestroy(); } console.log('CONCURRENCY_CERTIFICATION_RUNS',JSON.stringify(runs,null,2)); });



test('numeraci�n PostgreSQL concurrente de cinco liquidaciones', async()=>{ const prepared=[]; for(let i=0;i<5;i++) prepared.push(await createApprovedPaidFixture('NUM'+Date.now()+i+Math.floor(Math.random()*1000))); const started=Date.now(); const results=await Promise.all(prepared.map(fx=>Promise.resolve().then(()=>fx.x.settlements.create({expenseRequestId:fx.request.id,paymentId:fx.payment.id},actor(fx.f.requester))).then(v=>({ok:true,id:v.id,code:v.code,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()})))); const ids=results.filter(x=>x.ok).map(x=>x.id); const rows=await prisma.expenseSettlement.findMany({where:{id:{in:ids}},select:{id:true,code:true}}); const codes=rows.map(x=>x.code); console.log('CONCURRENCY_NUMBERING',JSON.stringify({results,rows,count:rows.length,distinctCodes:new Set(codes).size},null,2)); assert.equal(results.filter(x=>x.ok).length,5); assert.equal(new Set(codes).size,5); assert.equal(rows.length,5); assert.ok(results.every(x=>x.at>=started)); console.log('CONCURRENCY_NUMBERING',JSON.stringify({results,rows,count:rows.length,distinctCodes:new Set(codes).size},null,2)); prepared.forEach(fx=>fx.x.sub.onModuleDestroy()); });

test.after(async()=>{ await prisma.$disconnect(); });

async function createSettlementInBase(f, suffix) {
  const x=await buildServices(); const r=await createRequest(f,suffix); const requester=actor(f.requester), approver=actor(f.approver), finance=actor(f.finance);
  await x.reservations.reserve(r.request.id); await x.decisions.decideByRequest(r.request.id,'approve','Document race',approver);
  const pay=await x.payments.create({expenseRequestId:r.request.id,paymentMethod:PaymentMethod.TRANSFERENCIA,currencyId:f.currency.id,amountPaid:10000,referenceNumber:'DOC-PAY-'+suffix,beneficiaryName:'E2E Beneficiary',bankName:'E2E Bank',accountNumber:'E2E-ACCOUNT'},file('doc-payment-'+suffix+'.pdf'),finance);
  const st=await x.settlements.create({expenseRequestId:r.request.id,paymentId:pay.payment.id},requester);
  x.sub.onModuleDestroy();
  return {request:r.request,payment:pay.payment,settlement:st};
}

test('asociaci�n documental PostgreSQL concurrente - tres ejecuciones', async()=>{
  const runs=[];
  for(let i=0;i<3;i++) {
    const suffix='DOC'+Date.now()+i+Math.floor(Math.random()*1000); const f=await ensureBase(suffix);
    const a=await createSettlementInBase(f,suffix+'A'); const b=await createSettlementInBase(f,suffix+'B');
    const doc=await createOcrDocument(f,suffix,10000);
    const p2=new PrismaClient(); const s1=new SettlementsService(prisma,new MoneyService(prisma),storage,{evaluate:async()=>({approvalsRequired:[]})},{generateFlow:async()=>null}); const s2=new SettlementsService(p2,new MoneyService(p2),storage,{evaluate:async()=>({approvalsRequired:[]})},{generateFlow:async()=>null});
    const started=Date.now();
    const results=await Promise.all([s1.selectDocument(a.settlement.id,doc.id,f.ocr.actor).then(v=>({ok:true,settlementId:v.id,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()})),s2.selectDocument(b.settlement.id,doc.id,f.ocr.actor).then(v=>({ok:true,settlementId:v.id,at:Date.now()})).catch(e=>({ok:false,error:e.message,at:Date.now()}))]);
    const rows=await prisma.expenseSettlementDocument.findMany({where:{documentId:doc.id},select:{settlementId:true,documentId:true}}); const ocr=await prisma.oCRResult.findUnique({where:{documentId:doc.id},select:{usedInSettlement:true}});
    assert.equal(rows.length,1); assert.equal(ocr.usedInSettlement,true); assert.equal(results.filter(x=>x.ok).length,1); assert.ok(results.every(x=>x.at>=started));
    const record={run:i+1,documentId:doc.id,settlementA:a.settlement.id,settlementB:b.settlement.id,results,rows,usedInSettlement:ocr.usedInSettlement}; runs.push(record); await p2.$disconnect();
  }
  console.log('CONCURRENCY_DOCUMENT',JSON.stringify(runs,null,2));
});
