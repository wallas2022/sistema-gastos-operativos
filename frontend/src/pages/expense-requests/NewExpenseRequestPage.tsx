import { useMemo, useState } from "react";
import type { Dispatch, ElementType, ReactNode, SetStateAction } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  ArrowLeft,
  Calculator,
  Car,
  CheckCircle2,
  ClipboardList,
  FileText,
  Hotel,
  Save,
  Send,
  ShieldCheck,
  Soup,
  WalletCards,
} from "lucide-react";

const travelPolicies = {
  operador: [
    {
      id: "alimentacion",
      label: "Alimentación",
      rate: 90,
      unit: "por día",
      icon: Soup,
    },
    {
      id: "transporte",
      label: "Transporte local",
      rate: 75,
      unit: "por día",
      icon: Car,
    },
    {
      id: "alojamiento",
      label: "Alojamiento básico",
      rate: 280,
      unit: "por noche",
      icon: Hotel,
    },
  ],
  jefe: [
    {
      id: "alimentacion",
      label: "Alimentación",
      rate: 125,
      unit: "por día",
      icon: Soup,
    },
    {
      id: "transporte",
      label: "Transporte local",
      rate: 100,
      unit: "por día",
      icon: Car,
    },
    {
      id: "alojamiento",
      label: "Alojamiento estándar",
      rate: 420,
      unit: "por noche",
      icon: Hotel,
    },
  ],
  gerente: [
    {
      id: "alimentacion",
      label: "Alimentación",
      rate: 160,
      unit: "por día",
      icon: Soup,
    },
    {
      id: "alojamiento",
      label: "Alojamiento superior",
      rate: 650,
      unit: "por noche",
      icon: Hotel,
    },
    {
      id: "vehiculo",
      label: "Alquiler de vehículo",
      rate: 400,
      unit: "por día",
      icon: Car,
    },
  ],
  directivo: [
    {
      id: "alimentacion",
      label: "Alimentación ejecutiva",
      rate: 220,
      unit: "por día",
      icon: Soup,
    },
    {
      id: "alojamiento",
      label: "Alojamiento ejecutivo",
      rate: 950,
      unit: "por noche",
      icon: Hotel,
    },
    {
      id: "vehiculo",
      label: "Alquiler de vehículo",
      rate: 650,
      unit: "por día",
      icon: Car,
    },
  ],
};

