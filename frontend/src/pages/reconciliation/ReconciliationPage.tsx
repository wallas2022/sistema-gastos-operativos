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
              Subir comprobante OCR
            </Button>
          </Link>
        </Box>

        <ModuleCard
          title="Conciliador de anticipos"
          description="Cálculo automático del balance entre anticipo entregado, gasto ejecutado y reintegro."
        />

        <ModuleCard
          title="Alertas de liquidación pendiente"
          description="Bloqueo preventivo de nuevas solicitudes si existen cierres atrasados."
        />

        <ModuleCard
          title="Certificación de cierre"
          description="Generación de expediente técnico digital firmado para archivo corporativo."
        />
      </SimpleGrid>
    </PageContainer>
  );
}

function ModuleCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box bg="white" p="5" rounded="xl" border="1px solid" borderColor="gray.200">
      <Text fontWeight="semibold">{title}</Text>
      <Text fontSize="sm" color="gray.500" mt="2">
        {description}
      </Text>
    </Box>
  );
}