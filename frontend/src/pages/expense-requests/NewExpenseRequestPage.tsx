import {
  Badge,
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  NumberInput,
  Select,
  Text,
  Textarea,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plane,
  Plus,
  Save,
  Send,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

const expenseTypes = createListCollection({
  items: [
    { label: "Gasto de viaje", value: "travel" },
    { label: "Pago a proveedor", value: "provider" },
    { label: "Gasto administrativo", value: "admin" },
    { label: "Gasto extraordinario", value: "extraordinary" },
  ],
});

const requesterRoles = createListCollection({
  items: [
    { label: "Operador", value: "operador" },
    { label: "Jefe", value: "jefe" },
    { label: "Gerente", value: "gerente" },
    { label: "Directivo", value: "directivo" },
  ],
});

const destinations = createListCollection({
  items: [
    { label: "Ciudad de Guatemala", value: "guatemala" },
    { label: "Interior del país", value: "interior" },
    { label: "Internacional", value: "internacional" },
  ],
});

const travelItems = [
  {
    key: "lodging",
    label: "Alojamiento",
    description: "Hotel u hospedaje autorizado según destino y rol.",
    base: 450,
  },
  {
    key: "food",
    label: "Alimentación",
    description: "Monto diario para comidas según política interna.",
    base: 175,
  },
  {
    key: "vehicle",
    label: "Alquiler de vehículo",
    description: "Disponible según justificación y nivel de autorización.",
    base: 350,
  },
  {
    key: "transport",
    label: "Transporte local",
    description: "Taxi, parqueo, transporte público o movilidad local.",
    base: 125,
  },
  {
    key: "fuel",
    label: "Combustible",
    description: "Aplica cuando se autoriza uso de vehículo.",
    base: 200,
  },
];

const roleMultiplier: Record<string, number> = {
  operador: 1,
  jefe: 1.15,
  gerente: 1.35,
  directivo: 1.6,
};

export function NewExpenseRequestPage() {
  const [expenseType, setExpenseType] = useState<string[]>(["travel"]);
  const [role, setRole] = useState<string[]>(["operador"]);
  const [destination, setDestination] = useState<string[]>(["guatemala"]);
  const [days, setDays] = useState("1");
  const [selectedItems, setSelectedItems] = useState<string[]>([
    "lodging",
    "food",
  ]);

  const currentExpenseType = expenseType[0] ?? "travel";
  const currentRole = role[0] ?? "operador";
  const currentDestination = destination[0] ?? "guatemala";

  const estimatedAmount = useMemo(() => {
    const numberOfDays = Number(days) || 1;
    const multiplier = roleMultiplier[currentRole] ?? 1;

    if (currentExpenseType !== "travel") {
      return 0;
    }

    return travelItems
      .filter((item) => selectedItems.includes(item.key))
      .reduce((sum, item) => sum + item.base * numberOfDays * multiplier, 0);
  }, [currentExpenseType, currentRole, days, selectedItems]);

  const toggleItem = (itemKey: string) => {
    setSelectedItems((previous) =>
      previous.includes(itemKey)
        ? previous.filter((key) => key !== itemKey)
        : [...previous, itemKey]
    );
  };

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
            <Badge colorPalette="blue" variant="subtle">
              MPN
            </Badge>
            <Badge colorPalette="green" variant="subtle">
              Nueva solicitud
            </Badge>
          </HStack>

          <Heading size="lg">Nueva solicitud de gasto</Heading>

          <Text color="gray.500" mt="1">
            Registro inicial de gasto con validación de política, cálculo
            estimado y verificación presupuestaria previa.
          </Text>
        </Box>

        <RouterLink to="/planificacion-normativa">
          <Button variant="outline">
            <ArrowLeft size={18} />
            Volver al módulo
          </Button>
        </RouterLink>
      </Flex>

      <Grid templateColumns={{ base: "1fr", xl: "1.4fr 0.8fr" }} gap="5">
        <VStack align="stretch" gap="5">
          <SectionCard
            title="Datos generales de la solicitud"
            description="Información principal para clasificar y enrutar la solicitud."
            icon={ClipboardList}
          >
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
              <Field.Root>
                <Field.Label>Tipo de gasto</Field.Label>
                <Select.Root
                  collection={expenseTypes}
                  value={expenseType}
                  onValueChange={(details) => setExpenseType(details.value)}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Seleccione tipo de gasto" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {expenseTypes.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label>Rol del solicitante</Field.Label>
                <Select.Root
                  collection={requesterRoles}
                  value={role}
                  onValueChange={(details) => setRole(details.value)}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Seleccione rol" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {requesterRoles.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label>Empresa / unidad de negocio</Field.Label>
                <Input placeholder="Servicios Compartidos" />
              </Field.Root>

              <Field.Root>
                <Field.Label>Centro de costo</Field.Label>
                <Input placeholder="Administración / Finanzas" />
              </Field.Root>

              <Field.Root gridColumn={{ base: "auto", md: "span 2" }}>
                <Field.Label>Concepto de la solicitud</Field.Label>
                <Input placeholder="Ej. Gastos operativos por visita técnica" />
              </Field.Root>

              <Field.Root gridColumn={{ base: "auto", md: "span 2" }}>
                <Field.Label>Justificación</Field.Label>
                <Textarea
                  placeholder="Explique el motivo del gasto y su relación con la operación."
                  minH="110px"
                />
              </Field.Root>
            </Grid>
          </SectionCard>

          {currentExpenseType === "travel" && (
            <SectionCard
              title="Detalle de gasto de viaje"
              description="Seleccione los rubros necesarios para calcular el monto estimado según rol, destino y días."
              icon={Plane}
            >
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="4" mb="5">
                <Field.Root>
                  <Field.Label>Destino</Field.Label>
                  <Select.Root
                    collection={destinations}
                    value={destination}
                    onValueChange={(details) => setDestination(details.value)}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Seleccione destino" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {destinations.items.map((item) => (
                          <Select.Item item={item} key={item.value}>
                            {item.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Cantidad de días</Field.Label>
                  <NumberInput.Root
                    min={1}
                    value={days}
                    onValueChange={(details) => setDays(details.value)}
                  >
                    <NumberInput.Control />
                    <NumberInput.Input />
                  </NumberInput.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Fecha estimada de salida</Field.Label>
                  <Input type="date" />
                </Field.Root>
              </Grid>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
                {travelItems.map((item) => (
                  <Box
                    key={item.key}
                    border="1px solid"
                    borderColor={
                      selectedItems.includes(item.key) ? "blue.200" : "gray.100"
                    }
                    bg={selectedItems.includes(item.key) ? "blue.50" : "white"}
                    rounded="2xl"
                    p="4"
                    cursor="pointer"
                    onClick={() => toggleItem(item.key)}
                  >
                    <Flex justify="space-between" align="start" gap="3">
                      <Box>
                        <Text fontWeight="semibold">{item.label}</Text>
                        <Text fontSize="sm" color="gray.500" mt="1">
                          {item.description}
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" mt="3">
                          Base diaria: Q {item.base.toFixed(2)}
                        </Text>
                      </Box>

                      <Checkbox.Root
                        checked={selectedItems.includes(item.key)}
                        onCheckedChange={() => toggleItem(item.key)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Flex>
                  </Box>
                ))}
              </Grid>
            </SectionCard>
          )}

          {currentExpenseType === "provider" && (
            <SectionCard
              title="Detalle de pago a proveedor"
              description="Campos específicos para gastos relacionados con proveedores, servicios externos o compras operativas."
              icon={FileText}
            >
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
                <Field.Root>
                  <Field.Label>Proveedor</Field.Label>
                  <Input placeholder="Nombre del proveedor" />
                </Field.Root>

                <Field.Root>
                  <Field.Label>NIT / Identificación</Field.Label>
                  <Input placeholder="Ingrese NIT del proveedor" />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Número de proforma / referencia</Field.Label>
                  <Input placeholder="PRO-0001" />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Fecha estimada de pago</Field.Label>
                  <Input type="date" />
                </Field.Root>

                <Field.Root gridColumn={{ base: "auto", md: "span 2" }}>
                  <Field.Label>Servicio o compra solicitada</Field.Label>
                  <Textarea placeholder="Detalle del servicio, compra o gasto solicitado." />
                </Field.Root>
              </Grid>
            </SectionCard>
          )}
        </VStack>

        <VStack align="stretch" gap="5">
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <HStack mb="4">
              <Box color="blue.600">
                <Calculator size={22} />
              </Box>
              <Heading size="md">Resumen estimado</Heading>
            </HStack>

            <VStack align="stretch" gap="3">
              <SummaryRow label="Tipo de gasto" value={getSelectedLabel(expenseTypes.items, currentExpenseType)} />
              <SummaryRow label="Rol" value={getSelectedLabel(requesterRoles.items, currentRole)} />
              {currentExpenseType === "travel" && (
                <>
                  <SummaryRow label="Destino" value={getSelectedLabel(destinations.items, currentDestination)} />
                  <SummaryRow label="Días" value={days || "1"} />
                  <SummaryRow label="Rubros seleccionados" value={String(selectedItems.length)} />
                </>
              )}
            </VStack>

            <Box
              mt="5"
              p="4"
              rounded="2xl"
              bg="blue.50"
              border="1px solid"
              borderColor="blue.100"
            >
              <Text fontSize="sm" color="blue.700">
                Monto estimado
              </Text>
              <Heading size="xl" color="blue.700" mt="1">
                Q {estimatedAmount.toLocaleString("es-GT", { minimumFractionDigits: 2 })}
              </Heading>
            </Box>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <HStack mb="4">
              <Box color="green.600">
                <ShieldCheck size={22} />
              </Box>
              <Heading size="md">Validaciones</Heading>
            </HStack>

            <VStack align="stretch" gap="3">
              <ValidationStatus title="Política aplicada" status="Correcto" />
              <ValidationStatus title="Presupuesto disponible" status="Correcto" />
              <ValidationStatus title="Flujo de autorización" status="Definido" />
              <ValidationStatus title="Documentos requeridos" status="Pendiente" />
            </VStack>
          </Box>

          <HStack gap="3">
            <Button variant="outline" flex="1">
              <Save size={18} />
              Guardar borrador
            </Button>

            <Button colorPalette="blue" flex="1">
              <Send size={18} />
              Enviar solicitud
            </Button>
          </HStack>
        </VStack>
      </Grid>
    </VStack>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="2xl"
      p="5"
    >
      <HStack align="start" gap="3" mb="5">
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

        <Box>
          <Heading size="md">{title}</Heading>
          <Text fontSize="sm" color="gray.500" mt="1">
            {description}
          </Text>
        </Box>
      </HStack>

      {children}
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="space-between" gap="3">
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="semibold" textAlign="right">
        {value}
      </Text>
    </Flex>
  );
}

function ValidationStatus({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      border="1px solid"
      borderColor="gray.100"
      rounded="xl"
      p="3"
    >
      <HStack>
        <CheckCircle2 size={17} color="#16a34a" />
        <Text fontSize="sm" fontWeight="medium">
          {title}
        </Text>
      </HStack>

      <Badge colorPalette={status === "Pendiente" ? "yellow" : "green"}>
        {status}
      </Badge>
    </Flex>
  );
}

function getSelectedLabel(
  items: { label: string; value: string }[],
  value: string
) {
  return items.find((item) => item.value === value)?.label ?? value;
}