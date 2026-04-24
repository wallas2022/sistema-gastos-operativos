import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Image,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { getDocumentFileBlob } from "../../modules/documents/services/documents.service";

interface DocumentPreviewProps {
  documentId: string;
  mimeType?: string | null;
  fileName?: string | null;
  height?: string;
}

export default function DocumentPreview({
  documentId,
  mimeType,
  fileName,
  height = "700px",
}: DocumentPreviewProps) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let objectUrl = "";

    const loadFile = async () => {
      try {
        setLoading(true);
        setError("");

        const blob = await getDocumentFileBlob(documentId);
        objectUrl = URL.createObjectURL(blob);
        setFileUrl(objectUrl);
      } catch (err) {
        console.error("Error cargando vista previa:", err);
        setError("No se pudo cargar la vista previa del archivo.");
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadFile();
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [documentId]);

  const isImage =
    mimeType?.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|gif)$/i.test(fileName || "");

  const isPdf =
    mimeType === "application/pdf" || /\.pdf$/i.test(fileName || "");

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  if (loading) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="2xl"
        bg="white"
        minH={height}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap={3}>
          <Spinner size="lg" />
          <Text>Cargando vista previa...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="2xl"
        bg="red.50"
        color="red.600"
        minH={height}
        p={5}
      >
        <Text>{error}</Text>
      </Box>
    );
  }

  if (!fileUrl) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="2xl"
        bg="gray.50"
        minH={height}
        p={5}
      >
        <Text>No hay archivo para mostrar.</Text>
      </Box>
    );
  }

  if (isImage) {
    return (
      <Dialog.Root size="cover" placement="center">
        <VStack align="stretch" gap={3}>
          <Box
            borderWidth="1px"
            borderRadius="2xl"
            bg="white"
            minH={height}
            p={3}
            overflow="auto"
            cursor="zoom-in"
          >
            <Dialog.Trigger asChild>
              <Image
                src={fileUrl}
                alt={fileName || "Documento"}
                maxW="100%"
                h="auto"
                objectFit="contain"
                borderRadius="lg"
              />
            </Dialog.Trigger>
          </Box>

          <Text fontSize="sm" color="gray.500">
            Haz clic sobre la imagen para ampliarla.
          </Text>
        </VStack>

        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="95vw" maxH="95vh">
              <Dialog.Header>
                <Flex justify="space-between" align="center" w="100%" gap={3}>
                  <Dialog.Title>{fileName || "Vista ampliada"}</Dialog.Title>

                  <Flex gap={2} align="center">
                    <Button size="sm" variant="outline" onClick={zoomOut}>
                      -
                    </Button>
                    <Text minW="60px" textAlign="center" fontSize="sm">
                      {Math.round(scale * 100)}%
                    </Text>
                    <Button size="sm" variant="outline" onClick={zoomIn}>
                      +
                    </Button>
                    <Button size="sm" variant="outline" onClick={resetZoom}>
                      Reset
                    </Button>
                    <Dialog.CloseTrigger asChild>
                      <Button size="sm">Cerrar</Button>
                    </Dialog.CloseTrigger>
                  </Flex>
                </Flex>
              </Dialog.Header>

              <Dialog.Body>
                <Box
                  bg="gray.100"
                  borderRadius="lg"
                  p={4}
                  overflow="auto"
                  maxH="80vh"
                >
                  <Flex justify="center" align="flex-start" minH="70vh">
                    <Image
                      src={fileUrl}
                      alt={fileName || "Documento"}
                      style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "top center",
                        transition: "transform 0.2s ease",
                        maxWidth: "100%",
                        height: "auto",
                      }}
                    />
                  </Flex>
                </Box>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }

  if (isPdf) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="2xl"
        bg="white"
        minH={height}
        overflow="hidden"
      >
        <iframe
          src={fileUrl}
          title={fileName || "Documento PDF"}
          width="100%"
          height={height}
          style={{ border: "none" }}
        />
      </Box>
    );
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      bg="gray.50"
      minH={height}
      p={5}
    >
      <VStack align="start" gap={3}>
        <Text>No hay vista previa disponible para este tipo de archivo.</Text>
        <Button asChild colorPalette="blue">
          <a href={fileUrl} target="_blank" rel="noreferrer">
            Abrir archivo
          </a>
        </Button>
      </VStack>
    </Box>
  );
}