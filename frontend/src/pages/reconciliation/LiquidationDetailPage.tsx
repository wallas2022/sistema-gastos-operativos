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
  ArrowLeft,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Download,
  FileCheck,
  FolderArchive,
  ReceiptText,
  Send,
  User,
  WalletCards,
} from "lucide-react";

const liquidation = {
  code: "LIQ-0004",
  requester: "Walter Rosales",
  email: "admin@sistema.com",
  area: "Administración",
  costCenter: "CC-ADM-001",
  company: "Servicios Compartidos",
  type: "Gasto operativo",
  status: "Lista para conciliación",
  createdAt: "2026-04-28",
  description:
    "Liquidación de gastos operativos asociados a comprobantes procesados mediante OCR.",
  advanceAmount: 5000,
};

const documents = [
  {
    code: "DOC-001",
    provider: "Proveedor Demo S.A.",
    type: "Factura",
    date: "2026-04-24",
    amount: 1250,
    status: "Confirmado",
  },
  {
    code: "DOC-004",
    provider: "Servicios Técnicos GT",
    type: "Factura",
    date: "2026-04-25",
    amount: 2000,
    status: "Confirmado",
  },
  {
    code: "DOC-009",
    provider: "Suministros Corporativos",
    type: "Recibo",
    date: "2026-04-26",
    amount: 875,
    status: "Confirmado",
  },
];

const totalDocuments = documents.reduce((sum, item) => sum + item.amount, 0);
const balance = liquidation.advanceAmount - totalDocuments;