export function NewExpenseRequestPage() {
  const [expenseType, setExpenseType] = useState("");
  const [requesterRole, setRequesterRole] = useState("operador");
  const [travelDays, setTravelDays] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([
    "alimentacion",
  ]);

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

          <Heading size="lg">Nueva Solicitud de Gasto</Heading>
          <Text color="gray.500" mt="1">
            Registro inicial del gasto con validación de política y presupuesto
            antes de enviarlo a autorización.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline">
            <Save size={18} />
            Guardar borrador
          </Button>

          <Button colorPalette="blue">
            <Send size={18} />
            Enviar a autorización
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
                <ClipboardList size={21} />
              </Box>

              <Box>
                <Heading size="md">Datos generales</Heading>
                <Text fontSize="sm" color="gray.500">
                  Información principal de la solicitud.
                </Text>
              </Box>
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
              <Field label="Código de solicitud">
                <Input value="SOL-0004" readOnly />
              </Field>

              <Field label="Fecha de solicitud">
                <Input type="date" defaultValue="2026-04-28" />
              </Field>

              <Field label="Tipo de gasto">
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={expenseType}
                    onChange={(event) => {
                      setExpenseType(event.target.value);
                      setSelectedItems(["alimentacion"]);
                    }}
                  >
                    <option value="" disabled>
                      Selecciona un tipo
                    </option>
                    <option value="operativo">Gasto operativo</option>
                    <option value="proveedor">Pago a proveedor</option>
                    <option value="viaje">Gasto de viaje / viáticos</option>
                    <option value="compra">Compra de insumos</option>
                    <option value="servicio">Servicio externo</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>

              <Field label="Prioridad">
                <NativeSelect.Root>
                  <NativeSelect.Field defaultValue="normal">
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>

              <Field label="Monto estimado">
                <Input placeholder="Ej. 3500.00" />
              </Field>

              <Field label="Moneda">
                <NativeSelect.Root>
                  <NativeSelect.Field defaultValue="GTQ">
                    <option value="GTQ">Quetzales GTQ</option>
                    <option value="USD">Dólares USD</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>

              <Field label="Empresa">
                <Input placeholder="Ej. Servicios Compartidos" />
              </Field>

              <Field label="Área / Departamento">
                <Input placeholder="Ej. Administración" />
              </Field>

              <Field label="Centro de costo">
                <Input placeholder="Ej. CC-ADM-001" />
              </Field>

              <Field label="Cuenta presupuestaria">
                <Input placeholder="Ej. 6101 - Gastos administrativos" />
              </Field>
            </Grid>

            <Box mt="4">
              <Field label="Concepto del gasto">
                <Input placeholder="Ej. Compra de suministros administrativos" />
              </Field>
            </Box>

            <Box mt="4">
              <Field label="Justificación">
                <Textarea
                  rows={4}
                  placeholder="Describe por qué se requiere realizar este gasto."
                />
              </Field>
            </Box>
          </Box>

          {expenseType === "viaje" && (
            <TravelExpenseSection
              requesterRole={requesterRole}
              setRequesterRole={setRequesterRole}
              travelDays={travelDays}
              setTravelDays={setTravelDays}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
            />
          )}

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
                <FileText size={21} />
              </Box>

              <Box>
                <Heading size="md">Documentación previa</Heading>
                <Text fontSize="sm" color="gray.500">
                  Documentos de soporte opcionales antes de la ejecución.
                </Text>
              </Box>
            </Flex>

            <Box
              border="1px dashed"
              borderColor="gray.300"
              rounded="2xl"
              p="6"
              textAlign="center"
              bg="gray.50"
            >
              <Text fontWeight="semibold">Adjuntar cotización o respaldo</Text>
              <Text fontSize="sm" color="gray.500" mt="1">
                PDF, imagen o documento relacionado con la solicitud.
              </Text>

              <Button variant="outline" mt="4">
                Seleccionar archivo
              </Button>
            </Box>
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
                bg="green.50"
                color="green.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <ShieldCheck size={21} />
              </Box>

              <Box>
                <Heading size="md">Validación de política</Heading>
                <Text fontSize="sm" color="gray.500">
                  Resultado preliminar según normativa configurada.
                </Text>
              </Box>
            </Flex>

            <VStack align="stretch" gap="3">
              <ValidationItem
                title="Tipo de gasto permitido"
                description="El gasto seleccionado está habilitado para esta área."
                status={expenseType ? "Cumple" : "Pendiente"}
                color={expenseType ? "green" : "yellow"}
              />

              <ValidationItem
                title="Límite por jerarquía"
                description="El monto está dentro del rango autorizado para el solicitante."
                status="Cumple"
                color="green"
              />

              <ValidationItem
                title="Documentación requerida"
                description="Para este tipo de gasto puede requerirse respaldo."
                status="Pendiente"
                color="yellow"
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
                <WalletCards size={21} />
              </Box>

              <Box>
                <Heading size="md">Validación presupuestaria</Heading>
                <Text fontSize="sm" color="gray.500">
                  Disponibilidad estimada del centro de costo.
                </Text>
              </Box>
            </Flex>

            <VStack align="stretch" gap="3">
              <BudgetRow label="Presupuesto mensual" value="Q 25,000.00" />
              <BudgetRow label="Ejecutado actual" value="Q 14,800.00" />
              <BudgetRow label="Disponible" value="Q 10,200.00" strong />
              <BudgetRow label="Solicitud actual" value="Q 3,500.00" />

              <Box bg="green.50" color="green.700" rounded="xl" p="4" mt="2">
                <HStack align="start">
                  <CheckCircle2 size={20} />
                  <Box>
                    <Text fontWeight="semibold">Presupuesto disponible</Text>
                    <Text fontSize="sm">
                      La solicitud puede avanzar a autorización.
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </VStack>
          </Box>

          <Box bg="blue.600" color="white" rounded="2xl" p="5">
            <HStack align="start" gap="3">
              <Calculator size={24} />
              <Box>
                <Heading size="sm">Simulación del gasto</Heading>
                <Text fontSize="sm" mt="2" color="blue.50">
                  El sistema estima el impacto de esta solicitud antes de
                  afectar el presupuesto operativo disponible.
                </Text>
              </Box>
            </HStack>
          </Box>
        </VStack>
      </Grid>
    </VStack>
  );
}

