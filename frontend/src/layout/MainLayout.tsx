import { Box, Flex, IconButton } from '@chakra-ui/react';
import { Menu } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { routeAccess, readUser } from '../navigation/navigation';
import { ForbiddenPage } from '../pages/error/ForbiddenPage';
import { api } from '../shared/services/api';
import { APPROVAL_PENDING_CHANGED } from '../services/approvalFlows.service';

export function MainLayout(){
 const location=useLocation(),[collapsed,setCollapsed]=useState(()=>localStorage.getItem('sidebarExpanded')==='false'),[mobileOpen,setMobileOpen]=useState(false),[counters,setCounters]=useState<Record<string,number>>({});
 const user=readUser(),authorized=routeAccess(location.pathname,user),width=collapsed?'76px':'280px';
 const toggle=()=>setCollapsed(v=>{localStorage.setItem('sidebarExpanded',String(v));return !v});
 useEffect(()=>{if(authorized)localStorage.setItem('lastAuthorizedRoute',location.pathname)},[location.pathname,authorized]);
 useEffect(()=>{let active=true;const load=async()=>{const jobs:Array<Promise<void>>=[];if(['ADMIN','GERENTE','FINANZAS'].includes(user.role))jobs.push(api.get('/approval-flows/pending/me').then(r=>{counters.approvals=r.data.length}));if(['ADMIN','REVISOR_OCR'].includes(user.role))jobs.push(api.get('/ocr/analytics/metrics').then(r=>{counters.ocr=Number(r.data.pendingReview||r.data.pending||0)}));if(['ADMIN','GERENTE','FINANZAS','TESORERIA','SOLICITANTE'].includes(user.role))jobs.push(api.get('/settlements/indicators').then(r=>{counters.settlements=Number(r.data.pending||0)}));if(['ADMIN','FINANZAS','TESORERIA'].includes(user.role)){jobs.push(api.get('/settlements/refunds/pending-treasury').then(r=>{counters.refunds=r.data.length}));jobs.push(api.get('/expense-request-payments/pending').then(r=>{counters.disbursements=r.data.length}))}await Promise.allSettled(jobs);if(active)setCounters({...counters})};void load();const timer=window.setInterval(load,60000);return()=>{active=false;clearInterval(timer)}},[user.role]);
 useEffect(()=>{const update=(event:Event)=>{const count=(event as CustomEvent<number>).detail;setCounters(current=>({...current,approvals:count}))};window.addEventListener(APPROVAL_PENDING_CHANGED,update);return()=>window.removeEventListener(APPROVAL_PENDING_CHANGED,update)},[]);
 return <Flex minH="100vh" bg="gray.50"><Sidebar collapsed={collapsed} onToggle={toggle} mobileOpen={mobileOpen} onMobileClose={()=>setMobileOpen(false)} counters={counters}/><Box flex="1" minW="0" ml={{base:0,lg:width}} transition="margin-left .2s"><Header/><IconButton display={{base:'inline-flex',lg:'none'}} position="fixed" left="3" top="3" zIndex="25" aria-label="Abrir menú" onClick={()=>setMobileOpen(true)}><Menu/></IconButton><Box as="main" px={{base:'4',md:'6',xl:'8'}} py={{base:'4',md:'6'}} maxW="100%" overflowX="hidden"><Breadcrumbs/>{authorized?<Outlet/>:<ForbiddenPage/>}</Box></Box></Flex>;
}
