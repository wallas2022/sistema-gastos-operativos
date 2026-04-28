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
import { Link as RouterLink } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSearch,
  FolderArchive,
  ReceiptText,
  UploadCloud,
  WalletCards,
} from "lucide-react";

const indicators = [
  {
    label: "Comprobantes cargados",
    value: "32",
    description: "Documentos recibidos para revisión",
    icon: UploadCloud,
  },
  {
    label: "OCR pendientes",
    value: "7",
    description: "Pendientes de procesamiento o revisión",
    icon: FileSearch,
  },
  {
    label: "Documentos confirmados",
    value: "18",
    description: "Listos para asociar a liquidaciones",
    icon: CheckCircle2,
  },
  {
    label: "Liquidaciones abiertas",
    value: "9",
    description: "Procesos financieros en curso",
    icon: ReceiptText,
  },
];

const flowSteps = [
  {
    title: "Carga OCR",
    description: "Digitalización de comprobantes y extracción automática.",
    icon: FileSearch,
  },
  {
    title: "Liquidación",
    description: "Asociación de documentos confirmados a un expediente.",
    icon: ReceiptText,
  },
  {
    title: "Conciliación",
    description: "Comparación entre anticipos, gastos y saldos.",
    icon: Calculator,
  },
  {
    title: "Cierre",
    description: "Certificación del expediente financiero digital.",
    icon: FolderArchive,
  },
];

const recentItems = [
  {
    code: "DOC-001",
    title: "Factura proveedor confirmada",
    status: "Confirmado",
    type: "Documento OCR",
  },
  {
    code: "LIQ-004",
    title: "Liquidación de gastos operativos",
    status: "En revisión",
    type: "Liquidación",
  },
  {
    code: "DOC-008",
    title: "Comprobante pendiente de validación",
    status: "Pendiente",
    type: "Documento OCR",
  },
];

export function ReconciliationPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <Heading size="lg">Rendición y Conciliación Financiera</Heading>
          <Text color="gray.500" mt="1">
            Gestión de comprobantes, documentos OCR, liquidaciones, conciliación
            de anticipos y cierre financiero.
          </Text>
        </Box>

        <HStack>
          <Button
            as={RouterLink}
            to="/rendicion-conciliacion/ocr/documentos"
            colorPalette="blue"
          >
            <UploadCloud size={18} />
            Subir comprobante OCR
          </Button>

          <Button
            as={RouterLink}
            to="/rendicion-conciliacion/liquidaciones"
            variant="outline"
          >
            <ReceiptText size={18} />
            Ver liquidaciones
          </Button>
        </HStack>
      </Flex>

      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(4, 1fr)",
        }}
        gap="4"
      >
        {indicators.map((item) => (
          <IndicatorCard key={item.label} {...item} />
        ))}
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap="5">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Flex justify="space-between" align="center" mb="5">
            <Box>
              <Heading size="md">Flujo financiero del módulo</Heading>
              <Text fontSize="sm" color="gray.500">
                Ruta esperada desde el documento OCR hasta el cierre certificado.
              </Text>
            </Box>

            <Badge colorPalette="blue">Proceso principal</Badge>
          </Flex>

          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(4, 1fr)",
            }}
            gap="4"
          >
            {flowSteps.map((step, index) => (
              <FlowStep
                key={step.title}
                title={step.title}
                description={step.description}
                icon={step.icon}
                showArrow={index < flowSteps.length - 1}
              />
            ))}
          </Grid>
        </Box>

        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Heading size="md" mb="4">
            Accesos rápidos
          </Heading>

          <VStack align="stretch" gap="3">
            <QuickAction
              to="/rendicion-conciliacion/ocr/documentos"
              icon={FileSearch}
              title="Documentos OCR"
              description="Ver carga, procesamiento y confirmación."
            />

            <QuickAction
              to="/rendicion-conciliacion/liquidaciones"
              icon={ReceiptText}
              title="Liquidaciones"
              description="Crear y revisar expedientes financieros."
            />

            <QuickAction
              to="/rendicion-conciliacion/conciliacion"
              icon={WalletCards}
              title="Conciliación de anticipos"
              description="Validar saldos, reintegros y diferencias."
            />

            <QuickAction
              to="/rendicion-conciliacion/certificacion"
              icon={BadgeCheck}
              title="Certificación de cierre"
              description="Generar expediente digital final."
            />
          </VStack>
        </Box>
      </Grid>

      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="2xl"
        p="5"
      >
        <Flex justify="space-between" align="center" mb="4">
          <Box>
            <Heading size="md">Actividad reciente</Heading>
            <Text fontSize="sm" color="gray.500">
              Últimos movimientos de documentos OCR y liquidaciones.
            </Text>
          </Box>

          <Button size="sm" variant="outline">
            Ver todo
          </Button>
        </Flex>

        <VStack align="stretch" gap="3">
          {recentItems.map((item) => (
            <Flex
              key={item.code}
              justify="space-between"
              align="center"
              border="1px solid"
              borderColor="gray.100"
              rounded="xl"
              px="4"
              py="3"
            >
              <HStack gap="3">
                <Box
                  w="38px"
                  h="38px"
                  rounded="xl"
                  bg="blue.50"
                  color="blue.600"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FileCheck size={18} />
                </Box>

                <Box>
                  <Text fontWeight="semibold">{item.title}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {item.code} · {item.type}
                  </Text>
                </Box>
              </HStack>

              <Badge
                colorPalette={
                  item.status === "Confirmado"
                    ? "green"
                    : item.status === "Pendiente"
                    ? "yellow"
                    : "blue"
                }
              >
                {item.status}
              </Badge>
            </Flex>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}

function IndicatorCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="2xl"
      p="5"
    >
      <Flex justify="space-between" align="start">
        <Box>
          <Text fontSize="sm" color="gray.500">
            {label}
          </Text>
          <Heading size="xl" mt="2">
            {value}
          </Heading>
          <Text fontSize="sm" color="gray.500" mt="2">
            {description}
          </Text>
        </Box>

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
          <Icon size={21} />
        </Box>
      </Flex>
    </Box>
  );
}

function FlowStep({
  title,
  description,
  icon: Icon,
  showArrow,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  showArrow: boolean;
}) {
  return (
    <Box position="relative">
      <Box
        border="1px solid"
        borderColor="gray.200"
        rounded="2xl"
        p="4"
        h="100%"
      >
        <Box
          w="44px"
          h="44px"
          rounded="xl"
          bg="blue.50"
          color="blue.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb="4"
        >
          <Icon size={22} />
        </Box>

        <Text fontWeight="semibold">{title}</Text>
        <Text fontSize="sm" color="gray.500" mt="2">
          {description}
        </Text>
      </Box>

      {showArrow && (
        <Box
          display={{ base: "none", md: "block" }}
          position="absolute"
          right="-22px"
          top="50%"
          transform="translateY(-50%)"
          color="gray.400"
          zIndex="1"
        >
          <ArrowRight size={22} />
        </Box>
      )}
    </Box>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Button
      as={RouterLink}
      to={to}
      variant="ghost"
      justifyContent="flex-start"
      h="auto"
      py="3"
      px="3"
    >
      <HStack align="start" gap="3">
        <Box color="blue.600" mt="1">
          <Icon size={19} />
        </Box>

        <Box textAlign="left">
          <Text fontWeight="semibold">{title}</Text>
          <Text fontSize="xs" color="gray.500">
            {description}
          </Text>
        </Box>
      </HStack>
    </Button>
  );
}