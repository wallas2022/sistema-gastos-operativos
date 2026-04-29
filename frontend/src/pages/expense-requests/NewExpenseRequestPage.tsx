import { useMemo, useState } from "react";
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
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  Plus,
  Save,
  Trash2,
  WalletCards,
} from "lucide-react";
import { createExpenseRequest } from "../../modules/expense-requests/services/expenseRequests.service";

type ExpenseItem = {
  name: string;
  description: string;
  quantity: number;
  unitAmount: number;
};

const expenseTypes = [
  { value: "GASTO_OPERATIVO", label: "Gasto operativo" },
  { value: "GASTO_VIAJE", label: "Gasto de viaje" },
  { value: "PAGO_PROVEEDOR", label: "Pago a proveedor" },
  { value: "COMPRA_INSUMO", label: "Compra de insumo" },
  { value: "SERVICIO", label: "Servicio" },
  { value: "OTRO", label: "Otro" },
];

const priorities = [
  { value: "BAJA", label: "Baja" },
  { value: "NORMAL", label: "Normal" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

const roleTemplates: Record<string, ExpenseItem[]> = {
  Operador: [
    {
      name: "Alimentación",
      description: "Monto estimado por día según política",
      quantity: 1,
      unitAmount: 100,
    },
    {
      name: "Transporte local",
      description: "Movilidad operativa",
      quantity: 1,
      unitAmount: 75,
    },
  ],
  Jefe: [
    {
      name: "Alimentación",
      description: "Monto estimado por día según política",
      quantity: 1,
      unitAmount: 140,
    },
    {
      name: "Alojamiento",
      description: "Hospedaje estándar",
      quantity: 1,
      unitAmount: 450,
    },
  ],
  Gerente: [
    {
      name: "Alimentación",
      description: "Monto estimado por día según política",
      quantity: 1,
      unitAmount: 160,
    },
    {
      name: "Alojamiento superior",
      description: "Hospedaje autorizado por jerarquía",
      quantity: 1,
      unitAmount: 650,
    },
    {
      name: "Alquiler de vehículo",
      description: "Movilidad ejecutiva",
      quantity: 1,
      unitAmount: 400,
    },
  ],
  Directivo: [
    {
      name: "Alimentación ejecutiva",
      description: "Monto estimado por día según política",
      quantity: 1,
      unitAmount: 250,
    },
    {
      name: "Alojamiento ejecutivo",
      description: "Hospedaje autorizado por jerarquía",
      quantity: 1,
      unitAmount: 950,
    },
    {
      name: "Transporte ejecutivo",
      description: "Vehículo o traslado autorizado",
      quantity: 1,
      unitAmount: 600,
    },
  ],
};

export function NewExpenseRequestPage() {
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const [type, setType] = useState("GASTO_VIAJE");
  const [priority, setPriority] = useState("NORMAL");
  const [requesterName, setRequesterName] = useState("Walter Rosales");
  const [requesterRole, setRequesterRole] = useState("Gerente");
  const [companyName, setCompanyName] = useState("Servicios Compartidos");
  const [costCenter, setCostCenter] = useState("CC-ADM-001");
  const [budgetAccount, setBudgetAccount] = useState(
    "6101 - Gastos administrativos"
  );
  const [concept, setConcept] = useState(
    "Viaje operativo para supervisión regional"
  );
  const [justification, setJustification] = useState(
    "Supervisión operativa planificada."
  );
  const [destination, setDestination] = useState("Ciudad de Guatemala");
  const [days, setDays] = useState(3);
  const [estimatedDate, setEstimatedDate] = useState("");

  const [items, setItems] = useState<ExpenseItem[]>([
    {
      name: "Alimentación",
      description: "Q 160.00 por día x 3 días",
      quantity: 3,
      unitAmount: 160,
    },
    {
      name: "Alojamiento superior",
      description: "Q 650.00 por noche x 2 noches",
      quantity: 2,
      unitAmount: 650,
    },
    {
      name: "Alquiler de vehículo",
      description: "Q 400.00 por día x 3 días",
      quantity: 3,
      unitAmount: 400,
    },
  ]);

  const estimatedTotal = useMemo(() => {
    return items.reduce((total, item) => {
      return total + Number(item.quantity || 0) * Number(item.unitAmount || 0);
    }, 0);
  }, [items]);

  const applyRoleTemplate = () => {
    const template = roleTemplates[requesterRole] ?? [];

    const adjustedItems = template.map((item) => ({
      ...item,
      quantity: type === "GASTO_VIAJE" ? Number(days || 1) : 1,
      description:
        type === "GASTO_VIAJE"
          ? `${item.description} x ${days || 1} día(s)`
          : item.description,
    }));

    setItems(adjustedItems);
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        name: "",
        description: "",
        quantity: 1,
        unitAmount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateItem = (
    index: number,
    field: keyof ExpenseItem,
    value: string | number
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "quantity" || field === "unitAmount"
                  ? Number(value)
                  : value,
            }
          : item
      )
    );
  };

  const handleSubmitRequest = async () => {
    try {
      setIsSaving(true);

      if (!concept.trim()) {
        alert("Debes ingresar el concepto de la solicitud.");
        return;
      }

      if (!companyName.trim()) {
        alert("Debes ingresar la empresa.");
        return;
      }

      if (!costCenter.trim()) {
        alert("Debes ingresar el centro de costo.");
        return;
      }

      if (items.length === 0) {
        alert("Debes agregar al menos un ítem de gasto.");
        return;
      }

      const payload = {
        type,
        priority,
        requesterName,
        requesterRole,
        companyName,
        costCenter,
        budgetAccount,
        concept,
        justification,
        destination,
        days: Number(days || 1),
        estimatedDate: estimatedDate || undefined,
        currency: "GTQ",
        items: items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: Number(item.quantity || 1),
          unitAmount: Number(item.unitAmount || 0),
        })),
      };

      const createdRequest = await createExpenseRequest(payload);

      alert("Solicitud de gasto creada correctamente.");

      navigate(`/planificacion/solicitudes/${createdRequest.id}`);
    } catch (error) {
      console.error("Error al crear solicitud de gasto:", error);
      alert(
        "No se pudo crear la solicitud de gasto. Revisa los datos e intenta nuevamente."
      );
    } finally {
      setIsSaving(false);
    }
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
              <ClipboardList size={22} />
            </Box>

            <Box>
              <Heading size="lg">Nueva solicitud de gasto</Heading>
              <Text color="gray.500">
                Registro inicial del ciclo de planificación y normativa.
              </Text>
            </Box>
          </HStack>
        </Box>

        <Badge colorPalette="blue" rounded="full" px="3" py="1">
          MPN · Planificación y Normativa
        </Badge>
      </Flex>

      <Grid templateColumns={{ base: "1fr", xl: "1.4fr 0.8fr" }} gap="5">
        <VStack align="stretch" gap="5">
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <HStack mb="4">
              <FileText size={20} />
              <Heading size="md">Datos generales</Heading>
            </HStack>

            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
              <Field label="Tipo de gasto">
                <Box
                  as="select"
                  value={type}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    setType(event.target.value)
                  }
                  border="1px solid"
                  borderColor="gray.200"
                  rounded="md"
                  h="40px"
                  px="3"
                  bg="white"
                >
                  {expenseTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Box>
              </Field>

              <Field label="Prioridad">
                <Box
                  as="select"
                  value={priority}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    setPriority(event.target.value)
                  }
                  border="1px solid"
                  borderColor="gray.200"
                  rounded="md"
                  h="40px"
                  px="3"
                  bg="white"
                >
                  {priorities.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Box>
              </Field>

              <Field label="Solicitante">
                <Input
                  value={requesterName}
                  onChange={(event) => setRequesterName(event.target.value)}
                />
              </Field>

              <Field label="Rol del solicitante">
                <Box
                  as="select"
                  value={requesterRole}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                    setRequesterRole(event.target.value)
                  }
                  border="1px solid"
                  borderColor="gray.200"
                  rounded="md"
                  h="40px"
                  px="3"
                  bg="white"
                >
                  <option value="Operador">Operador</option>
                  <option value="Jefe">Jefe</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Directivo">Directivo</option>
                </Box>
              </Field>

              <Field label="Empresa">
                <Input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </Field>

              <Field label="Centro de costo">
                <Input
                  value={costCenter}
                  onChange={(event) => setCostCenter(event.target.value)}
                />
              </Field>

              <Field label="Cuenta presupuestaria">
                <Input
                  value={budgetAccount}
                  onChange={(event) => setBudgetAccount(event.target.value)}
                />
              </Field>

              <Field label="Fecha estimada">
                <Input
                  type="date"
                  value={estimatedDate}
                  onChange={(event) => setEstimatedDate(event.target.value)}
                />
              </Field>
            </Grid>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <HStack mb="4">
              <MapPin size={20} />
              <Heading size="md">Detalle de la solicitud</Heading>
            </HStack>

            <Grid templateColumns={{ base: "1fr", md: "1.5fr 0.5fr" }} gap="4">
              <Field label="Concepto">
                <Input
                  value={concept}
                  onChange={(event) => setConcept(event.target.value)}
                />
              </Field>

              <Field label="Días">
                <Input
                  type="number"
                  min="1"
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                />
              </Field>

              <Field label="Destino">
                <Input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </Field>

              <Field label="Justificación">
                <Box
                  as="textarea"
                  value={justification}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setJustification(event.target.value)
                  }
                  border="1px solid"
                  borderColor="gray.200"
                  rounded="md"
                  minH="40px"
                  px="3"
                  py="2"
                  resize="vertical"
                />
              </Field>
            </Grid>

            <Button variant="outline" mt="4" onClick={applyRoleTemplate}>
              <CheckCircle2 size={18} />
              Aplicar ítems sugeridos por rol
            </Button>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Flex justify="space-between" align="center" mb="4">
              <Box>
                <Heading size="md">Ítems del gasto</Heading>
                <Text fontSize="sm" color="gray.500">
                  Rubros estimados para la solicitud.
                </Text>
              </Box>

              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus size={16} />
                Agregar ítem
              </Button>
            </Flex>

            <VStack align="stretch" gap="3">
              {items.map((item, index) => (
                <Box
                  key={index}
                  border="1px solid"
                  borderColor="gray.100"
                  rounded="xl"
                  p="4"
                >
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "1.2fr 1.5fr 0.5fr 0.6fr 0.4fr",
                    }}
                    gap="3"
                    alignItems="end"
                  >
                    <Field label="Nombre">
                      <Input
                        value={item.name}
                        onChange={(event) =>
                          updateItem(index, "name", event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Descripción">
                      <Input
                        value={item.description}
                        onChange={(event) =>
                          updateItem(index, "description", event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Cantidad">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Monto unitario">
                      <Input
                        type="number"
                        min="0"
                        value={item.unitAmount}
                        onChange={(event) =>
                          updateItem(index, "unitAmount", event.target.value)
                        }
                      />
                    </Field>

                    <Button
                      variant="outline"
                      colorPalette="red"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Grid>

                  <Text fontSize="sm" color="gray.500" mt="2">
                    Subtotal:{" "}
                    <strong>
                      Q{" "}
                      {(
                        Number(item.quantity || 0) *
                        Number(item.unitAmount || 0)
                      ).toLocaleString("es-GT", {
                        minimumFractionDigits: 2,
                      })}
                    </strong>
                  </Text>
                </Box>
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
            position="sticky"
            top="92px"
          >
            <HStack mb="4">
              <WalletCards size={20} />
              <Heading size="md">Resumen estimado</Heading>
            </HStack>

            <VStack align="stretch" gap="3">
              <SummaryRow label="Tipo" value={type.replace("_", " ")} />
              <SummaryRow label="Prioridad" value={priority} />
              <SummaryRow label="Rol" value={requesterRole} />
              <SummaryRow label="Días" value={`${days || 1}`} />
              <SummaryRow label="Ítems" value={`${items.length}`} />
            </VStack>

            <Box bg="blue.50" rounded="2xl" p="4" mt="5">
              <Text fontSize="sm" color="blue.700">
                Total estimado
              </Text>
              <Heading size="xl" color="blue.800" mt="1">
                Q{" "}
                {estimatedTotal.toLocaleString("es-GT", {
                  minimumFractionDigits: 2,
                })}
              </Heading>
            </Box>

            <Button
              colorPalette="blue"
              w="100%"
              mt="5"
              loading={isSaving}
              onClick={handleSubmitRequest}
            >
              <Save size={18} />
              Crear solicitud
            </Button>

            <Button
              variant="outline"
              w="100%"
              mt="3"
              onClick={() => navigate("/solicitudes-gastos")}
            >
              Cancelar
            </Button>

            <Box mt="5" borderTop="1px solid" borderColor="gray.100" pt="4">
              <HStack color="gray.500">
                <CalendarDays size={16} />
                <Text fontSize="sm">
                  La solicitud se guardará como borrador y luego podrá enviarse
                  a autorización.
                </Text>
              </HStack>
            </Box>
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
      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb="1">
        {label}
      </Text>
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