import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Plus,
} from "lucide-react";
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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "BORRADOR":
      return "Borrador";
    case "ENVIADA":
      return "Enviada";
    case "EN_REVISION":
      return "En revisión";
    case "APROBADA":
      return "Aprobada";
    case "RECHAZADA":
      return "Rechazada";
    case "ANULADA":
      return "Anulada";
    default:
      return status;
  }
};

const formatMoney = (currency: string, amount: number) => {
  return `${currency} ${Number(amount || 0).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function ExpenseRequestsPage() {
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

  const abiertas = requests.filter(
    (item) => item.status === "BORRADOR" || item.status === "ENVIADA"
  ).length;

  const pendientes = requests.filter(
    (item) => item.status === "ENVIADA" || item.status === "EN_REVISION"
  ).length;

  const aprobadas = requests.filter(
    (item) => item.status === "APROBADA"
  ).length;

  const observadas = requests.filter(
    (item) => item.status === "RECHAZADA" || item.status === "ANULADA"
  ).length;

  return (
    <Box p={6}>
      <HStack justify="space-between" align="start" mb={6}>
        <Box>
          <Heading size="md">Solicitudes y Planificación de Gastos</Heading>
          <Text color="gray.500" mt={1}>
            Registro, validación y seguimiento inicial de solicitudes de gastos
            antes de su autorización y ejecución.
          </Text>
        </Box>

        <RouterLink to="/solicitudes-gastos/nueva">
          <Button colorPalette="blue">
            <Plus size={18} />
            Nueva solicitud
          </Button>
        </RouterLink>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4} mb={6}>
        <Box p={5} bg="white" borderWidth="1px" rounded="xl">
          <HStack justify="space-between">
            <Box>
              <Text color="gray.500" fontSize="sm">
                Solicitudes abiertas
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {abiertas}
              </Text>
              <Text color="gray.500" fontSize="sm">
                Gastos en proceso
              </Text>
            </Box>
            <Icon as={ClipboardList} boxSize={6} color="blue.500" />
          </HStack>
        </Box>

        <Box p={5} bg="white" borderWidth="1px" rounded="xl">
          <HStack justify="space-between">
            <Box>
              <Text color="gray.500" fontSize="sm">
                Pendientes de aprobación
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {pendientes}
              </Text>
              <Text color="gray.500" fontSize="sm">
                Esperando autorización
              </Text>
            </Box>
            <Icon as={Clock} boxSize={6} color="orange.500" />
          </HStack>
        </Box>

        <Box p={5} bg="white" borderWidth="1px" rounded="xl">
          <HStack justify="space-between">
            <Box>
              <Text color="gray.500" fontSize="sm">
                Aprobadas
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {aprobadas}
              </Text>
              <Text color="gray.500" fontSize="sm">
                Listas para ejecutar
              </Text>
            </Box>
            <Icon as={CheckCircle2} boxSize={6} color="green.500" />
          </HStack>
        </Box>

        <Box p={5} bg="white" borderWidth="1px" rounded="xl">
          <HStack justify="space-between">
            <Box>
              <Text color="gray.500" fontSize="sm">
                Observadas
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {observadas}
              </Text>
              <Text color="gray.500" fontSize="sm">
                Requieren corrección
              </Text>
            </Box>
            <Icon as={AlertTriangle} boxSize={6} color="red.500" />
          </HStack>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6}>
        <Box p={5} bg="white" borderWidth="1px" rounded="xl">
          <Heading size="sm">Solicitudes recientes</Heading>
          <Text color="gray.500" fontSize="sm" mt={1} mb={5}>
            Bandeja principal de gastos solicitados por los usuarios.
          </Text>

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
              rounded="xl"
              bg="gray.50"
              textAlign="center"
            >
              <Text fontWeight="semibold">No hay solicitudes registradas.</Text>
              <Text color="gray.500" mt={1}>
                Crea una solicitud para iniciar el ciclo del gasto.
              </Text>
            </Box>
          )}

          {!loading && !errorMessage && requests.length > 0 && (
            <VStack gap={3} align="stretch">
              {requests.map((request) => (
                <Box
                  key={request.id}
                  p={4}
                  borderWidth="1px"
                  rounded="xl"
                  bg="white"
                  _hover={{ bg: "gray.50", cursor: "pointer" }}
                  onClick={() => navigate(`/solicitudes-gastos/${request.id}`)}
                >
                  <HStack justify="space-between" align="center">
                    <HStack gap={4} align="start">
                      <Box
                        bg="blue.50"
                        color="blue.600"
                        p={3}
                        rounded="lg"
                      >
                        <FileText size={20} />
                      </Box>

                      <Box>
                        <HStack mb={1}>
                          <Text fontWeight="bold">{request.code}</Text>
                          <Badge
                            colorPalette={getStatusColor(request.status)}
                          >
                            {getStatusLabel(request.status)}
                          </Badge>
                        </HStack>

                        <Text fontWeight="medium">{request.concept}</Text>

                        <Text color="gray.500" fontSize="sm">
                          Solicitante: {request.requesterName} ·{" "}
                          {request.type} · {request.companyName}
                        </Text>

                        <Text color="gray.500" fontSize="sm">
                          Centro de costo: {request.costCenter}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Text fontWeight="bold">
                        {formatMoney(
                          request.currency,
                          request.estimatedAmount
                        )}
                      </Text>
                      <ArrowRight size={18} />
                    </HStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <Box p={5} bg="white" borderWidth="1px" rounded="xl">
          <Heading size="sm">Validaciones del módulo</Heading>
          <Text color="gray.500" fontSize="sm" mt={1} mb={5}>
            Antes de enviar una solicitud a autorización, el sistema debe
            validar reglas, políticas y disponibilidad presupuestaria.
          </Text>

          <VStack gap={4} align="stretch">
            <Box p={4} borderWidth="1px" rounded="xl">
              <HStack>
                <Box bg="green.50" color="green.600" p={3} rounded="lg">
                  <CheckCircle2 size={20} />
                </Box>
                <Box>
                  <Text fontWeight="bold">Consulta de políticas</Text>
                  <Text color="gray.500" fontSize="sm">
                    Valida límites permitidos por empresa, área, tipo de gasto o
                    jerarquía.
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Box p={4} borderWidth="1px" rounded="xl">
              <HStack>
                <Box bg="blue.50" color="blue.600" p={3} rounded="lg">
                  <ClipboardList size={20} />
                </Box>
                <Box>
                  <Text fontWeight="bold">Verificador de presupuesto</Text>
                  <Text color="gray.500" fontSize="sm">
                    Consulta disponibilidad contra centro de costo y presupuesto
                    operativo.
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Box p={4} borderWidth="1px" rounded="xl">
              <HStack>
                <Box bg="purple.50" color="purple.600" p={3} rounded="lg">
                  <Clock size={20} />
                </Box>
                <Box>
                  <Text fontWeight="bold">Simulador de gasto</Text>
                  <Text color="gray.500" fontSize="sm">
                    Permite calcular el costo estimado antes de enviar la
                    solicitud.
                  </Text>
                </Box>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}