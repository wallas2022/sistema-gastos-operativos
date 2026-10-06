import { Box, Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import { ShieldX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export function ForbiddenPage(){const navigate=useNavigate();return <Flex minH="70vh" align="center" justify="center" p="6"><Box bg="white" borderWidth="1px" rounded="3xl" p={{base:'8',md:'12'}} textAlign="center" maxW="650px" shadow="lg"><VStack gap="5"><Box color="red.500"><ShieldX size={64}/></Box><Text color="red.600" fontWeight="bold">ERROR 403</Text><Heading>Acceso denegado</Heading><Text color="gray.600">No tienes permisos para acceder a esta sección.</Text><Button colorPalette="blue" onClick={()=>navigate('/',{replace:true})}>Volver al inicio</Button></VStack></Box></Flex>}
