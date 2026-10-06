const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { DocumentsService } = require('../dist/src/modules/documents/documents.service');
const { OcrService } = require('../dist/src/modules/ocr/ocr.service');
const { ReportsService } = require('../dist/src/modules/reports/reports.service');
const { ReportsRepository } = require('../dist/src/modules/reports/reports.repository');
const { ReportExportService } = require('../dist/src/modules/reports/report-export.service');
const { ReportsController } = require('../dist/src/modules/reports/reports.controller');
const { DashboardService } = require('../dist/src/modules/dashboard/dashboard.service');
const { TraceabilityService } = require('../dist/src/modules/traceability/traceability.service');
const { SettlementsService } = require('../dist/src/modules/settlements/settlements.service');
const { ExpenseRequestPaymentsService } = require('../dist/src/modules/expense-request-payments/expense-request-payments.service');
const { ExpenseRequestsService } = require('../dist/src/modules/expense-requests/expense-requests.service');
const { ApprovalFlowService } = require('../dist/src/modules/approval/approval-flow.service');
const { BudgetQueryService } = require('../dist/src/modules/budget/budget-query.service');
const { BankingService } = require('../dist/src/modules/banking/banking.service');
const { SecurityService } = require('../dist/src/modules/security/security.service');
const { JwtStrategy } = require('../dist/src/modules/auth/strategies/jwt.strategy');
const { SlaService } = require('../dist/src/modules/workflow/sla.service');
const safe = value => { const json=JSON.stringify(value, (_,v)=>typeof v==='bigint'?String(v):v); assert.equal(json.includes('passwordHash'),false); assert.equal(json.includes('HASH_MUST_NOT_ESCAPE'),false); };
const denied = fn => assert.rejects(fn, error => [403,404].includes(error.getStatus?.()));

