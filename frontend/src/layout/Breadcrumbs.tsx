import { HStack, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { breadcrumbLabels } from '../navigation/navigation';
export function Breadcrumbs(){const labels=breadcrumbLabels(useLocation().pathname);return <HStack as="nav" aria-label="Breadcrumb" gap="2" mb="4" fontSize="sm">{labels.map((label,index)=><HStack key={`${label}-${index}`} gap="2">{index>0&&<Text color="gray.400">›</Text>}{index===0?<Link asChild><RouterLink to="/">{label}</RouterLink></Link>:<Text color={index===labels.length-1?'gray.800':'gray.500'} aria-current={index===labels.length-1?'page':undefined}>{label}</Text>}</HStack>)}</HStack>}
