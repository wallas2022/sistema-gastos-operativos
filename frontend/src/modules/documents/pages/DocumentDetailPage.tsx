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
  type OcrField,
  type OcrResultResponse,
} from "../services/documents.service";
import DocumentPreview from "../../../shared/components/DocumentPreview";

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

  const [documentData, setDocumentData] = useState<OcrResultResponse | null>(null);
  const [editableFields, setEditableFields] = useState<OcrField[]>([]);
  const [editableItems, setEditableItems] = useState<EditableLineItem[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingOcr, setProcessingOcr] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = async () => {
    if (!id) {
      navigate("/documents");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getDocumentById(id);
      setDocumentData(data);
      setEditableFields(data.ocrResult?.extractedFields ?? []);
      setEditableItems(getLineItems(data));
    } catch (error) {
      console.error("Error cargando detalle del documento:", error);
      setErrorMessage("No se pudo cargar el detalle del documento.");
    } finally {
      setLoading(false);
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

  const handleSaveFields = async () => {
    if (!id) return;

    try {
      setSavingFields(true);
      setErrorMessage("");
      setSuccessMessage("");

      await updateOcrFields(
        id,
        editableFields.map((field) => ({
          id: field.id,
          fieldValue: field.finalValue ?? "",
          confidence:
            field.confidence === null || field.confidence === undefined
              ? null
              : Number(field.confidence),
        }))
      );

      setSuccessMessage("Campos OCR actualizados correctamente.");
      await loadData();
    } catch (error) {
      console.error("Error guardando campos:", error);
      setErrorMessage("No se pudieron guardar los cambios.");
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
          <Button variant="outline" onClick={() => navigate("/documents")}>
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
            <Button variant="outline" onClick={() => navigate("/documents")}>
              Volver
            </Button>

            <Button
              colorPalette="blue"
              onClick={handleProcessOcr}
              loading={processingOcr}
              disabled={documentData.status === "PROCESANDO"}
            >
              Procesar OCR
            </Button>
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
                  {editableFields.map((field) => (
                    <Box key={field.id} borderWidth="1px" borderRadius="xl" p={4}>
                      <Stack gap={2}>
                        <Text fontWeight="bold">
                          {field.rawLabel || field.fieldName}
                        </Text>

                        <Text fontSize="sm" color="gray.500">
                          Detectado: {formatValue(field.detectedValue)}
                        </Text>

                        <Input
                          value={field.finalValue ?? ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder="Valor final"
                          disabled={isConfirmed}
                        />
                      </Stack>
                    </Box>
                  ))}

                  <Button
                    colorPalette="blue"
                    onClick={handleSaveFields}
                    loading={savingFields}
                    disabled={isConfirmed}
                  >
                    Guardar cambios
                  </Button>
                </Stack>
              )}
            </Box>

            <Box borderWidth="1px" borderRadius="2xl" bg="white" p={5}>
              <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
                <Heading size="md">Detalle de factura</Heading>

                <Button
                  size="sm"
                  colorPalette="blue"
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={isConfirmed}
                >
                  Agregar línea
                </Button>
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
                                disabled={isConfirmed}
                                placeholder="Descripción"
                              />
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" minW="110px">
                              <Input
                                value={item.quantity ?? ""}
                                onChange={(e) =>
                                  handleItemChange(index, "quantity", e.target.value)
                                }
                                disabled={isConfirmed}
                                placeholder="Cantidad"
                              />
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" minW="130px">
                              <Input
                                value={item.unitPrice ?? ""}
                                onChange={(e) =>
                                  handleItemChange(index, "unitPrice", e.target.value)
                                }
                                disabled={isConfirmed}
                                placeholder="Precio"
                              />
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" minW="130px">
                              <Input
                                value={lineTotal}
                                onChange={(e) =>
                                  handleItemChange(index, "lineTotal", e.target.value)
                                }
                                disabled={isConfirmed}
                                placeholder="Total"
                              />
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px">
                              {formatValue(item.confidence)}
                            </Box>

                            <Box as="td" p={3} borderBottomWidth="1px" textAlign="center">
                              <Button
                                size="sm"
                                colorPalette="red"
                                variant="outline"
                                onClick={() => handleDeleteItem(index)}
                                disabled={isConfirmed}
                              >
                                Eliminar
                              </Button>
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
                  disabled={isConfirmed}
                />

                <Button
                  colorPalette="green"
                  onClick={handleConfirm}
                  loading={confirming}
                  disabled={!hasOcrResult || isConfirmed}
                >
                  Confirmar documento
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Stack>
    </Container>
  );
}
