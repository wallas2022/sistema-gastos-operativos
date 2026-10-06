import { useEffect, useState } from "react";
import type { ElementType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClipboardList,
  FileText,
  Paperclip,
  Pencil,
} from "lucide-react";

import {
  ExpenseRequest,
  associateExpenseRequestDocuments,
  cancelExpenseRequest,
  getExpenseRequestById,
  submitExpenseRequest,
  resubmitExpenseRequest
} from "../../services/expenseRequests.service";
import {
  getDocuments,
  type DocumentItem,
} from "../../modules/documents/services/documents.service";
import { getBudgetEvaluation } from "../../services/budget.service";

export default function ExpenseRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ExpenseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [budget, setBudget] = useState<any>(null);

  const loadRequest = async () => {
    if (!id) {
      setErrorMessage("No se encontró el identificador de la solicitud.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getExpenseRequestById(id);
      setRequest(data);
      getBudgetEvaluation(id).then(setBudget).catch(() => setBudget(null));
      setSelectedDocumentIds((data.documents || []).map((document) => document.id));

      if (data.status === "BORRADOR") {
        const documentResponse = await getDocuments(1, 100);
        setAvailableDocuments(documentResponse.data || []);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudo cargar el detalle de la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  if (loading) {
    return (
      <Box p="8">
        <HStack justify="center" py="16">
          <Spinner />
          <Text>Cargando detalle de solicitud...</Text>
        </HStack>
      </Box>
    );
  }

  if (errorMessage) {
    return (
      <Box p="8">
        <Box
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          rounded="xl"
          p="5"
        >
          <Text color="red.600" fontWeight="semibold">
            {errorMessage}
          </Text>

          <Button mt="4" onClick={() => navigate("/solicitudes-gastos")}>
            Volver al listado
          </Button>
        </Box>
      </Box>
    );
  }

  if (!request) {
    return (
      <Box p="8">
        <Text>No se encontró la solicitud.</Text>
        <Button mt="4" onClick={() => navigate("/solicitudes-gastos")}>
          Volver al listado
        </Button>
      </Box>
    );
  }

  const items = request.items ?? [];
  const validations = request.validations ?? [];
  const handleSubmitToApproval = async () => {
  if (!request) return;

  if (request.status !== "BORRADOR") {
    alert("Solo las solicitudes en estado borrador pueden enviarse a autorización.");
    return;
  }

  const confirmSubmit = window.confirm(
    "¿Deseas enviar esta solicitud a autorización?"
  );

  if (!confirmSubmit) return;

  try {
    setSubmitting(true);

    const updatedRequest = await submitExpenseRequest(request.id);

    setRequest(updatedRequest);

    alert("Solicitud enviada a autorización correctamente.");
  } catch (error) {
    console.error(error);
    alert("No se pudo enviar la solicitud a autorización.");
  } finally {
    setSubmitting(false);
  }
  };

  const handleResubmit = async () => {
    if (!request || request.status !== 'OBSERVADA') return;
    if (!window.confirm('¿Deseas reenviar esta solicitud después de corregirla?')) return;
    try { setSubmitting(true); setRequest(await resubmitExpenseRequest(request.id)); alert('Solicitud reenviada a autorización correctamente.'); }
    catch (error) { console.error(error); alert('No se pudo reenviar la solicitud.'); }
    finally { setSubmitting(false); }
  };

  const handleCancelRequest = async () => {
    if (request.status !== "BORRADOR") return;
    if (!window.confirm("¿Deseas cancelar esta solicitud? Esta acción no la elimina.")) {
      return;
    }

    try {
      setCancelling(true);
      setRequest(await cancelExpenseRequest(request.id));
      alert("Solicitud cancelada correctamente.");
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "No se pudo cancelar la solicitud.");
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveDocuments = async () => {
    try {
      setSavingDocuments(true);
      setRequest(
        await associateExpenseRequestDocuments(request.id, selectedDocumentIds)
      );
      alert("Documentos asociados correctamente.");
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "No se pudieron asociar los documentos seleccionados."
      );
    } finally {
      setSavingDocuments(false);
    }
  };

  const toggleDocument = (documentId: string) => {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId]
    );
  };

  return (
    <VStack align="stretch" gap="6" p="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <Button
            size="sm"
            variant="ghost"
            mb="3"
            onClick={() => navigate("/solicitudes-gastos")}
          >
            <ArrowLeft size={16} />
            Volver
          </Button>

          <HStack mb="1">
            <Heading size="lg">Detalle de Solicitud</Heading>
            <StatusBadge status={request.status} />
          </HStack>

          <Text color="gray.500">
            Expediente {request.id} · Seguimiento completo de la solicitud antes
            de ejecución.
          </Text>
        </Box>

        <HStack flexWrap="wrap">
          {request.status === "BORRADOR" ? (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/solicitudes-gastos/nueva?edit=${request.id}`)
                }
              >
                <Pencil size={18} />
                Editar
              </Button>
              <Button
                colorPalette="red"
                variant="outline"
                loading={cancelling}
                onClick={handleCancelRequest}
              >
                <Ban size={18} />
                Cancelar solicitud
              </Button>
              <Button
                colorPalette="blue"
                loading={submitting}
                onClick={handleSubmitToApproval}
              >
                <CheckCircle2 size={18} />
                Enviar a autorización
              </Button>
            </>
          ) : request.status === "OBSERVADA" ? (
            <Button colorPalette="blue" loading={submitting} onClick={handleResubmit}>
              <CheckCircle2 size={18} />
              Reenviar a autorización
            </Button>
          ) : (
            <Badge colorPalette="blue" p="2" rounded="md">
              {formatStatus(request.status)}
            </Badge>
          )}
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
              <InfoItem label="Código" value={request.code} />
              <InfoItem label="Fecha" value={formatDate(request.createdAt)} />
              <InfoItem label="Solicitante" value={request.requesterName} />
              <InfoItem label="Rol" value={request.requesterRole} />
              <InfoItem label="Tipo de gasto" value={formatType(request.type)} />
              <InfoItem label="Prioridad" value={formatPriority(request.priority)} />
              <InfoItem label="Empresa" value={request.companyName} />
              <InfoItem label="Moneda de origen" value={`${request.currencySymbol || ""} ${request.originalCurrencyCode || request.currency}`} />
              <InfoItem label="Centro de costo" value={request.costCenter} />
              <InfoItem
                label="Cuenta presupuestaria"
                value={request.budgetAccount}
              />
              <InfoItem
                label="Importe original"
                value={formatMoney(request.originalCurrencyCode || request.currency, request.originalAmount ?? request.estimatedAmount)}
              />
              <InfoItem label="Tasa aplicada" value={Number(request.exchangeRate || 1).toLocaleString('es-GT', { maximumFractionDigits: 10 })} />
              <InfoItem label="Importe presupuestario" value={request.budgetAmount == null ? 'Pendiente' : formatMoney(request.budgetCurrencyCode || request.currency, request.budgetAmount)} />
              <InfoItem label="Destino" value={request.destination || "No aplica"} />
              <InfoItem
                label="Días"
                value={request.days ? String(request.days) : "No aplica"}
              />
            </Grid>

            <Box mt="5">
              <Text fontSize="sm" color="gray.500">
                Concepto
              </Text>
              <Text fontWeight="semibold">{request.concept}</Text>
            </Box>

            <Box mt="4">
              <Text fontSize="sm" color="gray.500">
                Justificación
              </Text>
              <Text fontWeight="semibold">{request.justification}</Text>
            </Box>
          </Box>
          {budget && <Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p="5"><Flex justify="space-between" align="center" mb="4"><Box><Heading size="md">Disponibilidad presupuestaria</Heading><Text fontSize="sm" color="gray.500">{request.budgetLine?.businessUnit} · {request.budgetLine?.area} · Versión {request.budgetLine?.version?.fiscalYear}.{request.budgetLine?.version?.versionNumber} · Mes {request.budgetPeriod?.month}</Text></Box><Badge colorPalette={budget.status === "AVAILABLE" ? "green" : budget.status === "PARTIAL" ? "orange" : "red"}>{budget.status}</Badge></Flex><Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4,1fr)" }} gap="4"><InfoItem label="Anual aprobado" value={formatMoney(budget.detail.currency, budget.approved)} /><InfoItem label="Anual comprometido" value={formatMoney(budget.detail.currency, budget.reserved)} /><InfoItem label="Anual ejecutado" value={formatMoney(budget.detail.currency, budget.executed)} /><InfoItem label="Anual disponible" value={formatMoney(budget.detail.currency, budget.available)} /><InfoItem label="Mensual aprobado" value={formatMoney(budget.detail.currency, budget.monthlyApproved)} /><InfoItem label="Mensual comprometido" value={formatMoney(budget.detail.currency, budget.monthlyCommitted)} /><InfoItem label="Mensual ejecutado" value={formatMoney(budget.detail.currency, budget.monthlyExecuted)} /><InfoItem label="Mensual disponible" value={formatMoney(budget.detail.currency, budget.monthlyAvailable)} /></Grid><Text mt="4" color="gray.600">{budget.message}</Text></Box>}
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <HStack mb="1">
              <Paperclip size={19} />
              <Heading size="md">Documentos asociados</Heading>
            </HStack>
            <Text fontSize="sm" color="gray.500" mb="4">
              Los comprobantes OCR se incorporan desde la liquidación. Aquí sólo se conservan documentos técnicos o asociaciones históricas.
            </Text>

            {request.status === "BORRADOR" && availableDocuments.length > 0 && (
              <VStack align="stretch" gap="2" mb="4">
                {availableDocuments
                  .filter(
                    (document) =>
                      !document.ocrResult && (
                        !document.expenseRequestId ||
                        document.expenseRequestId === request.id
                      )
                  )
                  .map((document) => (
                    <Flex
                      key={document.id}
                      align="center"
                      gap="3"
                      border="1px solid"
                      borderColor="gray.100"
                      rounded="lg"
                      p="3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocumentIds.includes(document.id)}
                        onChange={() => toggleDocument(document.id)}
                      />
                      <Box flex="1">
                        <Text fontWeight="semibold">{document.fileName}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {document.status} · {formatFileSize(document.sizeBytes)}
                        </Text>
                      </Box>
                    </Flex>
                  ))}

                <Button
                  alignSelf="flex-start"
                  size="sm"
                  colorPalette="blue"
                  loading={savingDocuments}
                  onClick={handleSaveDocuments}
                >
                  Guardar asociaciones
                </Button>
              </VStack>
            )}

            {(request.documents || []).length === 0 ? (
              <Text color="gray.500">No hay documentos asociados.</Text>
            ) : (
              <VStack align="stretch" gap="2">
                {(request.documents || []).map((document) => (
                  <Flex key={document.id} justify="space-between" gap="3">
                    <Text>{document.fileName}</Text>
                    <Badge>{document.status}</Badge>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
            <RequestTypeDetail request={request} />
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
                  Detalle de los rubros asociados a la solicitud.
                </Text>
              </Box>

              <Badge colorPalette="blue">{items.length} ítems</Badge>
            </Flex>

            {items.length === 0 ? (
              <Box
                border="1px solid"
                borderColor="gray.100"
                rounded="xl"
                p="4"
                bg="gray.50"
              >
                <Text color="gray.500">
                  Esta solicitud no tiene ítems registrados.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" gap="3">
                {items.map((item) => (
                  <Flex
                    key={item.id}
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
                      <Text fontSize="sm" color="gray.500" mt="1">
                        {item.description}
                      </Text>
                      <Text fontSize="sm" color="gray.500" mt="1">
                        Cantidad: {item.quantity} · Monto unitario:{" "}
                        {formatMoney(request.currency, item.unitAmount)}
                      </Text>
                    </Box>

                    <HStack>
                      <PolicyBadge status={item.policyStatus} />
                      <Text fontWeight="bold">
                        {formatMoney(request.currency, item.totalAmount)}
                      </Text>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            )}
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
            <Heading size="md">Estado del expediente</Heading>
            <Text fontSize="sm" color="gray.500" mt="1" mb="5">
              Resumen de avance antes de la ejecución del gasto.
            </Text>

            {validations.length === 0 ? (
              <Box
                border="1px solid"
                borderColor="gray.100"
                rounded="xl"
                p="4"
                bg="gray.50"
              >
                <Text color="gray.500">
                  No hay validaciones registradas para esta solicitud.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" gap="3">
                {validations.map((validation) => (
                  <ValidationItem
                    key={validation.id}
                    title={formatValidationType(validation.type)}
                    description={validation.message}
                    status={validation.status}
                  />
                ))}
              </VStack>
            )}
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Heading size="md">Trazabilidad</Heading>
            <Text fontSize="sm" color="gray.500" mt="1" mb="5">
              Historial de eventos de la solicitud.
            </Text>

            <VStack align="stretch" gap="4">
              {(request.traces || []).map((trace) => (
                <TimelineItem
                  key={trace.id}
                  icon={FileText}
                  title={formatTraceEvent(trace.event)}
                  description={trace.description}
                  date={formatDateTime(trace.createdAt)}
                  status={trace.toStatus ? formatStatus(trace.toStatus) : "Registrado"}
                  color={
                    trace.toStatus === "CANCELADA" ||
                    trace.toStatus === "RECHAZADA"
                      ? "red"
                      : "blue"
                  }
                />
              ))}
            </VStack>
          </Box>
        </VStack>
      </Grid>
    </VStack>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <Box>
      <Text fontSize="sm" color="gray.500">
        {label}
      </Text>
      <Text fontWeight="semibold">{value || "No registrado"}</Text>
    </Box>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);

  return <Badge colorPalette={color}>{formatStatus(status)}</Badge>;
}

function PolicyBadge({ status }: { status: string }) {
  const color =
    status === "APROBADO" || status === "DENTRO_POLITICA"
      ? "green"
      : status === "RECHAZADO" || status === "FUERA_POLITICA"
      ? "red"
      : "yellow";

  const label =
    status === "APROBADO" || status === "DENTRO_POLITICA"
      ? "Dentro de política"
      : status === "RECHAZADO" || status === "FUERA_POLITICA"
      ? "Fuera de política"
      : "Pendiente";

  return <Badge colorPalette={color}>{label}</Badge>;
}

function ValidationItem({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  const color =
    status === "APROBADO" || status === "COMPLETADO"
      ? "green"
      : status === "RECHAZADO"
      ? "red"
      : "yellow";

  return (
    <Flex
      justify="space-between"
      align="start"
      gap="3"
      border="1px solid"
      borderColor="gray.100"
      rounded="xl"
      p="4"
    >
      <Box>
        <Text fontWeight="semibold">{title}</Text>
        <Text fontSize="sm" color="gray.500" mt="1">
          {description}
        </Text>
      </Box>

      <Badge colorPalette={color}>{formatStatus(status)}</Badge>
    </Flex>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  description,
  date,
  status,
  color,
}: {
  icon: ElementType;
  title: string;
  description: string;
  date: string;
  status: string;
  color: string;
}) {
  return (
    <Flex justify="space-between" align="start" gap="4">
      <HStack align="start" gap="3">
        <Box
          w="34px"
          h="34px"
          rounded="lg"
          bg={`${color}.50`}
          color={`${color}.600`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Icon size={18} />
        </Box>

        <Box>
          <Text fontWeight="semibold">{title}</Text>
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
          <Text fontSize="xs" color="gray.400" mt="1">
            {date}
          </Text>
        </Box>
      </HStack>

      <Badge colorPalette={color}>{status}</Badge>
    </Flex>

    
  );
}

function RequestTypeDetail({ request }: { request: ExpenseRequest }) {
  if (request.type === "GASTO_VIAJE") {
    return (
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="2xl"
        p="5"
      >
        <Heading size="md">Detalle de viaje / viáticos</Heading>

        <Text fontSize="sm" color="gray.500" mt="1" mb="4">
          Información específica relacionada con la solicitud de viaje.
        </Text>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
          <InfoItem label="Destino" value={request.destination || "No aplica"} />

          <InfoItem
            label="Días estimados"
            value={request.days ? `${request.days} día(s)` : "No registrado"}
          />

          <InfoItem
            label="Política aplicada"
            value={`Viáticos según rol: ${request.requesterRole}`}
          />

          <InfoItem
            label="Naturaleza del gasto"
            value="Alimentación, hospedaje y transporte"
          />
        </Grid>
      </Box>
    );
  }

  if (request.type === "PAGO_PROVEEDOR") {
    const providerInfo = extractProviderInfo(
      request.description || request.justification
    );

    return (
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="2xl"
        p="5"
      >
        <Heading size="md">Detalle de pago a proveedor</Heading>

        <Text fontSize="sm" color="gray.500" mt="1" mb="4">
          Información específica relacionada con el pago de facturas, servicios
          o proveedores.
        </Text>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
          <InfoItem label="Proveedor" value={providerInfo.providerName} />
          <InfoItem label="NIT" value={providerInfo.nit} />
          <InfoItem label="Rubro del pago" value={request.concept} />

          <InfoItem
            label="Cuenta presupuestaria"
            value={request.budgetAccount}
          />

          <InfoItem
            label="Naturaleza del gasto"
            value="Pago de servicios o facturas de proveedor"
          />

          <InfoItem label="Destino" value="No aplica" />
        </Grid>
      </Box>
    );
  }

  if (request.type === "COMPRA_INSUMO") {
    const firstItem = request.items?.[0];

    return (
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="2xl"
        p="5"
      >
        <Heading size="md">Detalle de compra de insumos</Heading>

        <Text fontSize="sm" color="gray.500" mt="1" mb="4">
          Información específica relacionada con ítems o insumos provenientes de
          catálogo ERP.
        </Text>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
          <InfoItem label="Ítem solicitado" value={firstItem?.name} />

          <InfoItem
            label="Descripción del ítem"
            value={firstItem?.description}
          />

          <InfoItem
            label="Cantidad solicitada"
            value={firstItem?.quantity}
          />

          <InfoItem
            label="Monto unitario estimado"
            value={
              firstItem
                ? formatMoney(request.currency, firstItem.unitAmount)
                : "No registrado"
            }
          />

          <InfoItem
            label="Cuenta presupuestaria"
            value={request.budgetAccount}
          />

          <InfoItem
            label="Naturaleza del gasto"
            value="Compra de materiales, útiles o suministros"
          />
        </Grid>
      </Box>
    );
  }

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="2xl"
      p="5"
    >
      <Heading size="md">Detalle del tipo de gasto</Heading>

      <Text fontSize="sm" color="gray.500" mt="1">
        No existe una vista especializada para este tipo de gasto.
      </Text>
    </Box>
  );
}

function extractProviderInfo(description?: string | null) {
  if (!description) {
    return {
      providerName: "No registrado",
      nit: "No registrado",
    };
  }

  const providerMatch = description.match(/proveedor\s(.+?)\.\sNIT/i);
  const nitMatch = description.match(/NIT:\s([^\.]+)/i);

  return {
    providerName: providerMatch?.[1] || "No registrado",
    nit: nitMatch?.[1] || "No registrado",
  };
}

function getStatusColor(status: string) {
  switch (status) {
    case "BORRADOR":
      return "gray";
    case "ENVIADA":
      return "blue";
    case "EN_REVISION":
      return "orange";
    case "APROBADA":
      return "green";
    case "RECHAZADA":
      return "red";
    case "CANCELADA":
      return "red";
    case "ANULADA":
      return "purple";
    default:
      return "yellow";
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "BORRADOR":
      return "Borrador";
    case "ENVIADA":
      return "Enviada";
    case "EN_REVISION":
      return "En revisión";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    case "CANCELADA":
      return "Cancelada";
    case "ANULADA":
      return "Anulada";
    case "APROBADO":
      return "Aprobado";
    case "RECHAZADO":
      return "Rechazado";
    case "PENDIENTE":
      return "Pendiente";
    case "COMPLETADO":
      return "Completado";
    default:
      return status;
  }
}

function formatType(type: string) {
  switch (type) {
    case "GASTO_VIAJE":
      return "Gasto de viaje / viáticos";
    case "COMPRA":
      return "Compra";
    case "SERVICIO":
      return "Servicio";
    case "REEMBOLSO":
      return "Reembolso";
    default:
      return type;
  }
}

function formatPriority(priority: string) {
  switch (priority) {
    case "NORMAL":
      return "Normal";
    case "ALTA":
      return "Alta";
    case "URGENTE":
      return "Urgente";
    case "BAJA":
      return "Baja";
    default:
      return priority;
  }
}

function formatValidationType(type: string) {
  switch (type) {
    case "POLITICA":
      return "Política";
    case "PRESUPUESTO":
      return "Presupuesto";
    case "AUTORIZACION":
      return "Autorización";
    default:
      return type;
  }
}

function formatTraceEvent(event: string) {
  const labels: Record<string, string> = {
    SOLICITUD_CREADA: "Solicitud creada",
    SOLICITUD_EDITADA: "Solicitud editada",
    SOLICITUD_ENVIADA_AUTORIZACION: "Solicitud enviada",
    SOLICITUD_CANCELADA: "Solicitud cancelada",
    SOLICITUD_APROBADA: "Solicitud aprobada",
    SOLICITUD_RECHAZADA: "Solicitud rechazada",
    SOLICITUD_OBSERVADA: "Solicitud observada",
  };

  return labels[event] || event.replace(/_/g, " ");
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${Number(amount || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date?: string | null) {
  if (!date) return "No registrada";

  return new Date(date).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "No registrada";

  return new Date(date).toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

