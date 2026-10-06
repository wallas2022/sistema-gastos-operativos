const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=(file)=>fs.readFileSync(path.join(__dirname,'..','src',file),'utf8');
const navigation=read('navigation/navigation.ts'),sidebar=read('layout/Sidebar.tsx'),layout=read('layout/MainLayout.tsx'),router=read('router.tsx');
test('la matriz visual contempla los seis roles reales',()=>{for(const role of ['ADMIN','GERENTE','FINANZAS','TESORERIA','REVISOR_OCR','SOLICITANTE'])assert.match(navigation,new RegExp(`['"]${role}['"]`))});
test('seguridad reutiliza permisos SECURITY existentes',()=>{for(const permission of ['SECURITY_USERS_READ','SECURITY_ROLES_READ','SECURITY_PERMISSIONS_READ','SECURITY_MATRIX_READ'])assert.match(navigation,new RegExp(permission))});
test('sidebar permite colapsar y persiste preferencia y grupos',()=>{assert.match(layout,/sidebarExpanded/);assert.match(sidebar,/sidebarGroups/);assert.match(sidebar,/PanelLeftClose/)});
test('sidebar accesible incluye etiquetas, foco, aria-expanded y Escape',()=>{assert.match(sidebar,/aria-label/);assert.match(sidebar,/aria-expanded/);assert.match(sidebar,/_focusVisible/);assert.match(sidebar,/Escape/)});
test('layout móvil implementa apertura y cierre del menú',()=>{assert.match(layout,/mobileOpen/);assert.match(layout,/Abrir menú/);assert.match(sidebar,/Cerrar menú/)});
test('protección visual y breadcrumbs se aplican centralmente',()=>{assert.match(layout,/routeAccess/);assert.match(layout,/ForbiddenPage/);assert.match(layout,/Breadcrumbs/)});
test('router conserva página 404',()=>assert.match(router,/path:\s*["']\*["']/));

const ts=require('typescript'), vm=require('node:vm');
const navModule={exports:{}};
vm.runInNewContext(ts.transpileModule(navigation,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:navModule.exports,require:(id)=>id==='lucide-react'?{}:require(id),localStorage:{getItem:()=>null}});
const access=navModule.exports.routeAccess;
test('unknown routes including unknown descendants are denied by default',()=>{
  const admin={role:'ADMIN',permissions:[]};
  for(const url of ['/unknown','/security/users/unknown','/reportes/solicitudes/unknown','/rendicion-conciliacion/ocr/dashboard/unknown','/solicitudes-gastos/a/unknown'])assert.equal(access(url,admin),false,url);
});
test('document read permissions and direct detail routes match',()=>{
  const viewer={role:'SOLICITANTE',permissions:['OCR_VIEW_OWN']};
  assert.equal(access('/rendicion-conciliacion/ocr/documentos/id',viewer),true);
  assert.equal(access('/documents/id',viewer),true);
  assert.equal(access('/rendicion-conciliacion/ocr/documentos/id',{...viewer,permissions:[]}),false);
});
test('report routes require REPORTS_VIEW and compatible role',()=>{
  assert.equal(access('/reportes/solicitudes',{role:'FINANZAS',permissions:[]}),false);
  assert.equal(access('/reportes/solicitudes',{role:'FINANZAS',permissions:['REPORTS_VIEW']}),true);
  assert.equal(access('/reportes/solicitudes',{role:'SOLICITANTE',permissions:['REPORTS_VIEW']}),false);
});
