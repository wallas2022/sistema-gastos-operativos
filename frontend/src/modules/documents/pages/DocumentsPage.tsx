import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
  Table,
} from "@chakra-ui/react";
import {
  getDocuments,
  processOcrDocument,
  uploadDocument,
  type DocumentItem,
} from "../services/documents.service";
import DocumentCard from "../../../shared/components/DocumentCard";
import { logout } from "../../../utils/auth";

type ViewMode = "cards" | "table";

const STATUS_OPTIONS = [
  "ALL",
  "CARGADO",
  "PROCESANDO",
  "PROCESADO",
  "PENDIENTE_REVISION",
  "CONFIRMADO",
  "ERROR_OCR",
];



export default function DocumentsPage() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los documentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async () => {
    try {
      if (!selectedFile) {
        setError("Selecciona un archivo primero.");
        return;
      }

      setUploading(true);
      setError("");
      setSuccessMessage("");

      await uploadDocument(selectedFile);

      setSuccessMessage("Documento cargado correctamente.");
      setSelectedFile(null);

      const input = document.getElementById("file-input") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }

      await loadDocuments();
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el documento.");
    } finally {
      setUploading(false);
    }
  };

  const handleProcessOcr = async (documentId: string) => {
    try {
      setProcessingId(documentId);
      setError("");
      setSuccessMessage("");

      await processOcrDocument(documentId);

      setSuccessMessage("OCR procesado correctamente.");
      await loadDocuments();
    } catch (err) {
      console.error("Error procesando OCR", err);
      setError("No se pudo procesar el OCR del documento.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const handleViewDetail = (id: string) => {
    navigate(`/documents/${id}`);
  };

  const canProcessOcr = (status: string) => {
    return status === "CARGADO" || status === "ERROR_OCR";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMADO":
        return "green";
      case "PENDIENTE_REVISION":
        return "orange";
      case "PROCESADO":
        return "blue";
      case "PROCESANDO":
        return "purple";
      case "ERROR_OCR":
        return "red";
      case "CARGADO":
      default:
        return "gray";
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((item) => {
      const text = search.trim().toLowerCase();

      const matchesSearch =
        text === "" ||
        item.fileName.toLowerCase().includes(text) ||
        item.mimeType.toLowerCase().includes(text) ||
        item.status.toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  return (
    <Box p={{ base: 4, md: 8 }}>
      <Stack gap={6}>
       <Flex
  justify="space-between"
  align="center"
  gap={4}
  direction={{ base: "column", md: "row" }}
>
  <Box>
    <Heading size="xl">Documentos</Heading>
    <Text color="gray.600" mt={2}>
      Carga, procesa y revisa documentos OCR.
    </Text>
  </Box>

  <Button
    size="sm"
    colorPalette="red"
    variant="solid"
    alignSelf={{ base: "flex-end", md: "center" }}
    minW="90px"
    onClick={() => {
      const confirmar = window.confirm("¿Deseas cerrar sesión?");
      if (confirmar) {
        logout();
      }
    }}
  >
    Salir
  </Button>
</Flex>

        {error ? (
          <Box bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl" p={4}>
            <Text color="red.600">{error}</Text>
          </Box>
        ) : null}

        {successMessage ? (
          <Box bg="green.50" borderWidth="1px" borderColor="green.200" borderRadius="xl" p={4}>
            <Text color="green.700">{successMessage}</Text>
          </Box>
        ) : null}

        <Box bg="white" borderWidth="1px" borderRadius="2xl" p={6}>
          <Stack gap={4}>
            <Heading size="lg">Cargar documento</Heading>

            <Flex gap={3} direction={{ base: "column", md: "row" }}>
              <Input
                id="file-input"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                }}
              />

              <Button
                colorPalette="blue"
                onClick={handleUpload}
                loading={uploading}
                minW={{ md: "180px" }}
              >
                Subir archivo
              </Button>
            </Flex>

            {selectedFile ? (
              <Text fontSize="sm" color="gray.600">
                Archivo seleccionado: {selectedFile.name}
              </Text>
            ) : null}
          </Stack>
        </Box>

        <Box bg="white" borderWidth="1px" borderRadius="2xl" p={6}>
          <Stack gap={5}>
            <Flex
              justify="space-between"
              align={{ base: "stretch", lg: "center" }}
              direction={{ base: "column", lg: "row" }}
              gap={4}
            >
              <Heading size="lg">Listado de documentos</Heading>

              <HStack gap={2} flexWrap="wrap">
                <Button
                  variant={viewMode === "cards" ? "solid" : "outline"}
                  colorPalette="blue"
                  onClick={() => setViewMode("cards")}
                >
                  Fichas
                </Button>

                <Button
                  variant={viewMode === "table" ? "solid" : "outline"}
                  colorPalette="blue"
                  onClick={() => setViewMode("table")}
                >
                  Tabla
                </Button>
              </HStack>
            </Flex>

            <Flex gap={3} wrap="wrap" align="center">
              <Input
                placeholder="Buscar por nombre, estado o tipo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxW={{ base: "100%", md: "280px" }}
              />

              <HStack gap={2} flexWrap="wrap">
                {STATUS_OPTIONS.map((status) => {
                  const isActive = statusFilter === status;
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant={isActive ? "solid" : "outline"}
                      colorPalette={isActive ? "blue" : "gray"}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === "ALL" ? "Todos" : status}
                    </Button>
                  );
                })}
              </HStack>

              <Button variant="ghost" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            </Flex>

            <Text fontSize="sm" color="gray.600">
              Mostrando {filteredDocuments.length} de {documents.length} documentos
            </Text>

            {loading ? (
              <Flex justify="center" py={10}>
                <Spinner size="lg" />
              </Flex>
            ) : filteredDocuments.length === 0 ? (
              <Box borderWidth="1px" borderRadius="xl" p={6} bg="gray.50">
                <Text color="gray.600">No se encontraron documentos.</Text>
              </Box>
            ) : viewMode === "cards" ? (
            <Stack gap={4}>
                    {filteredDocuments.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        id={doc.id}
                        fileName={doc.fileName}
                        status={doc.status}
                        mimeType={doc.mimeType}
                        sizeBytes={doc.sizeBytes}
                        createdAt={doc.createdAt}
                        onViewDetail={handleViewDetail}
                        onProcessOcr={handleProcessOcr}
                        canProcessOcr={canProcessOcr(doc.status)}
                        processing={processingId === doc.id}
                      />
                    ))}
                  </Stack>
            ) : (
              <Box overflowX="auto" borderWidth="1px" borderRadius="xl">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Archivo</Table.ColumnHeader>
                      <Table.ColumnHeader>Tipo</Table.ColumnHeader>
                      <Table.ColumnHeader>Estado</Table.ColumnHeader>
                      <Table.ColumnHeader>Tamaño</Table.ColumnHeader>
                      <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right">Acciones</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {filteredDocuments.map((doc) => (
                      <Table.Row key={doc.id}>
                        <Table.Cell>{doc.fileName}</Table.Cell>
                        <Table.Cell>{doc.mimeType}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>{doc.sizeBytes} bytes</Table.Cell>
                        <Table.Cell>
                          {new Date(doc.createdAt).toLocaleString()}
                        </Table.Cell>
                        <Table.Cell>
                          <Flex justify="flex-end" gap={2} wrap="wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetail(doc.id)}
                            >
                              Ver detalle
                            </Button>

                            <Button
                              size="sm"
                              colorPalette="blue"
                              onClick={() => handleProcessOcr(doc.id)}
                              loading={processingId === doc.id}
                              disabled={!canProcessOcr(doc.status)}
                            >
                              Procesar OCR
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Stack>
        </Box>

        {viewMode === "cards" && filteredDocuments.length > 0 ? (
          <Box>
            <Text fontSize="sm" color="gray.500">
              En vista ficha, el procesamiento OCR se hace desde el detalle.
            </Text>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}