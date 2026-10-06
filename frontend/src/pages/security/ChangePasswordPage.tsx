import { FormEvent, useState } from 'react';
import { Box, Button, Heading, Input, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/services/api';

export function ChangePasswordPage() {
  const navigate=useNavigate(),[currentPassword,setCurrent]=useState(''),[newPassword,setNext]=useState(''),[confirmation,setConfirmation]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const submit=async(e:FormEvent)=>{e.preventDefault();setLoading(true);setError('');try{await api.post('/auth/change-password',{currentPassword,newPassword,confirmation});localStorage.removeItem('access_token');localStorage.removeItem('user');navigate('/login',{replace:true});}catch(err:any){setError(err.response?.data?.message||'No fue posible cambiar la contraseña.');}finally{setLoading(false)}};
  return <Box p="6" maxW="620px"><Box bg="white" p="7" rounded="2xl" shadow="sm"><form onSubmit={submit}><VStack align="stretch" gap="4"><Heading size="lg">Mi perfil · Seguridad</Heading><Text color="gray.600">Al cambiarla, se cerrarán las sesiones anteriores.</Text><Input type="password" required value={currentPassword} onChange={e=>setCurrent(e.target.value)} placeholder="Contraseña actual"/><Input type="password" required value={newPassword} onChange={e=>setNext(e.target.value)} placeholder="Nueva contraseña"/><Input type="password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="Confirmar nueva contraseña"/>{error&&<Box bg="red.50" color="red.700" p="3" rounded="lg">{error}</Box>}<Button type="submit" loading={loading} colorPalette="blue">Cambiar contraseña</Button></VStack></form></Box></Box>;
}
