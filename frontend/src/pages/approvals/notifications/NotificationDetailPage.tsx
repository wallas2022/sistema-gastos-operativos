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
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  FileCheck,
  GitBranch,
  ShieldCheck,
  User,
  WalletCards,
} from "lucide-react";

const notifications = [
  {
    id: "1",
    title: "Solicitud pendiente de aprobación",
    description:
      "La solicitud SOL-0002 se encuentra pendiente de revisión por Gerencia Financiera.",
    fullDescription:
      "La solicitud de gasto SOL-0002 fue enviada al flujo de aprobación y actualmente se encuentra asignada a Gerencia Financiera. El aprobador debe revisar el monto solicitado, la política aplicada, el presupuesto disponible y la justificación registrada por el solicitante.",
    module: "Trazabilidad de Flujos",
    type: "Autorización",
    status: "Nueva",
    date: "Hoy, 09:35",
    createdBy: "Sistema de autorizaciones",
    assignedTo: "Gerencia Financiera",
    relatedCode: "SOL-0002",
    actionText: "Ir al centro de autorizaciones",
    actionPath: "/trazabilidad-flujos/autorizaciones",
    color: "purple",
    icon: ShieldCheck,
  },
  {
    id: "2",
    title: "Documento OCR confirmado",
    description:
      "El documento DOC-001 fue confirmado y ya puede asociarse a una liquidación.",
    fullDescription:
      "El documento DOC-001 fue procesado por el módulo OCR, sus campos fueron revisados y posteriormente confirmados. Ahora puede ser asociado a una liquidación dentro del módulo de Rendición y Conciliación Financiera.",
    module: "Rendición y Conciliación Financiera",
    type: "OCR",
    status: "Nueva",
    date: "Hoy, 08:50",
    createdBy: "Motor OCR",
    assignedTo: "Usuario responsable de liquidación",
    relatedCode: "DOC-001",
    actionText: "Ver documentos OCR",
    actionPath: "/rendicion-conciliacion/ocr/documentos",
    color: "blue",
    icon: FileCheck,
  },
  {
    id: "3",
    title: "Liquidación pendiente de comprobantes",
    description:
      "La liquidación LIQ-0003 requiere documentos adicionales para continuar con la conciliación.",
    fullDescription:
      "La liquidación LIQ-0003 fue creada, pero aún no cuenta con todos los comprobantes requeridos para completar el proceso de conciliación. El usuario debe adjuntar o asociar documentos confirmados antes de continuar.",
    module: "Rendición y Conciliación Financiera",
    type: "Liquidación",
    status: "Pendiente",
    date: "Ayer, 17:20",
    createdBy: "Sistema de liquidaciones",
    assignedTo: "Solicitante",
    relatedCode: "LIQ-0003",
    actionText: "Ir a liquidaciones",
    actionPath: "/rendicion-conciliacion/liquidaciones",
    color: "yellow",
    icon: WalletCards,
  },
  {
    id: "4",
    title: "Escalamiento por tiempo vencido",
    description:
      "La solicitud SOL-0004 superó el tiempo definido en el SLA y fue marcada para reasignación.",
    fullDescription:
      "La solicitud SOL-0004 permaneció en una etapa de aprobación por más tiempo del permitido según el SLA configurado. El sistema generó una alerta para que el flujo sea revisado o reasignado.",
    module: "Trazabilidad de Flujos",
    type: "SLA",
    status: "Nueva",
    date: "Ayer, 15:10",
    createdBy: "Motor de escalamiento",
    assignedTo: "Administrador del flujo",
    relatedCode: "SOL-0004",
    actionText: "Ver escalamientos",
    actionPath: "/trazabilidad-flujos/escalamientos",
    color: "red",
    icon: GitBranch,
  },
  {
    id: "5",
    title: "Presupuesto validado correctamente",
    description:
      "La solicitud SOL-0001 pasó la verificación presupuestaria del centro de costo.",
    fullDescription:
      "La solicitud SOL-0001 fue validada contra el presupuesto disponible del centro de costo correspondiente. La validación fue exitosa y el trámite puede continuar al flujo de autorización.",
    module: "Planificación y Normativa",
    type: "Presupuesto",
    status: "Leída",
    date: "22/04/2026, 10:15",
    createdBy: "Verificador presupuestario",
    assignedTo: "Flujo de aprobación",
    relatedCode: "SOL-0001",
    actionText: "Ver solicitudes",
    actionPath: "/solicitudes-gastos",
    color: "green",
    icon: CheckCircle2,
  },
];

