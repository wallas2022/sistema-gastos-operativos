const {PrismaClient}=require('@prisma/client');
const fs=require('node:fs');
(async()=>{
  if(!/^\/aprobaciones_(auth_)?qa_/.test(new URL(process.env.DATABASE_URL).pathname))throw new Error('Este fixture solo admite una base aislada aprobaciones_qa_* o aprobaciones_auth_qa_*');
  const p=new PrismaClient();
  try {
    const admin=await p.user.findUniqueOrThrow({where:{email:'admin@demo.com'}});
    const requester=await p.user.findUniqueOrThrow({where:{email:'solicitante@demo.com'},include:{company:true}});
    const manager=await p.user.findUniqueOrThrow({where:{email:'gerente@demo.com'}});
    // Give the QA manager the explicit authority required by the existing approval guard.
    // This fixture refuses operational databases and does not alter production roles.
    const role=await p.role.upsert({where:{code:'GERENTE'},update:{},create:{code:'GERENTE',name:'Gerente'}});
    const permission=await p.permission.upsert({where:{code:'EXPENSE_REQUEST_APPROVE'},update:{active:true},create:{code:'EXPENSE_REQUEST_APPROVE',name:'Aprobar solicitudes asignadas',module:'Aprobaciones',action:'APPROVE',active:true}});
    await p.rolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:permission.id}},update:{},create:{roleId:role.id,permissionId:permission.id}});
    await p.userRole.upsert({where:{userId_roleId:{userId:manager.id,roleId:role.id}},update:{},create:{userId:manager.id,roleId:role.id}});
    // Retire previous fixtures from this dedicated QA inbox so reruns are deterministic.
    const previous=await p.expenseRequest.findMany({where:{code:{startsWith:'QA-APR-'}},select:{id:true}});
    const ids=previous.map(r=>r.id);
    await p.approvalStep.updateMany({where:{flow:{expenseRequestId:{in:ids}},status:{in:['ASIGNADA','EN_REVISION','OBSERVADA','PENDIENTE']}},data:{status:'CANCELADA'}});
    await p.approvalFlow.updateMany({where:{expenseRequestId:{in:ids},status:{in:['EN_REVISION','OBSERVADA','PENDIENTE']}},data:{status:'CANCELADA',currentStepOrder:null,cancelledAt:new Date()}});
    await p.expenseRequest.updateMany({where:{id:{in:ids},status:'PENDIENTE_APROBACION'},data:{status:'ANULADA'}});
    const results=[];
    for(const [name,next] of [['APROBAR',false],['RECHAZAR',false],['NIVELES',true]]){
      const r=await p.expenseRequest.create({data:{code:`QA-APR-${name}-${Date.now()}`,type:'GASTO_OPERATIVO',status:'PENDIENTE_APROBACION',priority:'NORMAL',requesterId:requester.id,requesterName:requester.name,requesterRole:requester.role,companyId:requester.companyId,companyName:requester.company.name,costCenter:'QA',concept:`Validacion aprobaciones ${name}`,justification:'Fixture aislado para comprobar bandeja y decisiones',estimatedAmount:100,currency:'GTQ'}});
      const f=await p.approvalFlow.create({data:{entityType:'EXPENSE_REQUEST',entityId:r.id,expenseRequestId:r.id,status:'EN_REVISION',currentStepOrder:1,steps:{create:[{order:1,required:true,status:'ASIGNADA',assignedUserId:admin.id,approverRoleCode:'ADMIN',assignedAt:new Date()},...(next?[{order:2,required:true,status:'PENDIENTE',assignedUserId:manager.id,approverRoleCode:'GERENTE'}]:[])]}}});
      results.push({name,code:r.code,requestId:r.id,flowId:f.id});
    }
    fs.writeFileSync('/tmp/aprobaciones-fixtures.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
  }finally{await p.$disconnect()}
})().catch(e=>{console.error(e);process.exitCode=1});