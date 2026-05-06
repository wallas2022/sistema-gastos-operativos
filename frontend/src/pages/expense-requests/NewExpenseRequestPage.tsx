import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Plus,
  Save,
  Trash2,
  WalletCards,
} from "lucide-react";

import {
  catalogsService,
  type Country,
  type Company,
  type Currency,
} from "../../services/catalogs.service";

import {
  costCenters,
  budgetAccounts,
  expenseTypes,
  priorities,
  providerPaymentRubrics,
  providers,
  requesterRoles,
  supplyItems,
  travelSuggestedItemsByRole,
  type ExpenseType,
} from "../../data/planningCatalogs";

import { api } from "../../shared/services/api";

type ExpenseItem = {
  name: string;
  description: string;
  quantity: number;
  unitAmount: number;
};

type ExpenseForm = {
  type: ExpenseType;
  priority: string;
  requesterName: string;
  requesterRole: string;
  businessUnit: string;
  costCenter: string;
  budgetAccount: string;
  concept: string;
  description: string;
  justification: string;
  destination: string;
  days: number;
  startDate: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "9px 12px",
  background: "white",
  fontSize: "14px",
  outline: "none",
};

const readonlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#F8FAFC",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "74px",
  resize: "vertical",
};

export function ExpenseRequestCreatePage() {
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [realCompanies, setRealCompanies] = useState<Company[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const [countryId, setCountryId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedRubricId, setSelectedRubricId] = useState("");
  const [selectedSupplyCode, setSelectedSupplyCode] = useState("");

  const [form, setForm] = useState<ExpenseForm>({
    type: "GASTO_VIAJE",
    priority: "NORMAL",
    requesterName: "Walter Rosales",
    requesterRole: "Gerente",
    businessUnit: "Administración",
    costCenter: "CC-ADM-001",
    budgetAccount: "6101 - Gastos administrativos",
    concept: "Viaje operativo para supervisión regional",
    description: "Solicitud de gastos para visita técnica a sucursal regional.",
    justification: "Supervisión operativa planificada.",
    destination: "Ciudad de Guatemala",
    days: 3,
    startDate: "",
  });

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

  const selectedExpenseType = form.type;

  const availableBudgetAccounts = useMemo(() => {
    return budgetAccounts.filter((account) =>
      account.expenseTypes.includes(selectedExpenseType)
    );
  }, [selectedExpenseType]);

  const selectedProvider = useMemo(() => {
    return providers.find((provider) => provider.id === selectedProviderId);
  }, [selectedProviderId]);

  const selectedRubric = useMemo(() => {
    return providerPaymentRubrics.find((rubric) => rubric.id === selectedRubricId);
  }, [selectedRubricId]);

  const selectedSupply = useMemo(() => {
    return supplyItems.find((item) => item.code === selectedSupplyCode);
  }, [selectedSupplyCode]);

  const selectedCompany = useMemo(() => {
    return realCompanies.find((company) => company.id === companyId);
  }, [realCompanies, companyId]);

  const selectedCurrency = useMemo(() => {
    return currencies.find((currency) => currency.id === currencyId);
  }, [currencies, currencyId]);

  const currencyCode = selectedCurrency?.code ?? "GTQ";
  const currencySymbol = selectedCurrency?.symbol ?? "Q";

  const totalAmount = items.reduce(
    (total, item) => total + Number(item.quantity) * Number(item.unitAmount),
    0
  );

  useEffect(() => {
    const loadInitialCatalogs = async () => {
      try {
        setLoadingCatalogs(true);

        const [countriesData, currenciesData] = await Promise.all([
          catalogsService.getCountries(),
          catalogsService.getCurrencies(),
        ]);

        setCountries(countriesData);
        setCurrencies(currenciesData);
      } catch (error) {
        console.error("Error cargando catálogos iniciales:", error);
        alert("No se pudieron cargar los catálogos de país y moneda.");
      } finally {
        setLoadingCatalogs(false);
      }
    };

    loadInitialCatalogs();
  }, []);

  useEffect(() => {
    const loadCompaniesByCountry = async () => {
      if (!countryId) {
        setRealCompanies([]);
        setCompanyId("");
        setCurrencyId("");
        return;
      }

      try {
        setLoadingCompanies(true);

        const companiesData = await catalogsService.getCompanies(countryId);

        setRealCompanies(companiesData);
        setCompanyId("");
        setCurrencyId("");
      } catch (error) {
        console.error("Error cargando empresas por país:", error);
        setRealCompanies([]);
        setCompanyId("");
        setCurrencyId("");
        alert("No se pudieron cargar las empresas del país seleccionado.");
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompaniesByCountry();
  }, [countryId]);

  useEffect(() => {
    if (!selectedCompany) {
      setCurrencyId("");
      return;
    }

    setCurrencyId(selectedCompany.currencyId);
  }, [selectedCompany]);

  const updateForm = <K extends keyof ExpenseForm>(
    field: K,
    value: ExpenseForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExpenseTypeChange = (value: ExpenseType) => {
    const firstAccount = budgetAccounts.find((account) =>
      account.expenseTypes.includes(value)
    );

    setForm((prev) => ({
      ...prev,
      type: value,
      concept: "",
      description: "",
      justification: "",
      destination: "",
      budgetAccount: firstAccount
        ? `${firstAccount.code} - ${firstAccount.name}`
        : "",
    }));

    setItems([]);
    setSelectedProviderId("");
    setSelectedRubricId("");
    setSelectedSupplyCode("");
  };

  const applyTravelItems = () => {
    const role = form.requesterRole as keyof typeof travelSuggestedItemsByRole;
    const suggestedItems = travelSuggestedItemsByRole[role] ?? [];
    const days = Number(form.days || 1);

    const calculatedItems = suggestedItems.map((item) => ({
      name: item.name,
      description: `${item.description} x ${days} día(s)`,
      quantity: days,
      unitAmount: item.unitAmount,
    }));

    setItems(calculatedItems);

    setForm((prev) => ({
      ...prev,
      concept: prev.concept || "Viaje operativo para supervisión regional",
      description:
        prev.description ||
        "Solicitud de gastos para visita técnica a sucursal regional.",
      justification:
        prev.justification || "Supervisión operativa planificada.",
      destination: prev.destination || "Ciudad de Guatemala",
    }));
  };

  const applyProviderRubric = () => {
    if (!selectedProvider || !selectedRubric) return;

    setForm((prev) => ({
      ...prev,
      concept: `Pago de ${selectedRubric.name}`,
      description: `Pago a proveedor ${selectedProvider.name}. NIT: ${selectedProvider.nit}.`,
      justification: `Pago operativo correspondiente al rubro ${selectedRubric.name}.`,
      destination: "No aplica",
      budgetAccount: selectedRubric.budgetAccount,
    }));

    setItems([
      {
        name: selectedRubric.name,
        description: `Pago estimado a ${selectedProvider.name}`,
        quantity: 1,
        unitAmount: selectedRubric.defaultAmount,
      },
    ]);
  };

  const applySupplyItem = () => {
    if (!selectedSupply) return;

    setForm((prev) => ({
      ...prev,
      concept: `Compra de ${selectedSupply.name}`,
      description: `Solicitud de compra del insumo ${selectedSupply.code}.`,
      justification: `Compra operativa de insumo para uso interno. Categoría: ${selectedSupply.category}.`,
      destination: "Uso interno",
      budgetAccount: "6401 - Compra de insumos",
    }));

    setItems([
      {
        name: selectedSupply.name,
        description: `${selectedSupply.category} - Unidad: ${selectedSupply.unit}`,
        quantity: 1,
        unitAmount: selectedSupply.defaultAmount,
      },
    ]);
  };

  const addEmptyItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        quantity: 1,
        unitAmount: 0,
      },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof ExpenseItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
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

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSubmit = async () => {
    try {
      if (!countryId) {
        alert("Debe seleccionar un país.");
        return;
      }

      if (!companyId) {
        alert("Debe seleccionar una empresa.");
        return;
      }

      if (!currencyId) {
        alert("La empresa seleccionada no tiene moneda configurada.");
        return;
      }

      if (!form.concept.trim()) {
        alert("Debes ingresar el concepto de la solicitud.");
        return;
      }

      if (!form.justification.trim()) {
        alert("Debes ingresar la justificación de la solicitud.");
        return;
      }

      if (items.length === 0) {
        alert("Debes agregar al menos un ítem a la solicitud.");
        return;
      }

      const invalidItem = items.some(
        (item) =>
          !item.name.trim() ||
          Number(item.quantity) <= 0 ||
          Number(item.unitAmount) <= 0
      );

      if (invalidItem) {
        alert("Todos los ítems deben tener nombre, cantidad y monto mayor a cero.");
        return;
      }

      setIsSaving(true);

      const payload = {
        type: form.type,
        priority: form.priority,
        requesterName: form.requesterName,
        requesterRole: form.requesterRole,

        countryId,
        companyId,
        currencyId,
        companyName: selectedCompany?.name ?? "",

        businessUnit: form.businessUnit,
        costCenter: form.costCenter,
        budgetAccount: form.budgetAccount,

        concept: form.concept,
        description: form.description,
        justification: form.justification,
        destination: form.destination,
        days: Number(form.days),
        estimatedDate: form.startDate || undefined,

        items: items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: Number(item.quantity),
          unitAmount: Number(item.unitAmount),
        })),
      };

      const response = await api.post("/expense-requests", payload);

      alert("Solicitud de gasto creada correctamente.");

      const requestId = response.data?.id ?? response.data?.expenseRequest?.id;

      if (requestId) {
        navigate(`/solicitudes-gastos/${requestId}`);
      } else {
        navigate("/solicitudes-gastos");
      }
    } catch (error: any) {
      console.error("Error completo:", error);
      console.error("Respuesta backend:", error.response?.data);
      console.error("Mensaje backend:", error.response?.data?.message);

      alert(
        Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join("\n")
          : error.response?.data?.message || "No se pudo guardar la solicitud."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VStack align="stretch" gap="5">
      <Flex justify="space-between" align="center">
        <Box>
          <HStack mb="2">
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
              <FileText size={20} />
            </Box>

            <Box>
              <Heading size="md">Nueva solicitud de gasto</Heading>
              <Text fontSize="sm" color="gray.500">
                Registro inicial del ciclo de planificación y normativa.
              </Text>
            </Box>
          </HStack>
        </Box>

        <Badge colorPalette="blue" variant="subtle">
          MPN · Planificación y Normativa
        </Badge>
      </Flex>

      <Grid templateColumns={{ base: "1fr", xl: "1.9fr 1fr" }} gap="5">
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
              <Heading size="sm">Datos generales</Heading>
            </HStack>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
              <Field label="País">
                <select
                  value={countryId}
                  onChange={(event) => setCountryId(event.target.value)}
                  disabled={loadingCatalogs}
                  style={inputStyle}
                >
                  <option value="">
                    {loadingCatalogs ? "Cargando países..." : "Seleccione un país"}
                  </option>

                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.code} - {country.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Empresa">
                <select
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                  disabled={!countryId || loadingCompanies}
                  style={inputStyle}
                >
                  <option value="">
                    {!countryId
                      ? "Seleccione primero un país"
                      : loadingCompanies
                        ? "Cargando empresas..."
                        : "Seleccione una empresa"}
                  </option>

                  {realCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.code} - {company.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Moneda">
                <input
                  value={
                    selectedCurrency
                      ? `${selectedCurrency.code} - ${selectedCurrency.name}`
                      : ""
                  }
                  readOnly
                  placeholder="Se asigna automáticamente según la empresa"
                  style={readonlyInputStyle}
                />
              </Field>

              <Field label="Tipo de gasto">
                <select
                  style={inputStyle}
                  value={form.type}
                  onChange={(event) =>
                    handleExpenseTypeChange(event.target.value as ExpenseType)
                  }
                >
                  {expenseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Prioridad">
                <select
                  style={inputStyle}
                  value={form.priority}
                  onChange={(event) =>
                    updateForm("priority", event.target.value)
                  }
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Solicitante">
                <input
                  style={inputStyle}
                  value={form.requesterName}
                  onChange={(event) =>
                    updateForm("requesterName", event.target.value)
                  }
                />
              </Field>

              <Field label="Rol del solicitante">
                <select
                  style={inputStyle}
                  value={form.requesterRole}
                  onChange={(event) =>
                    updateForm("requesterRole", event.target.value)
                  }
                >
                  {requesterRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Centro de costo">
                <select
                  style={inputStyle}
                  value={form.costCenter}
                  onChange={(event) =>
                    updateForm("costCenter", event.target.value)
                  }
                >
                  {costCenters.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.id} - {center.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Cuenta presupuestaria">
                <select
                  style={inputStyle}
                  value={form.budgetAccount}
                  onChange={(event) =>
                    updateForm("budgetAccount", event.target.value)
                  }
                >
                  {availableBudgetAccounts.map((account) => (
                    <option
                      key={account.code}
                      value={`${account.code} - ${account.name}`}
                    >
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha estimada">
                <input
                  type="date"
                  style={inputStyle}
                  value={form.startDate}
                  onChange={(event) =>
                    updateForm("startDate", event.target.value)
                  }
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
              <Building2 size={20} />
              <Heading size="sm">Detalle de la solicitud</Heading>
            </HStack>

            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap="4">
              <Field label="Concepto">
                <input
                  style={inputStyle}
                  value={form.concept}
                  onChange={(event) =>
                    updateForm("concept", event.target.value)
                  }
                />
              </Field>

              <Field label="Días">
                <input
                  type="number"
                  min={1}
                  style={inputStyle}
                  value={form.days}
                  onChange={(event) =>
                    updateForm("days", Number(event.target.value))
                  }
                />
              </Field>

              <Field label="Destino">
                <input
                  style={inputStyle}
                  value={form.destination}
                  onChange={(event) =>
                    updateForm("destination", event.target.value)
                  }
                />
              </Field>

              <Field label="Justificación">
                <textarea
                  style={textareaStyle}
                  value={form.justification}
                  onChange={(event) =>
                    updateForm("justification", event.target.value)
                  }
                />
              </Field>
            </Grid>
          </Box>

          {form.type === "GASTO_VIAJE" && (
            <DynamicSection
              title="Datos de viaje / viáticos"
              description="Este tipo de gasto utiliza políticas por rol, destino y cantidad de días."
              badge="Viáticos"
            >
              <Button variant="outline" onClick={applyTravelItems}>
                <CheckCircle2 size={17} />
                Aplicar ítems sugeridos por rol
              </Button>
            </DynamicSection>
          )}

          {form.type === "PAGO_PROVEEDOR" && (
            <DynamicSection
              title="Datos de pago a proveedor"
              description="Selecciona el proveedor y el rubro que se desea pagar."
              badge="Proveedor"
            >
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
                <Field label="Proveedor">
                  <select
                    style={inputStyle}
                    value={selectedProviderId}
                    onChange={(event) =>
                      setSelectedProviderId(event.target.value)
                    }
                  >
                    <option value="">Seleccione proveedor</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} - {provider.nit}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Rubro del pago">
                  <select
                    style={inputStyle}
                    value={selectedRubricId}
                    onChange={(event) =>
                      setSelectedRubricId(event.target.value)
                    }
                  >
                    <option value="">Seleccione rubro</option>
                    {providerPaymentRubrics.map((rubric) => (
                      <option key={rubric.id} value={rubric.id}>
                        {rubric.name} - {currencyCode} {rubric.defaultAmount}
                      </option>
                    ))}
                  </select>
                </Field>
              </Grid>

              {selectedProvider && (
                <Box mt="4" p="3" bg="gray.50" rounded="xl">
                  <Text fontSize="sm">
                    <strong>Proveedor:</strong> {selectedProvider.name}
                  </Text>
                  <Text fontSize="sm">
                    <strong>NIT:</strong> {selectedProvider.nit}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Categoría:</strong> {selectedProvider.category}
                  </Text>
                </Box>
              )}

              <Button
                mt="4"
                colorPalette="blue"
                onClick={applyProviderRubric}
                disabled={!selectedProviderId || !selectedRubricId}
              >
                <WalletCards size={17} />
                Aplicar rubro de proveedor
              </Button>
            </DynamicSection>
          )}

          {form.type === "COMPRA_INSUMO" && (
            <DynamicSection
              title="Datos de compra de insumos"
              description="Selecciona un ítem simulado del ERP para generar la solicitud."
              badge="ERP"
            >
              <Field label="Ítem ERP">
                <select
                  style={inputStyle}
                  value={selectedSupplyCode}
                  onChange={(event) =>
                    setSelectedSupplyCode(event.target.value)
                  }
                >
                  <option value="">Seleccione ítem</option>
                  {supplyItems.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} - {item.name} - {currencyCode} {item.defaultAmount}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedSupply && (
                <Box mt="4" p="3" bg="gray.50" rounded="xl">
                  <Text fontSize="sm">
                    <strong>Ítem:</strong> {selectedSupply.name}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Categoría:</strong> {selectedSupply.category}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Unidad:</strong> {selectedSupply.unit}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Monto estimado:</strong> {currencyCode} {selectedSupply.defaultAmount}
                  </Text>
                </Box>
              )}

              <Button
                mt="4"
                colorPalette="blue"
                onClick={applySupplyItem}
                disabled={!selectedSupplyCode}
              >
                <Plus size={17} />
                Aplicar ítem ERP
              </Button>
            </DynamicSection>
          )}

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Flex justify="space-between" align="center" mb="4">
              <Box>
                <Heading size="sm">Ítems del gasto</Heading>
                <Text fontSize="sm" color="gray.500">
                  Rubros estimados para la solicitud.
                </Text>
              </Box>

              <Button variant="outline" onClick={addEmptyItem}>
                <Plus size={17} />
                Agregar ítem
              </Button>
            </Flex>

            <VStack align="stretch" gap="4">
              {items.map((item, index) => (
                <Box
                  key={index}
                  border="1px solid"
                  borderColor="gray.200"
                  rounded="xl"
                  p="4"
                >
                  <Grid
                    templateColumns={{
                      base: "1fr",
                      md: "1.2fr 1.7fr 0.7fr 0.8fr auto",
                    }}
                    gap="3"
                    alignItems="end"
                  >
                    <Field label="Nombre">
                      <input
                        style={inputStyle}
                        value={item.name}
                        onChange={(event) =>
                          updateItem(index, "name", event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Descripción">
                      <input
                        style={inputStyle}
                        value={item.description}
                        onChange={(event) =>
                          updateItem(index, "description", event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Cantidad">
                      <input
                        type="number"
                        min={1}
                        style={inputStyle}
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                      />
                    </Field>

                    <Field label="Monto unitario">
                      <input
                        type="number"
                        min={0}
                        style={inputStyle}
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
                      <Trash2 size={17} />
                    </Button>
                  </Grid>

                  <Text fontSize="sm" color="gray.500" mt="3">
                    Subtotal: {currencyCode} {" "}
                    {(Number(item.quantity) * Number(item.unitAmount)).toFixed(2)}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </VStack>

        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
          h="fit-content"
          position={{ base: "static", xl: "sticky" }}
          top="5"
        >
          <HStack mb="4">
            <WalletCards size={20} />
            <Heading size="sm">Resumen estimado</Heading>
          </HStack>

          <VStack align="stretch" gap="3" fontSize="sm">
            <SummaryRow label="País" value={countries.find((c) => c.id === countryId)?.name ?? "-"} />
            <SummaryRow label="Empresa" value={selectedCompany?.name ?? "-"} />
            <SummaryRow label="Moneda" value={selectedCurrency?.code ?? "-"} />
            <SummaryRow label="Tipo" value={form.type} />
            <SummaryRow label="Prioridad" value={form.priority} />
            <SummaryRow label="Rol" value={form.requesterRole} />
            <SummaryRow label="Días" value={String(form.days)} />
            <SummaryRow label="Ítems" value={String(items.length)} />
          </VStack>

          <Box bg="blue.50" rounded="xl" p="4" mt="5">
            <Text fontSize="sm" color="blue.700">
              Total estimado
            </Text>
            <Heading size="lg" color="blue.800" mt="1">
              {currencySymbol}{" "}
              {totalAmount.toLocaleString("es-GT", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Heading>
          </Box>

          <Button
            mt="5"
            w="100%"
            colorPalette="blue"
            loading={isSaving}
            onClick={handleSubmit}
          >
            <Save size={17} />
            Crear solicitud
          </Button>

          <Button
            mt="3"
            w="100%"
            variant="outline"
            onClick={() => navigate("/solicitudes-gastos")}
          >
            Cancelar
          </Button>

          <HStack mt="5" color="gray.500" fontSize="sm" align="start">
            <CalendarDays size={16} />
            <Text>
              La solicitud se guardará como borrador y luego podrá enviarse a
              autorización.
            </Text>
          </HStack>
        </Box>
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
      <Text fontSize="sm" mb="1" color="gray.700">
        {label}
      </Text>
      {children}
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="space-between" gap="4">
      <Text color="gray.500">{label}</Text>
      <Text fontWeight="semibold" textAlign="right">
        {value}
      </Text>
    </Flex>
  );
}

function DynamicSection({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge: string;
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
      <Flex justify="space-between" align="start" mb="4">
        <Box>
          <Heading size="sm">{title}</Heading>
          <Text fontSize="sm" color="gray.500" mt="1">
            {description}
          </Text>
        </Box>

        <Badge colorPalette="blue" variant="subtle">
          {badge}
        </Badge>
      </Flex>

      {children}
    </Box>
  );
}

export default ExpenseRequestCreatePage;
