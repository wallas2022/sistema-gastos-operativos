import { readUser } from '../../../navigation/navigation';
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  confirmOcrDocument,
  getDocumentById,
  processOcrDocument,
  updateOcrFields,
  updateOcrTotal,
  type OcrField,
  type OcrResultResponse,
} from "../services/documents.service";
import DocumentPreview from "../../../shared/components/DocumentPreview";
import { updateOcrLineItems } from "../services/documents.service";
import { OcrReviewPanel } from "../../ocr/components/OcrReviewPanel";
import { FiscalDecisionPanel } from "../../ocr/components/FiscalDecisionPanel";

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

type EditableLineItem = {
  id?: string;
  lineNumber?: number;
  article?: string | null;
  description?: string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  lineSubtotal?: number | string | null;
  lineTax?: number | string | null;
  lineTotal?: number | string | null;
  total?: number | string | null;
  taxIncluded?: boolean | null;
  confidence?: number | null;
};

function getLineItems(data: OcrResultResponse): EditableLineItem[] {
  const ocrResult = data.ocrResult as any;

  return (
    ocrResult?.extractedLineItems ??
    ocrResult?.lineItems ??
    ocrResult?.items ??
    []
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = readUser();
  const can = (permission: string) => user.role === 'ADMIN' || user.permissions?.includes(permission);
  const canProcess = can('OCR_PROCESS'), canCorrect = can('OCR_REVIEW'), canConfirm = can('OCR_CONFIRM');

  const [documentData, setDocumentData] = useState<OcrResultResponse | null>(null);
  const [editableFields, setEditableFields] = useState<OcrField[]>([]);
  const [editableItems, setEditableItems] = useState<EditableLineItem[]>([]);
  const [comment, setComment] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [manualTotal, setManualTotal] = useState("");
  const [manualTotalReason, setManualTotalReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingOcr, setProcessingOcr] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = async () => {
    if (!id) {
      navigate("/rendicion-conciliacion/ocr/documentos");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getDocumentById(id);
      setDocumentData(data);
      setEditableFields(data.ocrResult?.extractedFields ?? []);
      setEditableItems(getLineItems(data));
      setManualTotal(data.ocrResult?.totalAmount == null ? "" : String(data.ocrResult.totalAmount));
    } catch (error) {
      console.error("Error cargando detalle del documento:", error);
      setErrorMessage("No se pudo cargar el detalle del documento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTotal = async () => {
    if (!id || !manualTotal || !manualTotalReason.trim()) return;
    try {
      setSavingFields(true);
      setErrorMessage("");
      await updateOcrTotal(id, manualTotal, manualTotalReason.trim());
      await loadData();
      setManualTotalReason("");
      setSuccessMessage("Total corregido y auditado correctamente.");
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "No se pudo corregir el total.");
    } finally {
      setSavingFields(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const handleFieldChange = (fieldId: string, value: string) => {
    setEditableFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, finalValue: value } : field
      )
    );
  };

  const handleItemChange = (
    index: number,
    field: keyof EditableLineItem,
    value: string
  ) => {
    setEditableItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleAddItem = () => {
    setEditableItems((prev) => [
      ...prev,
      {
        lineNumber: prev.length + 1,
        article: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        lineSubtotal: null,
        lineTax: null,
        lineTotal: 0,
        taxIncluded: false,
        confidence: 0,
      },
    ]);
  };

  const handleDeleteItem = (index: number) => {
    const confirmDelete = window.confirm("¿Deseas eliminar esta línea del detalle?");
    if (!confirmDelete) return;

    setEditableItems((prev) =>
      prev
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({
          ...item,
          lineNumber: itemIndex + 1,
        }))
    );
  };

  const handleProcessOcr = async () => {
    if (!id) return;

    try {
      setProcessingOcr(true);
      setErrorMessage("");
      setSuccessMessage("");

      await processOcrDocument(id);
      await loadData();

      setSuccessMessage("OCR procesado correctamente.");
    } catch (error) {
      console.error("Error procesando OCR:", error);
      setErrorMessage("No se pudo procesar el OCR del documento.");
    } finally {
      setProcessingOcr(false);
    }
  };

 const handleSaveChanges = async () => {
  if (!id) return;

  try {
    setSavingFields(true);
    setErrorMessage("");
    setSuccessMessage("");

    // 1. Guardar campos OCR editados
  await updateOcrFields(
        id,
        editableFields.map((field) => ({
          id: field.id,
          fieldValue:
            field.finalValue ??
            field.normalizedValue ??
            field.detectedValue ??
            "",
          confidence:
            field.confidence === null || field.confidence === undefined
              ? null
              : Number(field.confidence),
          reason: correctionReason || undefined,
        }))
      );

    // 2. Guardar detalle de factura / items editados
    await updateOcrLineItems(
      id,
      editableItems.map((item, index) => ({
        id: item.id,
        lineNumber: index + 1,
        article: item.article ?? null,
        description: item.description ?? "",
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.unitPrice ?? 0),
        lineSubtotal:
          item.lineSubtotal === null || item.lineSubtotal === undefined
            ? null
            : Number(item.lineSubtotal),
        lineTax:
          item.lineTax === null || item.lineTax === undefined
            ? null
            : Number(item.lineTax),
        lineTotal: Number(item.lineTotal ?? item.total ?? 0),
        taxIncluded: item.taxIncluded ?? false,
        confidence: Number(item.confidence ?? 100),
      }))
    );

    setSuccessMessage("Campos y detalle de factura actualizados correctamente.");

    await loadData();
  } catch (error: any) {
    console.error("Error guardando cambios:", error);

    const backendMessage = error.response?.data?.message;
    const message = Array.isArray(backendMessage)
      ? backendMessage.join(". ")
      : backendMessage ?? "No se pudieron guardar los cambios.";

    setErrorMessage(message);
    alert(message);
  } finally {
    setSavingFields(false);
  }
};

  const handleConfirm = async () => {
    if (!id) return;

    try {
      setConfirming(true);
      setErrorMessage("");
      setSuccessMessage("");

      await confirmOcrDocument(id, comment);
      setSuccessMessage("Documento confirmado correctamente.");
      await loadData();
    } catch (error: any) {
      console.error("Error confirmando documento:", error);

      if (error.response) {
        console.error("STATUS:", error.response.status);
        console.error("DATA BACKEND:", error.response.data);
        console.error("MESSAGE:", error.response.data?.message);
      }

      const backendMessage = error.response?.data?.message;
      const message = Array.isArray(backendMessage)
        ? backendMessage.join(". ")
        : backendMessage ?? "No se pudo confirmar el documento";

      setErrorMessage(message);
      alert(message);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="7xl" py={10}>
        <Flex justify="center" py={12}>
          <Spinner size="lg" />
        </Flex>
      </Container>
    );
  }

  if (!documentData) {
    return (
      <Container maxW="7xl" py={10}>
        <Stack gap={4}>
          <Text>No se encontró el documento.</Text>
          <Button variant="outline" onClick={() => navigate("/rendicion-conciliacion/ocr/documentos")}>
            Volver
          </Button>
        </Stack>
      </Container>
    );
  }

  const hasOcrResult = !!documentData.ocrResult;
  const isConfirmed = documentData.status === "CONFIRMADO";

  return (
    <Container maxW="7xl" py={8}>
      <Stack gap={6}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="xl">Detalle del documento</Heading>
            <Text color="gray.600">{documentData.fileName}</Text>
          </Box>

          <Flex gap={3} wrap="wrap">
            <Button variant="outline" onClick={() => navigate("/rendicion-conciliacion/ocr/documentos")}>
              Volver
            </Button>

            {canProcess && <Button
              colorPalette="blue"
              onClick={handleProcessOcr}
              loading={processingOcr}
              disabled={documentData.status === "PROCESANDO"}
            >
              Procesar OCR
            </Button>}
          </Flex>
        </Flex>

        {errorMessage ? (
          <Box borderWidth="1px" borderColor="red.200" bg="red.50" p={4} borderRadius="xl">
            <Text color="red.700" fontWeight="semibold">
              {errorMessage}
            </Text>
          </Box>
        ) : null}

        {successMessage ? (
          <Box borderWidth="1px" borderColor="green.200" bg="green.50" p={4} borderRadius="xl">
            <Text color="green.700" fontWeight="semibold">
              {successMessage}
            </Text>
          </Box>
        ) : null}

        <Grid templateColumns={{ base: "1fr", xl: "1.2fr 1fr" }} gap={6}>
          <DocumentPreview
            documentId={documentData.id}
            mimeType={documentData.mimeType}
            fileName={documentData.fileName}
            height="700px"
          />

          <Stack gap={6}>
            {documentData.ocrResult && <FiscalDecisionPanel ocr={documentData.ocrResult}/>}
            <Box borderWidth="1px" borderRadius="2xl" bg="white" p={5}>
              <Heading size="md" mb={4}>
                Información general
              </Heading>
              <Stack gap={2}>
                <Text><b>Estado:</b> {documentData.status}</Text>
                <Text><b>Tipo MIME:</b> {documentData.mimeType}</Text>
                <Text><b>Tamaño:</b> {documentData.sizeBytes} bytes</Text>
                <Text><b>Fecha:</b> {new Date(documentData.createdAt).toLocaleString()}</Text>
              </Stack>
            </Box>

            <Box borderWidth="1px" borderRadius="2xl" bg="white" p={5}>
              <Heading size="md" mb={4}>
                Resultado OCR
              </Heading>

              {!hasOcrResult ? (
                <Text color="gray.500">
                  Aún no existe resultado OCR para este documento.
                </Text>
              ) : (
                <Stack gap={4}>
                  <Text><b>Estado OCR:</b> {formatValue(documentData.ocrResult?.processStatus)}</Text>
                  <Text><b>Confianza promedio:</b> {formatValue(documentData.ocrResult?.averageConfidence)}</Text>
                  <Text><b>País:</b> {formatValue(documentData.ocrResult?.countryDetected)}</Text>
                  <Text><b>Idioma:</b> {formatValue(documentData.ocrResult?.languageDetected)}</Text>
                  <Text><b>Tipo documento:</b> {formatValue(documentData.ocrResult?.documentTypeDetected)}</Text>
                  <Text><b>Moneda:</b> {formatValue(documentData.ocrResult?.currencyCode)}</Text>
                  <Text><b>Subtotal:</b> {formatValue(documentData.ocrResult?.subtotalAmount)}</Text>
                  <Text><b>Impuesto:</b> {formatValue(documentData.ocrResult?.taxAmount)}</Text>
                  <Text><b>Total:</b> {formatValue(documentData.ocrResult?.totalAmount)}</Text>
                  {canCorrect && !documentData.ocrResult?.usedInSettlement && <Flex gap={2} align="end" wrap="wrap"><Box><Text fontSize="sm">Corrección manual del total</Text><Input type="number" min="0.01" step="0.01" value={manualTotal} onChange={(event) => setManualTotal(event.target.value)} placeholder="0.00" /></Box><Box minW={{ base: '100%', md: '320px' }}><Text fontSize="sm">Motivo de la corrección</Text><Input value={manualTotalReason} onChange={(event) => setManualTotalReason(event.target.value)} placeholder="Ej. El OCR no detectó el total visible" /></Box><Button onClick={handleSaveTotal} loading={savingFields} disabled={!manualTotal || !manualTotalReason.trim()}>Guardar total</Button></Flex>}
                </Stack>
              )}
            </Box>

            <Box borderWidth="1px" borderRadius="2xl" bg="white" p={5}>
              <Heading size="md" mb={4}>
                Campos extraídos
              </Heading>

              {!hasOcrResult || editableFields.length === 0 ? (
                <Text color="gray.500">No hay campos OCR disponibles.</Text>
              ) : (
                <Stack gap={4}>
                  <OcrReviewPanel fields={editableFields} disabled={isConfirmed || !canCorrect} onChange={handleFieldChange}/>
                  <Input value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} placeholder="Motivo de la correccion (opcional)" disabled={isConfirmed || !canCorrect}/>
                {canCorrect && <Button
                  colorPalette="blue"
                  onClick={handleSaveChanges}
                  loading={savingFields}
                  disabled={isConfirmed || !canCorrect}
                >
                  Guardar cambios
                </Button>}
                </Stack>
              )}
            </Box>

            <Box borderWidth="1px" borderRadius="2xl" bg="white" p={5}>
              <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
                <Heading size="md">Detalle de factura</Heading>

                {canCorrect && <Button
                  size="sm"
                  colorPalette="blue"
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={isConfirmed || !canCorrect}
                >
                  Agregar línea
                </Button>}
              </Flex>

              {!hasOcrResult || editableItems.length === 0 ? (
                <Text color="gray.500">
                  No hay líneas de detalle detectadas para esta factura.
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Box
                    as="table"
                    width="100%"
                    borderWidth="1px"
                    borderRadius="xl"
                    overflow="hidden"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <Box as="thead" bg="gray.50">
                      <Box as="tr">
                        <Box as="th" p={3} textAlign="left" borderBottomWidth="1px">#</Box>
                        <Box as="th" p={3} textAlign="left" borderBottomWidth="1px">Descripción</Box>
                        <Box as="th" p={3} textAlign="left" borderBottomWidth="1px">Cantidad</Box>
                        <Box as="th" p={3} textAlign="left" borderBottomWidth="1px">Precio unitario</Box>
                        <Box as="th" p={3} textAlign="left" borderBottomWidth="1px">Total línea</Box>
                        <Box as="th" p={3} textAlign="left" borderBottomWidth="1px">Confianza</Box>
                        <Box as="th" p={3} textAlign="center" borderBottomWidth="1px">Acción</Box>
                      </Box>
                    </Box>

                    <Box as="tbody">
                      {editableItems.map((item, index) => {
                        const lineTotal = item.lineTotal ?? item.total ?? "";

                        return (
                          <Box as="tr" key={item.id ?? index}>
                            <Box as="td" p={3} borderBottomWidth="1px">
                              {item.lineNumber ?? index + 1}
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" minW="220px">
                              <Input
                                value={item.description ?? ""}
                                onChange={(e) =>
                                  handleItemChange(index, "description", e.target.value)
                                }
                                disabled={isConfirmed || !canCorrect}
                                placeholder="Descripción"
                              />
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" minW="110px">
                              <Input
                                value={item.quantity ?? ""}
                                onChange={(e) =>
                                  handleItemChange(index, "quantity", e.target.value)
                                }
                                disabled={isConfirmed || !canCorrect}
                                placeholder="Cantidad"
                              />
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" minW="130px">
                              <Input
                                value={item.unitPrice ?? ""}
                                onChange={(e) =>
                                  handleItemChange(index, "unitPrice", e.target.value)
                                }
                                disabled={isConfirmed || !canCorrect}
                                placeholder="Precio"
                              />
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" minW="130px">
                              <Input
                                value={lineTotal}
                                onChange={(e) =>
                                  handleItemChange(index, "lineTotal", e.target.value)
                                }
                                disabled={isConfirmed || !canCorrect}
                                placeholder="Total"
                              />
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px">
                              {formatValue(item.confidence)}
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" textAlign="center">
                              {canCorrect && <Button
                                size="sm"
                                colorPalette="red"
                                variant="outline"
                                onClick={() => handleDeleteItem(index)}
                                disabled={isConfirmed || !canCorrect}
                              >
                                Eliminar
                              </Button>}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            <Box borderWidth="1px" borderRadius="2xl" bg="white" p={5}>
              <Heading size="md" mb={4}>
                Confirmación
              </Heading>

              <Stack gap={4}>
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Observaciones de confirmación"
                  disabled={isConfirmed || !canCorrect}
                />

                {canConfirm && <Button
                  colorPalette="green"
                  onClick={handleConfirm}
                  loading={confirming}
                  disabled={!hasOcrResult || isConfirmed}
                >
                  Confirmar documento
                </Button>}
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Stack>
    </Container>
  );
}
