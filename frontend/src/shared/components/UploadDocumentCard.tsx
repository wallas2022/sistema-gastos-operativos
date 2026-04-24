import { Box, Button, Heading, Input, Text, VStack } from "@chakra-ui/react";

interface UploadDocumentCardProps {
  selectedFile: File | null;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
}

export default function UploadDocumentCard({
  selectedFile,
  uploading,
  fileInputRef,
  onSelectFile,
  onUpload,
}: UploadDocumentCardProps) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="2xl"
      p={6}
      bg="white"
      shadow="sm"
    >
      <VStack align="stretch" gap={5}>
        <Box>
          <Heading size="md">Subir factura o recibo</Heading>
          <Text color="gray.600" mt={1}>
            Adjunta un archivo PDF o una imagen para registrarlo en el sistema.
          </Text>
        </Box>

        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={onSelectFile}
          p={1}
          bg="white"
        />

        {selectedFile ? (
          <Box bg="blue.50" borderRadius="lg" p={3}>
            <Text fontSize="sm" color="blue.700">
              Archivo seleccionado: <strong>{selectedFile.name}</strong>
            </Text>
          </Box>
        ) : (
          <Box bg="gray.50" borderRadius="lg" p={3}>
            <Text fontSize="sm" color="gray.500">
              Aún no has seleccionado ningún archivo.
            </Text>
          </Box>
        )}

        <Button
          colorPalette="blue"
          onClick={onUpload}
          loading={uploading}
          disabled={!selectedFile || uploading}
        >
          Subir archivo
        </Button>
      </VStack>
    </Box>
  );
}