export function NotificationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const notification = notifications.find((item) => item.id === id);

  if (!notification) {
    return (
      <Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p="6">
        <Heading size="md">Notificación no encontrada</Heading>
        <Text color="gray.500" mt="2">
          No se encontró la notificación seleccionada.
        </Text>

        <Button mt="5" variant="outline" onClick={() => navigate("/notificaciones")}>
          <ArrowLeft size={18} />
          Volver a notificaciones
        </Button>
      </Box>
    );
  }

  const Icon = notification.icon;

  return (
    <VStack align="stretch" gap="6">
      <Flex justify="space-between" align={{ base: "start", md: "center" }} gap="4">
        <Box>
          <HStack mb="2">
            <Badge colorPalette={notification.color}>{notification.type}</Badge>
            <Badge
              colorPalette={notification.status === "Nueva" ? "red" : "gray"}
              variant={notification.status === "Nueva" ? "solid" : "subtle"}
            >
              {notification.status}
            </Badge>
          </HStack>

          <Heading size="lg">{notification.title}</Heading>

          <Text color="gray.500" mt="1">
            Detalle completo del evento generado por el sistema.
          </Text>
        </Box>

        <Button variant="outline" onClick={() => navigate("/notificaciones")}>
          <ArrowLeft size={18} />
          Volver
        </Button>
      </Flex>

      <Grid templateColumns={{ base: "1fr", xl: "1.5fr 0.8fr" }} gap="5">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="6"
        >
          <HStack align="start" gap="4" mb="5">
            <Box
              w="52px"
              h="52px"
              rounded="2xl"
              bg={`${notification.color}.50`}
              color={`${notification.color}.600`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon size={25} />
            </Box>

            <Box>
              <Heading size="md">Descripción del evento</Heading>
              <Text color="gray.600" mt="2" lineHeight="1.8">
                {notification.fullDescription}
              </Text>
            </Box>
          </HStack>

          <Box
            border="1px solid"
            borderColor="gray.100"
            rounded="2xl"
            p="5"
            bg="gray.50"
          >
            <Heading size="sm" mb="4">
              Información relacionada
            </Heading>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
              <InfoItem label="Código relacionado" value={notification.relatedCode} />
              <InfoItem label="Módulo" value={notification.module} />
              <InfoItem label="Tipo de evento" value={notification.type} />
              <InfoItem label="Estado" value={notification.status} />
              <InfoItem label="Generado por" value={notification.createdBy} />
              <InfoItem label="Asignado a" value={notification.assignedTo} />
            </Grid>
          </Box>

          <Button
            mt="5"
            colorPalette="blue"
            onClick={() => navigate(notification.actionPath)}
          >
            {notification.actionText}
          </Button>
        </Box>

        <VStack align="stretch" gap="5">
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Heading size="md" mb="4">
              Trazabilidad
            </Heading>

            <VStack align="stretch" gap="4">
              <TimelineItem
                icon={Bell}
                title="Notificación generada"
                description="El sistema detectó un evento relevante."
                date={notification.date}
              />

              <TimelineItem
                icon={User}
                title="Responsable asignado"
                description={notification.assignedTo}
                date="Actual"
              />

              <TimelineItem
                icon={Clock3}
                title="Pendiente de acción"
                description="El usuario puede revisar el detalle y continuar el flujo."
                date="En curso"
              />
            </VStack>
          </Box>

          <Box
            bg={`${notification.color}.600`}
            color="white"
            rounded="2xl"
            p="5"
          >
            <Heading size="md">Importancia del evento</Heading>
            <Text fontSize="sm" color="whiteAlpha.900" mt="2" lineHeight="1.7">
              Esta notificación permite dar seguimiento a eventos críticos del
              flujo operativo, evitando retrasos en aprobaciones, OCR,
              liquidaciones y control presupuestario.
            </Text>
          </Box>
        </VStack>
      </Grid>
    </VStack>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500" fontWeight="semibold">
        {label}
      </Text>
      <Text fontSize="sm" color="gray.800" fontWeight="medium" mt="1">
        {value}
      </Text>
    </Box>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  description,
  date,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  date: string;
}) {
  return (
    <HStack align="start" gap="3">
      <Box
        w="36px"
        h="36px"
        rounded="xl"
        bg="gray.50"
        color="blue.600"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <Icon size={18} />
      </Box>

      <Box>
        <Text fontWeight="semibold" fontSize="sm">
          {title}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {description}
        </Text>
        <Text fontSize="xs" color="gray.400" mt="1">
          {date}
        </Text>
      </Box>
    </HStack>
  );
}