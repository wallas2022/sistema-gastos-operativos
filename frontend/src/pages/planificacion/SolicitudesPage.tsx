import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Text,
  VStack,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  ExpenseRequest,
  getExpenseRequests,
} from "../../services/expenseRequests.service";

const getStatusColor = (status: string) => {
  switch (status) {
    case "BORRADOR":
      return "gray";
    case "ENVIADA":
      return "blue";
    case "EN_REVISION":
      return "orange";
    case "APROBADA":
      return "green";
    case "RECHAZADA":
      return "red";
    case "ANULADA":
      return "purple";
    default:
      return "gray";
  }
};

const formatDate = (date?: string | null) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatMoney = (currency: string, amount: number) => {
  return `${currency} ${Number(amount || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function SolicitudesPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getExpenseRequests();
      setRequests(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("No se pudieron cargar las solicitudes de gasto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <Box p={6}>
      <HStack justify="space-between" align="start" mb={6}>
        <Box>
          <Heading size="lg">Solicitudes de gasto</Heading>
          <Text color="gray.500" mt={1}>
            Consulta y seguimiento de solicitudes registradas.
          </Text>
        </Box>

        <Button
          colorPalette="blue"
          onClick={() =>
            navigate("/planificacion-normativa/solicitudes/nueva")
          }
        >
          Nueva solicitud
        </Button>
      </HStack>

      {loading && (
        <HStack justify="center" py={10}>
          <Spinner />
          <Text>Cargando solicitudes...</Text>
        </HStack>
      )}

      {!loading && errorMessage && (
        <Box
          p={4}
          borderWidth="1px"
          borderColor="red.200"
          bg="red.50"
          rounded="lg"
        >
          <Text color="red.600">{errorMessage}</Text>
        </Box>
      )}

      {!loading && !errorMessage && requests.length === 0 && (
        <Box
          p={6}
          borderWidth="1px"
          borderColor="gray.200"
          rounded="xl"
          bg="white"
        >
          <VStack gap={3}>
            <Text fontWeight="semibold">
              No hay solicitudes registradas.
            </Text>
            <Text color="gray.500">
              Crea una nueva solicitud para iniciar el ciclo del gasto.
            </Text>
            <Button
              colorPalette="blue"
              onClick={() =>
                navigate("/planificacion-normativa/solicitudes/nueva")
              }
            >
              Crear solicitud
            </Button>
          </VStack>
        </Box>
      )}

      {!loading && !errorMessage && requests.length > 0 && (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          rounded="xl"
          overflow="hidden"
          bg="white"
        >
          <Box overflowX="auto">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F8FAFC",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "14px" }}>Código</th>
                  <th style={{ padding: "14px" }}>Concepto</th>
                  <th style={{ padding: "14px" }}>Tipo</th>
                  <th style={{ padding: "14px" }}>Solicitante</th>
                  <th style={{ padding: "14px" }}>Monto</th>
                  <th style={{ padding: "14px" }}>Estado</th>
                  <th style={{ padding: "14px" }}>Validaciones</th>
                  <th style={{ padding: "14px" }}>Creación</th>
                  <th style={{ padding: "14px" }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    style={{
                      borderTop: "1px solid #E2E8F0",
                    }}
                  >
                    <td style={{ padding: "14px", fontWeight: 600 }}>
                      {request.code}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <Text fontWeight="medium">{request.concept}</Text>
                      <Text color="gray.500" fontSize="sm" lineClamp={1}>
                        {request.justification}
                      </Text>
                    </td>

                    <td style={{ padding: "14px" }}>
                      {request.type}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <Text>{request.requesterName}</Text>
                      <Text color="gray.500" fontSize="sm">
                        {request.requesterRole}
                      </Text>
                    </td>

                    <td style={{ padding: "14px" }}>
                      {formatMoney(
                        request.currency,
                        request.estimatedAmount
                      )}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <Badge colorPalette={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </td>

                    <td style={{ padding: "14px" }}>
                      <Text fontSize="sm">
                        {request.validations?.length || 0} validación(es)
                      </Text>
                    </td>

                    <td style={{ padding: "14px" }}>
                      {formatDate(request.createdAt)}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(
                            `/planificacion-normativa/solicitudes/${request.id}`
                          )
                        }
                      >
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      )}
    </Box>
  );
}