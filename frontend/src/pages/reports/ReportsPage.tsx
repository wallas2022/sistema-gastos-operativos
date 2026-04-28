import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { PageContainer } from "../../layout/PageContainer";

export function ReportsPage() {
  return (
    <PageContainer
      title="Reportes y Analítica"
      description="Indicadores ejecutivos, reportes financieros, auditoría y exportación de información."
    >
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4">
        <ModuleCard
          title="Dashboards ejecutivos"
          description="Indicadores clave sobre solicitudes, aprobaciones, liquidaciones y presupuesto."
        />

        <ModuleCard
          title="Gasto por área y proyecto"
          description="Análisis del gasto operativo por departamento, centro de costo, proyecto y período."
        />

        <ModuleCard
          title="Ejecución presupuestaria"
          description="Reporte de presupuesto asignado, ejecutado, disponible y comprometido."
        />

        <ModuleCard
          title="Exportación para auditoría"
          description="Generación de archivos para auditoría interna, externa y revisión financiera."
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