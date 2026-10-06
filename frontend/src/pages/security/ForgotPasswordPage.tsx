import { FormEvent, useState } from 'react';
import { Box, Button, Heading, Input, Link, Text, VStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../../shared/services/api';

export function ForgotPasswordPage() {
  const [email,setEmail]=useState(''),[loading,setLoading]=useState(false),[message,setMessage]=useState('');
  const submit=async(e:FormEvent)=>{e.preventDefault();setLoading(true);try{const {data}=await api.post('/auth/forgot-password',{email});setMessage(data.message);}catch{setMessage('Si la cuenta existe, se ha enviado un enlace para restablecer la contraseña.');}finally{setLoading(false)}};
  return <Box minH="100vh" bg="gray.50" display="grid" placeItems="center" p="6"><Box bg="white" p="8" rounded="2xl" shadow="lg" w="full" maxW="460px"><form onSubmit={submit}><VStack align="stretch" gap="5"><Heading size="lg">Recuperar contraseña</Heading><Text color="gray.600">Ingresa tu correo. Por seguridad, la respuesta será siempre la misma.</Text><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@empresa.com"/>{message&&<Box bg="blue.50" p="3" rounded="lg">{message}</Box>}<Button type="submit" loading={loading} colorPalette="blue">Enviar enlace</Button><Link asChild textAlign="center"><RouterLink to="/login">Volver al inicio de sesión</RouterLink></Link></VStack></form></Box></Box>;
}
