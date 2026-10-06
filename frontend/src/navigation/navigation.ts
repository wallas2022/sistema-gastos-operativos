import { BarChart3, ClipboardCheck, ClipboardList, DollarSign, FileSearch, FileSpreadsheet, LayoutDashboard, ReceiptText, ShieldCheck, User, WalletCards } from 'lucide-react';

export const ALL_ROLES = ['ADMIN','GERENTE','FINANZAS','TESORERIA','REVISOR_OCR','SOLICITANTE'] as const;
export type NavigationItem = { label:string; path:string; icon:any; roles?:readonly string[]; permission?:string; anyPermissions?:readonly string[]; counter?:'approvals'|'ocr'|'settlements'|'refunds'|'disbursements' };
export type NavigationGroup = { label:string; icon:any; roles?:readonly string[]; children:NavigationItem[] };

export const navigation: Array<NavigationItem|NavigationGroup> = [
  { label:'Dashboard', path:'/', icon:LayoutDashboard, roles:ALL_ROLES },
  { label:'Solicitudes', icon:ClipboardList, roles:['ADMIN','GERENTE','FINANZAS','SOLICITANTE'], children:[
    {label:'Solicitudes de gastos',path:'/solicitudes-gastos',icon:ClipboardList},
    {label:'Nueva solicitud',path:'/solicitudes-gastos/nueva',icon:ClipboardCheck,roles:['ADMIN','SOLICITANTE']},
    {label:'Aprobaciones',path:'/trazabilidad-flujos/autorizaciones',icon:ClipboardCheck,roles:['ADMIN','GERENTE','FINANZAS'],counter:'approvals'},
  ]},
  { label:'Rendición y conciliación', icon:WalletCards, roles:ALL_ROLES, children:[
    {label:'Centro Documental',path:'/rendicion-conciliacion/ocr/documentos',icon:FileSearch,roles:ALL_ROLES,anyPermissions:['OCR_VIEW_OWN','OCR_VIEW_COMPANY','OCR_VIEW_ALL']},
    {label:'Dashboard OCR',path:'/rendicion-conciliacion/ocr/dashboard',icon:BarChart3,roles:ALL_ROLES,anyPermissions:['OCR_VIEW_OWN','OCR_VIEW_COMPANY','OCR_VIEW_ALL'],counter:'ocr'},
    {label:'Liquidaciones',path:'/rendicion-conciliacion/liquidaciones',icon:ReceiptText,roles:['ADMIN','GERENTE','FINANZAS','TESORERIA','SOLICITANTE'],counter:'settlements'},
    {label:'Mis cuentas bancarias',path:'/mis-cuentas-bancarias',icon:WalletCards,roles:['ADMIN','SOLICITANTE']},
  ]},
  { label:'Tesorería', icon:DollarSign, roles:['ADMIN','FINANZAS','TESORERIA'], children:[
    {label:'Desembolsos',path:'/tesoreria/desembolsos',icon:DollarSign,counter:'disbursements'},
    {label:'Devoluciones',path:'/tesoreria/devoluciones',icon:ClipboardCheck,counter:'refunds'},
  ]},
  { label:'Presupuesto', icon:WalletCards, roles:['ADMIN','FINANZAS'], children:[
    {label:'Control presupuestario',path:'/control-presupuestario',icon:WalletCards},
    {label:'Integración presupuestaria',path:'/integracion-presupuestaria',icon:FileSpreadsheet},
    {label:'Monedas y tasas',path:'/configuracion/monedas-tasas',icon:DollarSign},
  ]},
  { label:'Reportes', icon:FileSpreadsheet, roles:['ADMIN','GERENTE','FINANZAS'], children:[
    {label:'Presupuesto',path:'/reportes/presupuesto',icon:WalletCards,permission:'REPORTS_VIEW'}, {label:'Solicitudes',path:'/reportes/solicitudes',icon:ClipboardList,permission:'REPORTS_VIEW'},
    {label:'Aprobaciones',path:'/reportes/aprobaciones',icon:ClipboardCheck,permission:'REPORTS_VIEW'}, {label:'Ejecutivo',path:'/reportes/ejecutivo',icon:BarChart3,permission:'REPORTS_VIEW'},
  ]},
  { label:'Seguridad', icon:ShieldCheck, roles:['ADMIN'], children:[
    {label:'Usuarios',path:'/security/users',icon:User,permission:'SECURITY_USERS_READ'},
    {label:'Roles',path:'/security/roles',icon:ShieldCheck,permission:'SECURITY_ROLES_READ'},
    {label:'Permisos',path:'/security/permissions',icon:ShieldCheck,permission:'SECURITY_PERMISSIONS_READ'},
    {label:'Matriz de acceso',path:'/security/access-matrix',icon:ShieldCheck,permission:'SECURITY_MATRIX_READ'},
  ]},
  { label:'Pruebas funcionales',path:'/pruebas-funcionales',icon:ClipboardCheck,roles:['ADMIN','GERENTE','FINANZAS','TESORERIA'] },
  { label:'Mi perfil',path:'/mi-perfil/seguridad',icon:User,roles:ALL_ROLES },
];

export function readUser(){try{return JSON.parse(localStorage.getItem('user')||'{}')}catch{return {}}}
export function allowed(item:{roles?:readonly string[];permission?:string;anyPermissions?:readonly string[]},user=readUser()){return (!item.roles||item.roles.includes(user.role))&&(user.role==='ADMIN'||(!item.permission||(user.permissions||[]).includes(item.permission))&&(!item.anyPermissions||item.anyPermissions.some(p=>(user.permissions||[]).includes(p))));}
export function visibleNavigation(user=readUser()){return navigation.filter(item=>allowed(item,user)).map(item=>'children'in item?{...item,children:item.children.filter(child=>allowed({...child,roles:child.roles||item.roles},user))}:item).filter(item=>!('children'in item)||item.children.length>0);}
const detailRoutes = new Set(['/solicitudes-gastos', '/rendicion-conciliacion/liquidaciones', '/rendicion-conciliacion/ocr/documentos']);
export function routeAccess(path:string,user=readUser()){
  if(path==='/documents'||/^\/documents\/[^/]+$/.test(path)) path=path.replace('/documents','/rendicion-conciliacion/ocr/documentos');
  const matches=(base:string)=>path===base||(detailRoutes.has(base)&&path.startsWith(base+'/')&&!path.slice(base.length+1).includes('/'));
  const candidates:Array<{entry:NavigationItem;roles?:readonly string[]}>=[];
  for(const item of navigation){if('children'in item){for(const child of item.children)if(matches(child.path))candidates.push({entry:child,roles:child.roles||item.roles})}else if(matches(item.path))candidates.push({entry:item,roles:item.roles})}
  const match=candidates.sort((a,b)=>b.entry.path.length-a.entry.path.length)[0];
  return match?allowed({...match.entry,roles:match.roles},user):false;
}

export function breadcrumbLabels(path:string){const labels=['Inicio'];let match:{group?:string;child:NavigationItem}|undefined;for(const item of navigation){if('children'in item){for(const child of item.children)if(path===child.path||path.startsWith(child.path+'/'))if(!match||child.path.length>match.child.path.length)match={group:item.label,child}}else if(item.path!=='/'&&(path===item.path||path.startsWith(item.path+'/'))&&(!match||item.path.length>match.child.path.length))match={child:item}}if(match){if(match.group)labels.push(match.group);labels.push(match.child.label)}return [...new Set(labels)];}