test('PostgreSQL security matrix (isolated database only)', async t => {
  const url = new URL(process.env.SECURITY_TEST_DATABASE_URL || '');
  assert.ok(['127.0.0.1','localhost'].includes(url.hostname) && url.pathname==='/security_hardening', 'Refusing a database other than isolated security_hardening');
  const prisma = new PrismaClient({datasources:{db:{url:url.href}}});
  try {
    // This test owns this explicitly named, loopback-only disposable database.
    const tables=await prisma.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'");
    if(tables.length) await prisma.$executeRawUnsafe('TRUNCATE TABLE '+tables.map(t=>'"'+t.tablename.replace(/"/g,'""')+'"').join(',')+' CASCADE');
    const currency=await prisma.currency.create({data:{code:'TST',name:'Test Currency',symbol:'T'}});
    const country=await prisma.country.create({data:{code:'TS',name:'Test Country'}});
    const permissions=['REPORTS_VIEW','OCR_VIEW_COMPANY','OCR_VIEW_OWN','OCR_REVIEW','OCR_CONFIRM','TRACEABILITY_VIEW','EXPENSE_REQUEST_VIEW_COMPANY'];
    const role=await prisma.role.create({data:{code:'FINANZAS',name:'Finance test'}});
    for(const code of permissions) { const permission=await prisma.permission.upsert({where:{code},update:{},create:{code,name:code,module:'test',action:code}}); await prisma.rolePermission.create({data:{roleId:role.id,permissionId:permission.id}}); }
    const fixtures=[];
    for(const label of ['A','B']) {
      const company=await prisma.company.create({data:{code:label,name:'Company '+label,countryId:country.id,currencyId:currency.id}});
      const user=await prisma.user.create({data:{email:label+'@security.test',name:'User '+label,passwordHash:'HASH_MUST_NOT_ESCAPE',role:'FINANZAS',companyId:company.id,roles:{create:{roleId:role.id}}}});
      const request=await prisma.expenseRequest.create({data:{code:'REQUEST-'+label,type:'GASTO_OPERATIVO',requesterId:user.id,requesterName:user.name,requesterRole:'FINANZAS',companyId:company.id,companyName:company.name,costCenter:label,concept:'Private '+label,estimatedAmount:label==='A'?100:900,currencyId:currency.id,status:'APROBADA'}});
      await prisma.expenseRequestTrace.create({data:{requestId:request.id,event:'TEST',description:'Private trace '+label,userName:user.name}});
      const payment=await prisma.expenseRequestPayment.create({data:{expenseRequestId:request.id,paymentMethod:'TRANSFERENCIA',beneficiaryName:user.name,amountPaid:100,currencyId:currency.id,paymentStatus:'PAGADO'}});
      const settlement=await prisma.expenseSettlement.create({data:{code:'SETTLEMENT-'+label,expenseRequestId:request.id,paymentId:payment.id,companyId:company.id,preparedByUserId:user.id,currencyId:currency.id,disbursedAmount:100,differenceAmount:100}});
      const document=await prisma.document.create({data:{fileName:label+'.pdf',fileType:'pdf',mimeType:'application/pdf',storagePath:label+'.pdf',sizeBytes:10n,userId:user.id,ocrResult:{create:{processStatus:'PENDIENTE_REVISION',totalAmount:100,countryDetected:label,documentTypeDetected:'FACTURA',extractedFields:{create:{fieldName:'total',finalValue:'100',corrections:{create:{finalValue:'100',userId:user.id}}}}}}}});
      const version=await prisma.budgetVersion.findFirst({where:{fiscalYear:2026,currencyId:currency.id,active:true}}) || await prisma.budgetVersion.create({data:{fiscalYear:2026,versionNumber:label==='A'?1:2,sourceType:'EXCEL',sourceHash:label,importedByUserId:user.id,rowCount:1,approvedTotal:1000,currencyId:currency.id,active:true,status:'ACTIVE'}});
      const line=await prisma.budgetLine.create({data:{versionId:version.id,naturalKey:label,sourceRow:1,sourceCountryCode:'TS',businessUnit:label,objectCode:label,subCode:'0',accountCode:label,accountDescription:label,detailDescription:label,area:label,annualAmount:1000,companyId:company.id,countryId:country.id,periods:{create:{fiscalYear:2026,month:9,approvedAmount:1000}}}});
      const flow=await prisma.approvalFlow.create({data:{entityType:'EXPENSE_REQUEST',entityId:request.id,expenseRequestId:request.id,status:'EN_REVISION',currentStepOrder:1,steps:{create:{order:1,assignedUserId:user.id,status:'ASIGNADA'}}}});
      const bank=await prisma.bank.upsert({where:{code:'TEST'},update:{},create:{code:'TEST',name:'Test bank'}});
      await prisma.applicantBankAccount.create({data:{userId:user.id,bankId:bank.id,accountType:'AHORRO',accountNumber:label,holderName:user.name,currencyId:currency.id}});
      const strategy=new JwtStrategy({get:()=> 'local-test-signing-secret'},prisma);
      const actor=await strategy.validate({sub:user.id,credentialVersion:0});
      fixtures.push({label,company,user,actor,request,payment,settlement,document,flow,line});
    }
    const storageCalls=[];
    const storage={getFileBuffer:async key=>{storageCalls.push(key);return Buffer.from(key);}};
    const docs=new DocumentsService(prisma,storage,{}), ocr=new OcrService(prisma,{},storage,{});
    const sla=new SlaService(prisma), dashboard=new DashboardService(prisma,sla);
    const reports=new ReportsService(new ReportsRepository(prisma),dashboard,prisma);
    const approvals=new ApprovalFlowService(prisma), traces=new TraceabilityService(prisma,approvals,sla);
    const settlements=new SettlementsService(prisma,{},storage,{},{}), payments=new ExpenseRequestPaymentsService(prisma,storage);
    const requests=new ExpenseRequestsService(prisma,{},{},{},{}), budget=new BudgetQueryService(prisma), banking=new BankingService(prisma);
    await prisma.slaRule.upsert({where:{priority:'NORMAL'},update:{},create:{priority:'NORMAL',targetMinutes:120,warningMinutes:30}});
    for(const f of fixtures) {
      const other=fixtures.find(x=>x!==f), user=f.actor;
      await t.test(`${f.label}: request own allowed / foreign denied`,async()=>{safe(await requests.findOne(f.request.id,user));await denied(()=>requests.findOne(other.request.id,user));});
      await t.test(`${f.label}: document read/download own allowed / foreign denied without storage access`,async()=>{
        safe(await docs.findOne(f.document.id,user));safe(await docs.findAll({},user));
        assert.equal((await docs.getFileStream(f.document.id,user)).buffer.toString(),f.label+'.pdf');
        const before=storageCalls.length;assert.equal(await docs.getFileStream(other.document.id,user),null);assert.equal(storageCalls.length,before);
        await denied(()=>docs.findOne(other.document.id,user));
        assert.equal(await docs.getFileStream(f.document.id,{...user,role:'SOLICITANTE',permissions:[]}),null);
      });
      await t.test(`${f.label}: OCR read own allowed / foreign denied`,async()=>{safe(await ocr.getResult(f.document.id,user));await denied(()=>ocr.getResult(other.document.id,user));});
      for(const [operation,fn] of [
        ['process',u=>ocr.processDocument(f.document.id,u)],['correct',u=>ocr.updateFields(f.document.id,{fields:[]},u)],
        ['confirm',u=>ocr.confirmDocument(f.document.id,u)],['items',u=>ocr.updateLineItems(f.document.id,{items:[]},u)],
        ['fiscal',u=>ocr.validateCompliance(f.document.id,u)],['validation-run',u=>ocr.createValidationRun(f.document.id,{},u)],
      ]) await t.test(`${f.label}: OCR ${operation} denied to read-only actor`,()=>denied(()=>fn({...user,permissions:['OCR_VIEW_COMPANY']})));
      await t.test(`${f.label}: OCR metrics and all aggregates restricted to company`,async()=>{const m=await ocr.metrics(user);assert.equal(m.total,1);assert.equal(m.corrections,1);assert.deepEqual(m.byCompany,[{label:f.company.name,value:1}]);assert.deepEqual(m.byCountry,[{label:f.label,value:1}]);});
      for(const kind of ['requests','budget','approvals','policies','executive','ocr']) await t.test(`${f.label}: ${kind} query/export authorized equally; arbitrary company denied`,async()=>{
        const query={page:1,pageSize:10,sortOrder:'asc'};
        safe(await reports[kind](query,user)); const exported=await reports.exportPayload(kind,query,user);safe(exported);
        if(kind==='requests') assert.deepEqual(exported.rows.map(r=>r.id),[f.request.id]);
        if(kind==='budget') assert.deepEqual(exported.rows.map(r=>r.company),[f.company.name]);
        if(kind==='ocr') assert.deepEqual(exported.rows.map(r=>r.id),[f.document.id]);
        await denied(()=>reports[kind]({...query,companyId:other.company.id},user));await denied(()=>reports.exportPayload(kind,{...query,companyId:other.company.id},user));
      });
      for(const format of ['excel','pdf']) await t.test(`${f.label}: ${format} controller authorizes before producing bytes`,async()=>{
        const controller=new ReportsController(reports,new ReportExportService());let output;
        const res={setHeader(){},send(b){output=b;}};
        await controller.export('requests',format,{page:1,pageSize:10},{user},res);assert.ok(output.length>100);output=null;
        await denied(()=>controller.export('requests',format,{page:1,pageSize:10,companyId:other.company.id},{user},res));assert.equal(output,null);
      });
      await t.test(`${f.label}: report and dashboard catalogs stay in company`,async()=>{for(const svc of [reports,dashboard]){const data=await svc.filters(user);assert.deepEqual(data.companies.map(c=>c.id),[f.company.id]);assert.deepEqual(data.users.map(u=>u.id),[f.user.id]);}});
      await t.test(`${f.label}: traceability own allowed / foreign denied and global event list filtered`,async()=>{safe(await traces.getEventLogsByRequest(f.request.id,user));await denied(()=>traces.getEventLogsByRequest(other.request.id,user));assert.deepEqual((await traces.getEventLogs(user)).map(r=>r.requestId),[f.request.id]);await denied(()=>traces.getStatusMonitorDetail(other.request.id,user));});
      await t.test(`${f.label}: settlement own allowed / foreign denied before mutations`,async()=>{safe(await settlements.get(f.settlement.id,user));await denied(()=>settlements.get(other.settlement.id,user));for(const action of ['observe','reject','approve'])await denied(()=>settlements[action](other.settlement.id,'test',user));await denied(()=>settlements.certify(other.settlement.id,user));assert.equal((await prisma.expenseSettlement.findUnique({where:{id:other.settlement.id}})).status,'BORRADOR');});
      await t.test(`${f.label}: payments and bank accounts stay within company`,async()=>{assert.equal((await payments.findByExpenseRequest(f.request.id,user)).length,1);await denied(()=>payments.findByExpenseRequest(other.request.id,user));assert.equal((await banking.activeAccountsForUser(other.user.id,currency.id,user)).length,0);});
      await t.test(`${f.label}: approval history is safe and resource scoped`,async()=>{safe(await approvals.history(f.flow.id,user));await denied(()=>approvals.history(other.flow.id,user));safe(await approvals.getPending(user));});
      await t.test(`${f.label}: budget line own allowed / foreign denied`,async()=>{safe(await budget.detail(f.line.id,user));await denied(()=>budget.detail(other.line.id,user));assert.deepEqual((await budget.list({page:1,pageSize:10,sortBy:'accountCode'},user)).data.map(r=>r.id),[f.line.id]);});
      await t.test(`${f.label}: OCR write permission cannot cross company`,async()=>{for(const [operation,permission] of [['process','OCR_PROCESS'],['correct','OCR_REVIEW'],['confirm','OCR_CONFIRM']])await denied(()=>ocr.assertDocumentAccess(other.document,{...user,permissions:['OCR_VIEW_COMPANY',permission]},operation));});
      await t.test(`${f.label}: budget evaluation authorizes original request`,async()=>{await budget.assertRequestAccess(f.request.id,user);await denied(()=>budget.assertRequestAccess(other.request.id,user));});
    }
    await t.test('payment proof uses its request company even when uploaded by global administrator',async()=>{
      const [a,b]=fixtures;const admin=await prisma.user.create({data:{email:'proof-admin@security.test',name:'Admin',passwordHash:'HASH_MUST_NOT_ESCAPE',role:'ADMIN'}});
      const proof=await prisma.document.create({data:{fileName:'proof.pdf',fileType:'DISBURSEMENT_EVIDENCE',mimeType:'application/pdf',storagePath:'proof.pdf',sizeBytes:10n,userId:admin.id,expenseRequestId:a.request.id}});
      await prisma.expenseRequestPayment.update({where:{id:a.payment.id},data:{evidenceDocumentId:proof.id}});
      assert.ok(await docs.getFileStream(proof.id,{...a.actor,role:'TESORERIA',permissions:['PAYMENT_VIEW']}));
      assert.equal(await docs.getFileStream(proof.id,{...b.actor,role:'TESORERIA',permissions:['PAYMENT_VIEW']}),null);
      await prisma.expenseRequestPayment.update({where:{id:a.payment.id},data:{evidenceDocumentId:null}});await prisma.document.delete({where:{id:proof.id}});await prisma.user.delete({where:{id:admin.id}});
    });
    await t.test('fiscal company is not an authorization grant for settlement document selection',async()=>{
      const [a,b]=fixtures;
      await prisma.document.update({where:{id:b.document.id},data:{status:'CONFIRMADO'}});
      await prisma.oCRResult.update({where:{documentId:b.document.id},data:{fiscalCompanyId:a.company.id,fiscalCompanyIdentificationStatus:'EMPRESA_IDENTIFICADA',confirmedAt:new Date(),eligibleForSettlement:true,complianceResult:'VALIDACION_FISCAL_APROBADA'}});
      assert.equal((await settlements.eligibleDocuments(a.settlement.id,a.actor)).some(d=>d.id===b.document.id),false);
      await denied(()=>settlements.selectDocument(a.settlement.id,b.document.id,a.actor));
    });
    await t.test('historical assignments cannot bypass current company in approval and SLA inboxes',async()=>{
      const [a,b]=fixtures;await prisma.approvalStep.updateMany({where:{flowId:b.flow.id},data:{assignedUserId:a.user.id}});
      assert.equal((await approvals.getPending(a.actor)).some(step=>step.flowId===b.flow.id),false);
      assert.equal((await sla.pendingForUser(a.actor)).some(step=>step.flowId===b.flow.id),false);
      await denied(()=>sla.forFlow(b.flow.id,a.actor));
      await prisma.approvalStep.updateMany({where:{flowId:b.flow.id},data:{assignedUserId:b.user.id}});
    });
    await t.test('global administrative rights remain available',async()=>{const admin={...fixtures[0].actor,role:'ADMIN'};assert.equal((await reports.requests({page:1,pageSize:10},admin)).meta.total,2);assert.equal((await ocr.metrics(admin)).total,2);safe(await docs.findOne(fixtures[1].document.id,admin));});
    await t.test('explicit global permissions preserve multi-company reporting',async()=>{const actor={...fixtures[0].actor,permissions:['REPORTS_VIEW','EXPENSE_REQUEST_VIEW_ALL','OCR_VIEW_ALL']};assert.equal((await reports.requests({page:1,pageSize:10},actor)).meta.total,2);assert.equal((await ocr.metrics(actor)).total,2);});
    await t.test('security user endpoints never expose password hashes',async()=>{const svc=new SecurityService(prisma,{});safe(await svc.findAllUsers());for(const f of fixtures)safe(await svc.findOneUser(f.user.id));});
    await t.test('migration is idempotent and does not grant process permission to applicants',async()=>{
      for(const code of ['ADMIN','REVISOR_OCR','GERENTE','SOLICITANTE','AUDITOR'])await prisma.role.upsert({where:{code},update:{},create:{code,name:code}});
      const sql=fs.readFileSync(path.join(__dirname,'../prisma/migrations/20260912120000_ocr_process_permission/migration.sql'),'utf8');
      for(let i=0;i<2;i++)for(const statement of sql.split(';').filter(s=>s.trim()))await prisma.$executeRawUnsafe(statement);
      const entries=await prisma.rolePermission.findMany({where:{permission:{code:'OCR_PROCESS'}},include:{role:true}});
      assert.deepEqual(entries.map(e=>e.role.code).sort(),['ADMIN','FINANZAS','GERENTE','REVISOR_OCR']);
    });
  } finally {await prisma.$disconnect();}
});
