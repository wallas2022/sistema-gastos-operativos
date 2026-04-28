import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Send,
  ShieldCheck,
  UserCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

const requestDetail = {
  code: "SOL-0001",
  requester: "Walter Rosales",
  role: "Gerente",
  type: "Gasto de viaje / viáticos",
  concept: "Viaje operativo para supervisión regional",
  company: "Servicios Compartidos",
  area: "Administración",
  costCenter: "CC-ADM-001",
  budgetAccount: "6101 - Gastos administrativos",
  estimatedAmount: "Q 2,950.00",
  status: "Pendiente aprobación",
  priority: "Normal",
  createdAt: "28/04/2026",
};

const expenseItems = [
  {
    name: "Alimentación",
    rule: "Q 160.00 por día × 3 días",
    amount: "Q 480.00",
    status: "Dentro de política",
  },
  {
    name: "Alojamiento superior",
    rule: "Q 650.00 por noche × 2 noches",
    amount: "Q 1,300.00",
    status: "Dentro de política",
  },
  {
    name: "Alquiler de vehículo",
    rule: "Q 400.00 por día × 3 días",
    amount: "Q 1,200.00",
    status: "Dentro de política",
  },
];

const timeline = [
  {
    title: "Solicitud creada",
    description: "El usuario registró la solicitud de gasto.",
    date: "28/04/2026 09:10",
    status: "Completado",
    icon: FileText,
  },
  {
    title: "Validación de política",
    description: "El sistema validó reglas por rol, tipo de gasto y monto.",
    date: "28/04/2026 09:11",
    status: "Completado",
    icon: ShieldCheck,
  },
  {
    title: "Validación presupuestaria",
    description: "El centro de costo cuenta con presupuesto disponible.",
    date: "28/04/2026 09:12",
    status: "Completado",
    icon: WalletCards,
  },
  {
    title: "Pendiente de aprobación",
    description: "La solicitud está esperando revisión del aprobador asignado.",
    date: "Pendiente",
    status: "En proceso",
    icon: UserCheck,
  },
];

