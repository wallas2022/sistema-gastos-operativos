import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  FileCheck,
  ReceiptText,
  Save,
  User,
  WalletCards,
} from "lucide-react";

const confirmedDocuments = [
  {
    code: "DOC-001",
    provider: "Proveedor Demo S.A.",
    documentType: "Factura",
    date: "2026-04-24",
    amount: 1250,
    status: "Confirmado",
  },
  {
    code: "DOC-004",
    provider: "Servicios Técnicos GT",
    documentType: "Factura",
    date: "2026-04-25",
    amount: 2000,
    status: "Confirmado",
  },
  {
    code: "DOC-009",
    provider: "Suministros Corporativos",
    documentType: "Recibo",
    date: "2026-04-26",
    amount: 875,
    status: "Confirmado",
  },
];

const totalDocuments = confirmedDocuments.reduce(
  (total, doc) => total + doc.amount,
  0
);

const advanceAmount = 5000;
const balance = advanceAmount - totalDocuments;

export function NewLiquidationPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <HStack mb="2">
            <RouterLink to="/rendicion-conciliacion/liquidaciones">
              <Button size="sm" variant="ghost">
                <ArrowLeft size={16} />
                Volver
              </Button>
            </RouterLink>
          </HStack>

          <Heading size="lg">Nueva Liquidación</Heading>
          <Text color="gray.500" mt="1">
            Registro de expediente financiero a partir de documentos OCR
            confirmados.
          </Text>
        </Box>

        <HStack>
          <RouterLink to="/rendicion-conciliacion/ocr/documentos">
            <Button variant="outline">
              <FileCheck size={18} />
              Ver documentos OCR
            </Button>
          </RouterLink>

          <Button colorPalette="blue">
            <Save size={18} />
            Guardar liquidación
          </Button>
        </HStack>
      </Flex>

      <Grid templateColumns={{ base: "1fr", xl: "1.4fr 1fr" }} gap="5">
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
                <Heading size="md">Datos generales</Heading>
                <Text fontSize="sm" color="gray.500">
                  Información base del expediente de liquidación.
                </Text>
              </Box>
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
              <Field label="Código de liquidación">
                <Input value="LIQ-0004" readOnly />
              </Field>

              <Field label="Fecha de creación">
                <Input type="date" defaultValue="2026-04-28" />
              </Field>

              <Field label="Tipo de gasto">
                <Input placeholder="Ej. Gasto operativo / proveedor / compra" />
              </Field>

              <Field label="Centro de costo">
                <Input placeholder="Ej. Administración / Operaciones" />
              </Field>

              <Field label="Empresa">
                <Input placeholder="Ej. Servicios Compartidos" />
              </Field>

              <Field label="Unidad de negocio">
                <Input placeholder="Ej. Guatemala / Regional" />
              </Field>
            </Grid>

            <Box mt="4">
              <Field label="Descripción del gasto">
                <Textarea
                  rows={4}
                  placeholder="Describe el motivo de la liquidación y el gasto ejecutado."
                />
              </Field>
            </Box>
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
                bg="green.50"
                color="green.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FileCheck size={21} />
              </Box>

              <Box>
                <Heading size="md">Documentos OCR confirmados</Heading>
                <Text fontSize="sm" color="gray.500">
                  Selecciona los documentos que formarán parte de esta
                  liquidación.
                </Text>
              </Box>
            </Flex>

            <VStack align="stretch" gap="3">
              {confirmedDocuments.map((doc) => (
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
                      as="input"
                      type="checkbox"
                      defaultChecked
                      accentColor="#2563eb"
                      mt="1"
                    />

                    <Box>
                      <Text fontWeight="semibold">
                        {doc.code} · {doc.provider}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {doc.documentType} · {doc.date}
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
                  Persona asociada al expediente.
                </Text>
              </Box>
            </Flex>

            <VStack align="stretch" gap="4">
              <Field label="Solicitante">
                <Input defaultValue="Walter Rosales" />
              </Field>

              <Field label="Correo electrónico">
                <Input defaultValue="admin@sistema.com" />
              </Field>

              <Field label="Puesto / Rol">
                <Input placeholder="Ej. Administrador / Analista / Coordinador" />
              </Field>
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
                <Heading size="md">Resumen financiero</Heading>
                <Text fontSize="sm" color="gray.500">
                  Balance preliminar de la liquidación.
                </Text>
              </Box>
            </Flex>

            <VStack align="stretch" gap="3">
              <SummaryRow label="Anticipo asignado" value={advanceAmount} />
              <SummaryRow label="Total documentos OCR" value={totalDocuments} />
              <SummaryRow label="Diferencia" value={balance} strong />

              <Box
                mt="3"
                bg={balance >= 0 ? "green.50" : "red.50"}
                color={balance >= 0 ? "green.700" : "red.700"}
                rounded="xl"
                p="4"
              >
                <HStack>
                  <WalletCards size={20} />
                  <Box>
                    <Text fontWeight="semibold">
                      {balance >= 0 ? "Saldo a favor" : "Reintegro requerido"}
                    </Text>
                    <Text fontSize="sm">
                      {balance >= 0
                        ? "El anticipo cubre los gastos asociados."
                        : "Los gastos superan el anticipo registrado."}
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </VStack>
          </Box>

          <Box
            bg="blue.600"
            color="white"
            rounded="2xl"
            p="5"
          >
            <HStack align="start" gap="3">
              <CheckCircle2 size={24} />
              <Box>
                <Heading size="sm">Siguiente paso</Heading>
                <Text fontSize="sm" mt="2" color="blue.50">
                  Al guardar la liquidación, los documentos OCR confirmados
                  quedarán vinculados al expediente financiero para iniciar la
                  conciliación.
                </Text>
              </Box>
            </HStack>
          </Box>
        </VStack>
      </Grid>
    </VStack>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb="2">
        {label}
      </Text>
      {children}
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