function TravelExpenseSection({
  requesterRole,
  setRequesterRole,
  travelDays,
  setTravelDays,
  selectedItems,
  setSelectedItems,
}: {
  requesterRole: string;
  setRequesterRole: (value: string) => void;
  travelDays: number;
  setTravelDays: (value: number) => void;
  selectedItems: string[];
  setSelectedItems: Dispatch<SetStateAction<string[]>>;
}) {
  const policies =
    travelPolicies[requesterRole as keyof typeof travelPolicies] ?? [];

  const totalTravelAmount = useMemo(() => {
    return policies
      .filter((item) => selectedItems.includes(item.id))
      .reduce((sum, item) => {
        const quantity =
          item.id === "alojamiento" ? Math.max(travelDays - 1, 1) : travelDays;

        return sum + item.rate * quantity;
      }, 0);
  }, [policies, selectedItems, travelDays]);

  const toggleItem = (id: string) => {
    setSelectedItems((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="blue.200"
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
          <WalletCards size={21} />
        </Box>

        <Box>
          <HStack>
            <Heading size="md">Configuración de viáticos</Heading>
            <Badge colorPalette="blue">Formulario dinámico</Badge>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            Los conceptos disponibles cambian según el rol del solicitante y los
            días estimados de viaje.
          </Text>
        </Box>
      </Flex>

      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
        <Field label="Rol del solicitante">
          <NativeSelect.Root>
            <NativeSelect.Field
              value={requesterRole}
              onChange={(event) => {
                setRequesterRole(event.target.value);
                setSelectedItems(["alimentacion"]);
              }}
            >
              <option value="operador">Operador</option>
              <option value="jefe">Jefe</option>
              <option value="gerente">Gerente</option>
              <option value="directivo">Directivo</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field>

        <Field label="Cantidad de días de viaje">
          <Input
            type="number"
            min={1}
            value={travelDays}
            onChange={(event) => {
              const value = Number(event.target.value);
              setTravelDays(value > 0 ? value : 1);
            }}
          />
        </Field>

        <Field label="Ciudad origen">
          <Input placeholder="Ej. Guatemala" />
        </Field>

        <Field label="Ciudad destino">
          <Input placeholder="Ej. Quetzaltenango" />
        </Field>

        <Field label="Fecha de salida">
          <Input type="date" />
        </Field>

        <Field label="Fecha de retorno">
          <Input type="date" />
        </Field>
      </Grid>

      <Box mt="5">
        <Text fontWeight="semibold" mb="3">
          Conceptos permitidos según rol
        </Text>

        <VStack align="stretch" gap="3">
          {policies.map((item) => {
            const Icon = item.icon;
            const checked = selectedItems.includes(item.id);
            const quantity =
              item.id === "alojamiento"
                ? Math.max(travelDays - 1, 1)
                : travelDays;

            const subtotal = item.rate * quantity;

            return (
              <Flex
                key={item.id}
                justify="space-between"
                align={{ base: "start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                gap="3"
                border="1px solid"
                borderColor={checked ? "blue.200" : "gray.100"}
                bg={checked ? "blue.50" : "white"}
                rounded="xl"
                p="4"
              >
                <HStack align="start" gap="3">
                  <Checkbox.Root
                    checked={checked}
                    onCheckedChange={() => toggleItem(item.id)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>

                  <Box
                    w="38px"
                    h="38px"
                    rounded="xl"
                    bg="white"
                    color="blue.600"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <Icon size={18} />
                  </Box>

                  <Box>
                    <Text fontWeight="semibold">{item.label}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Q {item.rate.toLocaleString("es-GT")}.00 {item.unit} ×{" "}
                      {quantity}
                    </Text>
                  </Box>
                </HStack>

                <Text fontWeight="bold">
                  Q {subtotal.toLocaleString("es-GT")}.00
                </Text>
              </Flex>
            );
          })}
        </VStack>
      </Box>

      <Flex
        mt="5"
        bg="blue.600"
        color="white"
        rounded="2xl"
        p="5"
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="3"
      >
        <Box>
          <Text fontSize="sm" color="blue.100">
            Total estimado de viáticos
          </Text>
          <Heading size="lg">
            Q {totalTravelAmount.toLocaleString("es-GT")}.00
          </Heading>
        </Box>

        <Badge colorPalette="green" size="lg">
          Dentro de política
        </Badge>
      </Flex>
    </Box>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb="2">
        {label}
      </Text>
      {children}
    </Box>
  );
}

function ValidationItem({
  title,
  description,
  status,
  color,
}: {
  title: string;
  description: string;
  status: string;
  color: string;
}) {
  return (
    <Box border="1px solid" borderColor="gray.100" rounded="xl" p="4">
      <Flex justify="space-between" align="start" gap="3">
        <Box>
          <Text fontWeight="semibold">{title}</Text>
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        </Box>

        <Badge colorPalette={color}>{status}</Badge>
      </Flex>
    </Box>
  );
}

function BudgetRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
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

      <Text fontWeight={strong ? "bold" : "semibold"}>{value}</Text>
    </Flex>
  );
}