export function ExpenseRequestDetailPage() {
  const { id } = useParams();

  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <RouterLink to="/solicitudes-gastos">
            <Button size="sm" variant="ghost" mb="3">
              <ArrowLeft size={16} />
              Volver
            </Button>
          </RouterLink>

          <HStack mb="1">
            <Heading size="lg">Detalle de Solicitud</Heading>
            <Badge colorPalette="yellow">{requestDetail.status}</Badge>
          </HStack>

          <Text color="gray.500">
            Expediente {id ?? requestDetail.code} · Seguimiento completo de la
            solicitud antes de ejecución.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline" colorPalette="red">
            <XCircle size={18} />
            Rechazar
          </Button>

          <Button variant="outline" colorPalette="yellow">
            <AlertTriangle size={18} />
            Observar
          </Button>

          <Button colorPalette="green">
            <CheckCircle2 size={18} />
            Aprobar
          </Button>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: "1fr", xl: "1.5fr 1fr" }} gap="5">
        <VStack align="stretch" gap="5">
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Flex align="center" gap="3" mb="5">
              <Box
                w="42px"
                h="42px"
                rounded="xl"
                bg="blue.50"
                color="blue.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <ClipboardList size={21} />
              </Box>

              <Box>
                <Heading size="md">Información general</Heading>
                <Text fontSize="sm" color="gray.500">
                  Datos principales registrados por el solicitante.
                </Text>
              </Box>
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
              <InfoItem label="Código" value={requestDetail.code} />
              <InfoItem label="Fecha" value={requestDetail.createdAt} />
              <InfoItem label="Solicitante" value={requestDetail.requester} />
              <InfoItem label="Rol" value={requestDetail.role} />
              <InfoItem label="Tipo de gasto" value={requestDetail.type} />
              <InfoItem label="Prioridad" value={requestDetail.priority} />
              <InfoItem label="Empresa" value={requestDetail.company} />
              <InfoItem label="Área" value={requestDetail.area} />
              <InfoItem label="Centro de costo" value={requestDetail.costCenter} />
              <InfoItem
                label="Cuenta presupuestaria"
                value={requestDetail.budgetAccount}
              />
            </Grid>

            <Box mt="5">
              <Text fontSize="sm" color="gray.500">
                Concepto
              </Text>
              <Text fontWeight="semibold">{requestDetail.concept}</Text>
            </Box>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Flex justify="space-between" align="center" mb="5">
              <Box>
                <Heading size="md">Conceptos solicitados</Heading>
                <Text fontSize="sm" color="gray.500">
                  Detalle calculado según política del rol y duración del gasto.
                </Text>
              </Box>

              <Badge colorPalette="green">Dentro de política</Badge>
            </Flex>

            <VStack align="stretch" gap="3">
              {expenseItems.map((item) => (
                <Flex
                  key={item.name}
                  justify="space-between"
                  align={{ base: "start", md: "center" }}
                  direction={{ base: "column", md: "row" }}
                  gap="3"
                  border="1px solid"
                  borderColor="gray.100"
                  rounded="xl"
                  p="4"
                >
                  <Box>
                    <Text fontWeight="semibold">{item.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {item.rule}
                    </Text>
                  </Box>

                  <HStack>
                    <Badge colorPalette="green">{item.status}</Badge>
                    <Text fontWeight="bold">{item.amount}</Text>
                  </HStack>
                </Flex>
              ))}
            </VStack>

            <Flex
              justify="space-between"
              align="center"
              bg="blue.600"
              color="white"
              rounded="2xl"
              p="5"
              mt="5"
            >
              <Box>
                <Text fontSize="sm" color="blue.100">
                  Total estimado solicitado
                </Text>
                <Heading size="lg">{requestDetail.estimatedAmount}</Heading>
              </Box>

              <WalletCards size={28} />
            </Flex>
          </Box>
        </VStack>

        <VStack align="stretch" gap="5">
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Heading size="md" mb="1">
              Estado del expediente
            </Heading>
            <Text fontSize="sm" color="gray.500" mb="5">
              Resumen de avance antes de la ejecución del gasto.
            </Text>

            <VStack align="stretch" gap="3">
              <StatusCard
                icon={ShieldCheck}
                title="Política"
                description="Reglas internas cumplidas"
                color="green"
                status="Aprobado"
              />

              <StatusCard
                icon={WalletCards}
                title="Presupuesto"
                description="Disponibilidad validada"
                color="green"
                status="Aprobado"
              />

              <StatusCard
                icon={UserCheck}
                title="Autorización"
                description="Pendiente del aprobador"
                color="yellow"
                status="Pendiente"
              />
            </VStack>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Heading size="md" mb="1">
              Trazabilidad
            </Heading>
            <Text fontSize="sm" color="gray.500" mb="5">
              Historial de eventos de la solicitud.
            </Text>

            <VStack align="stretch" gap="4">
              {timeline.map((item) => (
                <TimelineItem key={item.title} {...item} />
              ))}
            </VStack>
          </Box>

          <Box bg="blue.50" border="1px solid" borderColor="blue.100" rounded="2xl" p="5">
            <HStack align="start" gap="3">
              <Send size={22} color="#2563eb" />
              <Box>
                <Text fontWeight="semibold" color="blue.700">
                  Siguiente etapa
                </Text>
                <Text fontSize="sm" color="blue.700" mt="1">
                  Al aprobar esta solicitud, el gasto quedará listo para
                  ejecución. Después podrá iniciar la carga de comprobantes OCR y
                  la liquidación.
                </Text>
              </Box>
            </HStack>
          </Box>
        </VStack>
      </Grid>
    </VStack>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Text fontWeight="semibold">{value}</Text>
    </Box>
  );
}

function StatusCard({
  icon: Icon,
  title,
  description,
  color,
  status,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  status: string;
}) {
  return (
    <Flex
      justify="space-between"
      align="start"
      border="1px solid"
      borderColor="gray.100"
      rounded="xl"
      p="4"
      gap="3"
    >
      <HStack align="start" gap="3">
        <Box
          w="38px"
          h="38px"
          rounded="xl"
          bg={`${color}.50`}
          color={`${color}.600`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={18} />
        </Box>

        <Box>
          <Text fontWeight="semibold">{title}</Text>
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        </Box>
      </HStack>

      <Badge colorPalette={color}>{status}</Badge>
    </Flex>
  );
}

function TimelineItem({
  title,
  description,
  date,
  status,
  icon: Icon,
}: {
  title: string;
  description: string;
  date: string;
  status: string;
  icon: React.ElementType;
}) {
  const color = status === "Completado" ? "green" : "yellow";

  return (
    <HStack align="start" gap="3">
      <Box
        w="38px"
        h="38px"
        minW="38px"
        rounded="xl"
        bg={`${color}.50`}
        color={`${color}.600`}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={18} />
      </Box>

      <Box flex="1">
        <Flex justify="space-between" gap="3">
          <Box>
            <Text fontWeight="semibold">{title}</Text>
            <Text fontSize="sm" color="gray.500">
              {description}
            </Text>
          </Box>

          <Badge colorPalette={color}>{status}</Badge>
        </Flex>

        <Text fontSize="xs" color="gray.400" mt="1">
          {date}
        </Text>
      </Box>
    </HStack>
  );
}