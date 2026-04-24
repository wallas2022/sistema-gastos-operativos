import { Box, Button, Flex, Text, Badge, Stack } from "@chakra-ui/react";

interface DocumentCardProps {
  id: string;
  fileName: string;
  status: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  onViewDetail: (id: string) => void;
  onProcessOcr?: (id: string) => void;
  processing?: boolean;
  canProcessOcr?: boolean;
}

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

export default function DocumentCard({
  id,
  fileName,
  status,
  mimeType,
  sizeBytes,
  createdAt,
  onViewDetail,
  onProcessOcr,
  processing = false,
  canProcessOcr = false,
}: DocumentCardProps) {
  return (
    <Box borderWidth="1px" borderRadius="xl" p={4} bg="white">
      <Flex justify="space-between" align="start" gap={4} direction={{ base: "column", md: "row" }}>
        <Box flex="1">
          <Stack gap={2}>
            <Text fontWeight="bold">{fileName}</Text>

            <Badge width="fit-content" colorPalette={getStatusColor(status)}>
              {status}
            </Badge>

            <Text fontSize="sm" color="gray.600">
              Tipo: {mimeType}
            </Text>

            <Text fontSize="sm" color="gray.600">
              Tamaño: {sizeBytes} bytes
            </Text>

            <Text fontSize="sm" color="gray.600">
              Fecha: {new Date(createdAt).toLocaleString()}
            </Text>
          </Stack>
        </Box>

        <Flex gap={2} wrap="wrap">
          <Button
            colorPalette="blue"
            variant="outline"
            onClick={() => onViewDetail(id)}
          >
            Ver detalle
          </Button>

          <Button
            colorPalette="blue"
            onClick={() => onProcessOcr?.(id)}
            loading={processing}
            disabled={!canProcessOcr || processing}
          >
            Procesar OCR
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}