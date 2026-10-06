import { FormEvent, useState } from 'react';
import { Box, Button, Heading, Input, Link, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { api } from '../../shared/services/api';

export function ResetPasswordPage() {
  const [params]=useSearchParams(),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const submit=async(e:FormEvent)=>{e.preventDefault();setLoading(true);setError('');try{const {data}=await api.post('/auth/reset-password',{token:params.get('token')||'',newPassword:password,confirmation});setMessage(data.message);}catch(err:any){setError(err.response?.data?.message||'El enlace ya no es válido.');}finally{setLoading(false)}};
  return <Box minH="100vh" bg="gray.50" display="grid" placeItems="center" p="6"><Box bg="white" p="8" rounded="2xl" shadow="lg" w="full" maxW="460px"><form onSubmit={submit}><VStack align="stretch" gap="4"><Heading size="lg">Restablecer contraseña</Heading><Text color="gray.600">Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo.</Text><Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nueva contraseña"/><Input type="password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="Confirmar contraseña"/>{error&&<Box bg="red.50" color="red.700" p="3" rounded="lg">{error}</Box>}{message&&<Box bg="green.50" color="green.700" p="3" rounded="lg">{message}</Box>}<Button type="submit" loading={loading} colorPalette="blue">Guardar contraseña</Button><Link asChild textAlign="center"><RouterLink to="/login">Ir al inicio de sesión</RouterLink></Link></VStack></form></Box></Box>;
}
