import { Box, Grid, GridItem, Text } from "@chakra-ui/react";
import { PageContainer } from "../../layout/PageContainer";

function StatCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <Box bg="white" p="5" rounded="xl" border="1px solid" borderColor="gray.200">
      <Text fontSize="sm" color="gray.500">
        {title}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" mt="2">
        {value}
      </Text>
      <Text fontSize="sm" color="gray.500" mt="1">
        {helper}
      </Text>
    </Box>
  );
}

export function DashboardPage() {
  return (
    <PageContainer
      title="Dashboard General"
      description="Vista general del comportamiento de solicitudes, aprobaciones, liquidaciones y presupuesto."
    >
      <Grid templateColumns="repeat(4, 1fr)" gap="4" mb="6">
        <StatCard
          title="Solicitudes pendientes"
          value="18"
          helper="Solicitudes de gasto en proceso"
        />

        <StatCard
          title="Aprobaciones pendientes"
          value="11"
          helper="Pendientes de autorización"
        />

        <StatCard
          title="Liquidaciones pendientes"
          value="9"
          helper="Liquidaciones abiertas"
        />

        <StatCard
          title="Presupuesto ejecutado"
          value="Q 6,700,000"
          helper="67% del presupuesto anual"
        />
      </Grid>

      <Grid templateColumns="2fr 1fr" gap="4">
        <GridItem>
          <Box
            bg="white"
            p="5"
            rounded="xl"
            border="1px solid"
            borderColor="gray.200"
            minH="320px"
          >
            <Text fontWeight="semibold" mb="4">
              Actividad reciente
            </Text>

            <Text color="gray.600" fontSize="sm">
              Aquí se mostrarán los últimos eventos del sistema: documentos OCR
              confirmados, solicitudes enviadas, aprobaciones, liquidaciones y
              movimientos presupuestarios.
            </Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box
            bg="white"
            p="5"
            rounded="xl"
            border="1px solid"
            borderColor="gray.200"
            minH="320px"
          >
            <Text fontWeight="semibold" mb="4">
              Accesos rápidos
            </Text>

            <Text fontSize="sm" color="gray.600">
              Nueva solicitud de gasto
            </Text>
            <Text fontSize="sm" color="gray.600" mt="3">
              Nueva liquidación
            </Text>
            <Text fontSize="sm" color="gray.600" mt="3">
              Subir comprobante OCR
            </Text>
            <Text fontSize="sm" color="gray.600" mt="3">
              Ver autorizaciones
            </Text>
            <Text fontSize="sm" color="gray.600" mt="3">
              Ver presupuesto
            </Text>
          </Box>
        </GridItem>
      </Grid>
    </PageContainer>
  );
}