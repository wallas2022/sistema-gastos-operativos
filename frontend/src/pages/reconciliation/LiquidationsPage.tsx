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
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FileSearch,
  FolderArchive,
  Plus,
  ReceiptText,
  WalletCards,
} from "lucide-react";

const liquidationStats = [
  {
    label: "Liquidaciones abiertas",
    value: "9",
    description: "Expedientes en proceso",
    color: "blue",
    icon: ReceiptText,
  },
  {
    label: "Pendientes de documentos",
    value: "4",
    description: "Requieren comprobantes OCR",
    color: "yellow",
    icon: FileSearch,
  },
  {
    label: "Listas para conciliación",
    value: "6",
    description: "Documentos validados",
    color: "green",
    icon: CheckCircle2,
  },
  {
    label: "Cierres certificados",
    value: "3",
    description: "Expedientes finalizados",
    color: "purple",
    icon: FolderArchive,
  },
];

const liquidationRows = [
  {
    code: "LIQ-0001",
    requester: "Walter Rosales",
    concept: "Gastos operativos administrativos",
    amount: "Q 3,250.00",
    documents: "4 comprobantes",
    status: "En revisión",
  },
  {
    code: "LIQ-0002",
    requester: "María López",
    concept: "Pago a proveedor local",
    amount: "Q 8,740.00",
    documents: "2 comprobantes",
    status: "Lista para conciliación",
  },
  {
    code: "LIQ-0003",
    requester: "Carlos Méndez",
    concept: "Compra de insumos operativos",
    amount: "Q 1,980.00",
    documents: "Pendiente OCR",
    status: "Pendiente",
  },
];

const ocrDocuments = [
  {
    code: "DOC-001",
    provider: "Proveedor Demo S.A.",
    amount: "Q 1,250.00",
    status: "Confirmado",
  },
  {
    code: "DOC-004",
    provider: "Servicios Técnicos GT",
    amount: "Q 2,000.00",
    status: "Confirmado",
  },
  {
    code: "DOC-008",
    provider: "Factura pendiente",
    amount: "Q 980.00",
    status: "Pendiente revisión",
  },
];

export function LiquidationsPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <Heading size="lg">Liquidaciones</Heading>
          <Text color="gray.500" mt="1">
            Gestión de expedientes financieros asociados a documentos OCR
            confirmados, anticipos, gastos ejecutados y cierres.
          </Text>
        </Box>

        <HStack>
          <RouterLink to="/rendicion-conciliacion/ocr/documentos">
            <Button variant="outline">
              <FileSearch size={18} />
              Ver documentos OCR
            </Button>
          </RouterLink>

          <RouterLink to="/rendicion-conciliacion/liquidaciones/nueva">
            <Button colorPalette="blue">
              <Plus size={18} />
              Nueva liquidación
            </Button>
          </RouterLink>
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
        {liquidationStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1.6fr 1fr" }} gap="5">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Flex justify="space-between" align="center" mb="5">
            <Box>
              <Heading size="md">Liquidaciones recientes</Heading>
              <Text fontSize="sm" color="gray.500">
                Expedientes creados a partir de gastos ejecutados y documentos
                confirmados.
              </Text>
            </Box>

            <Badge colorPalette="blue">MRCF</Badge>
          </Flex>

          <VStack align="stretch" gap="3">
            {liquidationRows.map((item) => (
              <LiquidationRow key={item.code} {...item} />
            ))}
          </VStack>
        </Box>

        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Heading size="md">Documentos OCR disponibles</Heading>
          <Text fontSize="sm" color="gray.500" mt="1" mb="5">
            Estos documentos podrán asociarse a una liquidación.
          </Text>

          <VStack align="stretch" gap="3">
            {ocrDocuments.map((doc) => (
              <Box
                key={doc.code}
                border="1px solid"
                borderColor="gray.100"
                rounded="xl"
                p="4"
              >
                <Flex justify="space-between" align="start">
                  <HStack align="start" gap="3">
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
                      <Text fontWeight="semibold">{doc.code}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {doc.provider}
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" mt="1">
                        {doc.amount}
                      </Text>
                    </Box>
                  </HStack>

                  <Badge
                    colorPalette={
                      doc.status === "Confirmado" ? "green" : "yellow"
                    }
                  >
                    {doc.status}
                  </Badge>
                </Flex>

                <Button size="sm" variant="outline" mt="4" w="100%">
                  Asociar a liquidación
                </Button>
              </Box>
            ))}
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
        <Heading size="md" mb="2">
          Flujo de una liquidación
        </Heading>

        <Text fontSize="sm" color="gray.500" mb="5">
          Este flujo representa cómo debe avanzar una liquidación dentro del
          sistema.
        </Text>

        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(4, 1fr)",
          }}
          gap="4"
        >
          <ProcessStep
            title="Crear liquidación"
            description="Se registra el expediente del gasto ejecutado."
            icon={ClipboardList}
            showArrow
          />

          <ProcessStep
            title="Asociar OCR"
            description="Se vinculan facturas y comprobantes confirmados."
            icon={FileCheck}
            showArrow
          />

          <ProcessStep
            title="Conciliar saldo"
            description="Se calcula diferencia, reintegro o saldo a favor."
            icon={WalletCards}
            showArrow
          />

          <ProcessStep
            title="Certificar cierre"
            description="Se genera el expediente final para auditoría."
            icon={FolderArchive}
            showArrow={false}
          />
        </Grid>
      </Box>
    </VStack>
  );
}

function StatCard({
  label,
  value,
  description,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  color: string;
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
          bg={`${color}.50`}
          color={`${color}.600`}
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

function LiquidationRow({
  code,
  requester,
  concept,
  amount,
  documents,
  status,
}: {
  code: string;
  requester: string;
  concept: string;
  amount: string;
  documents: string;
  status: string;
}) {
  return (
    <RouterLink
      to={`/rendicion-conciliacion/liquidaciones/${code}`}
      style={{ textDecoration: "none" }}
    >
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="3"
        border="1px solid"
        borderColor="gray.100"
        rounded="xl"
        p="4"
        cursor="pointer"
        transition="all 0.2s ease"
        _hover={{
          bg: "gray.50",
          borderColor: "blue.200",
          transform: "translateY(-1px)",
        }}
      >
        <HStack align="start" gap="3">
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
            <ReceiptText size={19} />
          </Box>

          <Box>
            <HStack gap="2" mb="1">
              <Text fontWeight="semibold">{code}</Text>
              <Badge
                colorPalette={
                  status === "Lista para conciliación"
                    ? "green"
                    : status === "Pendiente"
                    ? "yellow"
                    : "blue"
                }
              >
                {status}
              </Badge>
            </HStack>

            <Text fontSize="sm" color="gray.600">
              {concept}
            </Text>

            <Text fontSize="xs" color="gray.500" mt="1">
              Solicitante: {requester} · {documents}
            </Text>
          </Box>
        </HStack>

        <HStack>
          <Text fontWeight="bold">{amount}</Text>
          <ArrowRight size={18} color="#718096" />
        </HStack>
      </Flex>
    </RouterLink>
  );
}

function ProcessStep({
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