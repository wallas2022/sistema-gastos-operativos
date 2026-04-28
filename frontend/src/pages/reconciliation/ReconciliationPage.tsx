import { Box, Button, SimpleGrid, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { PageContainer } from "../../layout/PageContainer";

export function ReconciliationPage() {
  return (
    <PageContainer
      title="Rendición y Conciliación Financiera"
      description="Gestión de liquidaciones, comprobantes, OCR, conciliación de anticipos y cierre financiero."
    >
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
        <Box
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="semibold">Carga de gastos ejecutados</Text>

          <Text fontSize="sm" color="gray.500" mt="2">
            Digitalización y procesamiento de comprobantes mediante OCR.
          </Text>

          <Link to="/rendicion-conciliacion/ocr/documentos">
            <Button mt="4" colorPalette="blue">
              Ir a OCR
            </Button>
          </Link>
        </Box>

        <Box
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="semibold">Conciliador de anticipos</Text>

          <Text fontSize="sm" color="gray.500" mt="2">
            Cálculo de saldos a favor, reintegros y diferencias.
          </Text>
        </Box>

        <Box
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="semibold">Alertas de liquidación pendiente</Text>

          <Text fontSize="sm" color="gray.500" mt="2">
            Control preventivo de cierres vencidos.
          </Text>
        </Box>

        <Box
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="semibold">Certificación de cierre</Text>

          <Text fontSize="sm" color="gray.500" mt="2">
            Expediente digital firmado para auditoría y archivo.
          </Text>
        </Box>
      </SimpleGrid>
    </PageContainer>
  );
}