export function LiquidationDetailPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <RouterLink to="/rendicion-conciliacion/liquidaciones">
            <Button size="sm" variant="ghost" mb="3">
              <ArrowLeft size={16} />
              Volver a liquidaciones
            </Button>
          </RouterLink>

          <HStack>
            <Heading size="lg">{liquidation.code}</Heading>
            <Badge colorPalette="green">{liquidation.status}</Badge>
          </HStack>

          <Text color="gray.500" mt="1">
            Expediente financiero asociado a documentos OCR confirmados.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline">
            <Download size={18} />
            Descargar expediente
          </Button>

          <Button colorPalette="blue">
            <Send size={18} />
            Enviar a conciliación
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
                <ReceiptText size={21} />
              </Box>

              <Box>
                <Heading size="md">Información general</Heading>
                <Text fontSize="sm" color="gray.500">
                  Datos principales del expediente de liquidación.
                </Text>
              </Box>
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
              <InfoItem label="Código" value={liquidation.code} />
              <InfoItem label="Fecha de creación" value={liquidation.createdAt} />
              <InfoItem label="Tipo de gasto" value={liquidation.type} />
              <InfoItem label="Empresa" value={liquidation.company} />
              <InfoItem label="Área" value={liquidation.area} />
              <InfoItem label="Centro de costo" value={liquidation.costCenter} />
            </Grid>

            <Box mt="5">
              <Text fontSize="sm" color="gray.500">
                Descripción
              </Text>
              <Text fontWeight="medium" mt="1">
                {liquidation.description}
              </Text>
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
                <Heading size="md">Documentos OCR asociados</Heading>
                <Text fontSize="sm" color="gray.500">
                  Comprobantes confirmados que forman parte de esta liquidación.
                </Text>
              </Box>

              <Badge colorPalette="blue">{documents.length} documentos</Badge>
            </Flex>

            <VStack align="stretch" gap="3">
              {documents.map((doc) => (
                <Flex
                  key={doc.code}
                  justify="space-between"
                  align={{ base: "start", md: "center" }}
                  direction={{ base: "column", md: "row" }}
                  gap="3"
                  border="1px solid"
                  borderColor="gray.100"
                  rounded="xl"
                  p="4"
                >
                  <HStack align="start" gap="3">
                    <Box
                      w="42px"
                      h="42px"
                      rounded="xl"
                      bg="green.50"
                      color="green.600"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <FileCheck size={19} />
                    </Box>

                    <Box>
                      <Text fontWeight="semibold">
                        {doc.code} · {doc.provider}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {doc.type} · {doc.date}
                      </Text>
                    </Box>
                  </HStack>

                  <HStack>
                    <Text fontWeight="bold">
                      Q {doc.amount.toLocaleString("es-GT")}.00
                    </Text>
                    <Badge colorPalette="green">{doc.status}</Badge>
                  </HStack>
                </Flex>
              ))}
            </VStack>
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
            <Flex align="center" gap="3" mb="5">
              <Box
                w="42px"
                h="42px"
                rounded="xl"
                bg="purple.50"
                color="purple.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <User size={21} />
              </Box>

              <Box>
                <Heading size="md">Responsable</Heading>
                <Text fontSize="sm" color="gray.500">
                  Usuario propietario del expediente.
                </Text>
              </Box>
            </Flex>

            <VStack align="stretch" gap="3">
              <InfoItem label="Solicitante" value={liquidation.requester} />
              <InfoItem label="Correo" value={liquidation.email} />
              <InfoItem label="Área" value={liquidation.area} />
            </VStack>
          </Box>

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
                <Calculator size={21} />
              </Box>

              <Box>
                <Heading size="md">Conciliación preliminar</Heading>
                <Text fontSize="sm" color="gray.500">
                  Balance financiero calculado con documentos OCR.
                </Text>
              </Box>
            </Flex>

            <VStack align="stretch" gap="3">
              <SummaryRow label="Anticipo asignado" value={liquidation.advanceAmount} />
              <SummaryRow label="Total comprobantes" value={totalDocuments} />
              <SummaryRow label="Diferencia" value={balance} strong />

              <Box
                mt="3"
                bg={balance >= 0 ? "green.50" : "red.50"}
                color={balance >= 0 ? "green.700" : "red.700"}
                rounded="xl"
                p="4"
              >
                <HStack align="start">
                  <WalletCards size={21} />
                  <Box>
                    <Text fontWeight="semibold">
                      {balance >= 0 ? "Saldo a favor" : "Reintegro requerido"}
                    </Text>
                    <Text fontSize="sm">
                      {balance >= 0
                        ? "El anticipo cubre los documentos asociados."
                        : "El gasto ejecutado supera el anticipo disponible."}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </VStack>
          </Box>

          <Box bg="blue.600" color="white" rounded="2xl" p="5">
            <HStack align="start" gap="3">
              <BadgeCheck size={24} />
              <Box>
                <Heading size="sm">Estado del expediente</Heading>
                <Text fontSize="sm" mt="2" color="blue.50">
                  La liquidación está lista para pasar a conciliación financiera.
                  En esta etapa se validará el saldo final y se preparará el cierre.
                </Text>
              </Box>
            </HStack>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Heading size="md" mb="4">
              Próximas etapas
            </Heading>

            <VStack align="stretch" gap="3">
              <StageItem icon={CheckCircle2} title="Documentos confirmados" done />
              <StageItem icon={Calculator} title="Conciliación financiera" />
              <StageItem icon={FolderArchive} title="Certificación de cierre" />
            </VStack>
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

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      borderBottom="1px solid"
      borderColor="gray.100"
      py="2"
    >
      <Text
        fontSize="sm"
        color={strong ? "gray.900" : "gray.500"}
        fontWeight={strong ? "bold" : "normal"}
      >
        {label}
      </Text>

      <Text fontWeight={strong ? "bold" : "semibold"}>
        Q {value.toLocaleString("es-GT")}.00
      </Text>
    </Flex>
  );
}

function StageItem({
  icon: Icon,
  title,
  done = false,
}: {
  icon: React.ElementType;
  title: string;
  done?: boolean;
}) {
  return (
    <HStack
      border="1px solid"
      borderColor={done ? "green.200" : "gray.100"}
      bg={done ? "green.50" : "white"}
      rounded="xl"
      p="3"
    >
      <Box color={done ? "green.600" : "gray.500"}>
        <Icon size={18} />
      </Box>
      <Text fontSize="sm" fontWeight="medium">
        {title}
      </Text>
    </HStack>
  );
}