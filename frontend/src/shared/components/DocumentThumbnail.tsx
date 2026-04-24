import { Box, Image, Text, Spinner, Center } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getDocumentFileBlob } from "../../modules/documents/services/documents.service";

interface DocumentThumbnailProps {
  documentId: string;
  mimeType?: string;
  fileName?: string;
  height?: string;
}

export default function DocumentThumbnail({
  documentId,
  mimeType,
  fileName,
  height = "120px",
}: DocumentThumbnailProps) {
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.error("Error cargando miniatura:", err);
        setError("No preview");
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

  if (loading) {
    return (
      <Center h={height} bg="gray.50" borderRadius="lg" borderWidth="1px">
        <Spinner size="sm" />
      </Center>
    );
  }

  if (error || !fileUrl) {
    return (
      <Center h={height} bg="gray.50" borderRadius="lg" borderWidth="1px" p={2}>
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Sin vista previa
        </Text>
      </Center>
    );
  }

  const safeMimeType = mimeType || "";

  if (safeMimeType.startsWith("image/")) {
    return (
      <Box h={height} bg="white" borderRadius="lg" borderWidth="1px" overflow="hidden">
        <Image
          src={fileUrl}
          alt={fileName || "Documento"}
          w="100%"
          h="100%"
          objectFit="cover"
        />
      </Box>
    );
  }

  if (safeMimeType.includes("pdf")) {
    return (
      <Center
        h={height}
        bg="red.50"
        borderRadius="lg"
        borderWidth="1px"
        flexDirection="column"
        gap={1}
      >
        <Text fontSize="2xl">📄</Text>
        <Text fontSize="xs" color="gray.600">
          PDF
        </Text>
      </Center>
    );
  }

  return (
    <Center h={height} bg="gray.50" borderRadius="lg" borderWidth="1px">
      <Text fontSize="sm" color="gray.500">
        Archivo
      </Text>
    </Center>
  );
}