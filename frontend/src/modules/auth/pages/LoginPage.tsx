import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";

const slides = [
  {
    image: "/images/login-slider/login-bg-1.png",
    title: "Control presupuestario inteligente",
    description:
      "Visualiza solicitudes, liquidaciones y ejecución presupuestaria desde una sola plataforma.",
  },
  {
    image: "/images/login-slider/login-bg-2.jpg",
    title: "Rendición y conciliación con OCR",
    description:
      "Digitaliza comprobantes, extrae información clave y reduce tiempos de revisión financiera.",
  },
  {
    image: "/images/login-slider/login-bg-3.png",
    title: "Trazabilidad y auditoría empresarial",
    description:
      "Mantén evidencia de aprobaciones, cambios, accesos y cierres para control interno.",
  },
];

const features = [
  "Control presupuestario en tiempo real",
  "Rendición y conciliación con OCR",
  "Trazabilidad, auditoría y reportes",
];

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@sistema.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeSlide = slides[currentSlide];

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Ingresa tu correo y contraseña.");
        return;
      }

      /**
       * Aquí puedes conectar tu login real.
       * Por ahora dejamos el flujo funcional para entrar al dashboard.
       */

      localStorage.setItem("token", "demo-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: "Walter Rosales",
          email,
          role: "Administrador",
        })
      );

      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError("No fue posible iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" bg="gray.50">
      <Box
        display={{ base: "none", lg: "flex" }}
        w="56%"
        minH="100vh"
        position="relative"
        overflow="hidden"
        color="white"
      >
        <Box
          position="absolute"
          inset="0"
          bgImage={`linear-gradient(120deg, rgba(8, 24, 58, 0.92), rgba(17, 78, 140, 0.74)), url('${activeSlide.image}')`}
          bgSize="cover"
          bgPos="center"
          transition="background-image 0.8s ease-in-out"
        />

        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.35))"
        />

        <Box
          position="absolute"
          top="-130px"
          right="-110px"
          w="340px"
          h="340px"
          rounded="full"
          bg="whiteAlpha.200"
        />

        <Box
          position="absolute"
          bottom="-170px"
          left="-130px"
          w="380px"
          h="380px"
          rounded="full"
          bg="whiteAlpha.100"
        />

        <Flex
          position="relative"
          zIndex="1"
          direction="column"
          justify="space-between"
          w="100%"
          px="14"
          py="12"
        >
          <Box>
            <HStack gap="4" mb="14">
              <Box bg="white" p="3" rounded="2xl" shadow="lg">
                <Image
                  src="/images/logo-servicios-compartidos.jpg"
                  alt="Servicios Compartidos"
                  maxW="92px"
                />
              </Box>

              <Box>
                <Text fontWeight="bold" fontSize="xl" lineHeight="1.1">
                  Servicios Compartidos
                </Text>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Plataforma corporativa
                </Text>
              </Box>
            </HStack>

            <Badge
              bg="whiteAlpha.200"
              color="white"
              border="1px solid"
              borderColor="whiteAlpha.300"
              px="3"
              py="1"
              rounded="full"
              mb="6"
            >
              Sistema de gestión empresarial
            </Badge>

            <Heading
              fontSize={{ lg: "42px", xl: "52px" }}
              lineHeight="1.05"
              maxW="720px"
              mb="6"
            >
              Sistema de Gastos
            </Heading>

            <Text fontSize="xl" fontWeight="medium" maxW="680px" mb="4">
              {activeSlide.title}
            </Text>

            <Text fontSize="md" color="whiteAlpha.850" maxW="660px">
              {activeSlide.description}
            </Text>
          </Box>

          <Box>
            <VStack align="stretch" gap="3" mb="8">
              {features.map((feature) => (
                <HStack key={feature} gap="3">
                  <Box w="9px" h="9px" rounded="full" bg="white" />
                  <Text color="whiteAlpha.900">{feature}</Text>
                </HStack>
              ))}
            </VStack>

            <HStack gap="3">
              {slides.map((slide, index) => (
                <Box
                  key={slide.title}
                  as="button"
                  type="button"
                  onClick={() => setCurrentSlide(index)}
                  w={currentSlide === index ? "34px" : "10px"}
                  h="10px"
                  rounded="full"
                  bg={currentSlide === index ? "white" : "whiteAlpha.400"}
                  transition="all 0.25s ease"
                  cursor="pointer"
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </HStack>
          </Box>
        </Flex>
      </Box>

      <Flex
        w={{ base: "100%", lg: "44%" }}
        minH="100vh"
        align="center"
        justify="center"
        px={{ base: "6", md: "12" }}
        py="10"
      >
        <Box w="100%" maxW="460px">
          <Box
            display={{ base: "block", lg: "none" }}
            textAlign="center"
            mb="8"
          >
            <Image
              src="/images/logo-servicios-compartidos.jpg"
              alt="Servicios Compartidos"
              maxW="150px"
              mx="auto"
              mb="4"
            />

            <Heading size="md">Sistema de Gastos</Heading>
            <Text fontSize="sm" color="gray.500">
              Control presupuestario empresarial
            </Text>
          </Box>

          <Box
            bg="white"
            rounded="3xl"
            shadow="xl"
            border="1px solid"
            borderColor="gray.200"
            p={{ base: "6", md: "9" }}
          >
            <VStack align="stretch" gap="7">
              <Box>
                <Badge colorPalette="blue" mb="4">
                  Acceso seguro
                </Badge>

                <Heading size="xl">Iniciar sesión</Heading>

                <Text color="gray.500" mt="2">
                  Ingresa tus credenciales para acceder al sistema de gestión y
                  control presupuestario.
                </Text>
              </Box>

              {error && (
                <Box
                  bg="red.50"
                  color="red.700"
                  border="1px solid"
                  borderColor="red.200"
                  rounded="xl"
                  px="4"
                  py="3"
                  fontSize="sm"
                >
                  {error}
                </Box>
              )}

              <form onSubmit={handleLogin}>
                <VStack align="stretch" gap="5">
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb="2">
                      Correo electrónico
                    </Text>

                    <Input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="usuario@empresa.com"
                      type="email"
                      size="lg"
                      bg="gray.50"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb="2">
                      Contraseña
                    </Text>

                    <Input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Ingresa tu contraseña"
                      type="password"
                      size="lg"
                      bg="gray.50"
                    />
                  </Box>

                <Flex justify="space-between" align="center">
                  <HStack gap="2">
                    <Box
                      as="input"
                      type="checkbox"
                      defaultChecked
                      accentColor="#2563eb"
                    />
                    <Text fontSize="sm" color="gray.600">
                      Recordar sesión
                    </Text>
                  </HStack>

                  <Button
                    type="button"
                    variant="plain"
                    size="sm"
                    colorPalette="blue"
                    px="0"
                  >
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Flex>

                  <Button
                    type="submit"
                    colorPalette="blue"
                    size="lg"
                    loading={loading}
                    rounded="xl"
                    mt="2"
                  >
                    Ingresar al sistema
                  </Button>
                </VStack>
              </form>

              <Box borderTop="1px solid" borderColor="gray.100" pt="5">
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  Servicios Compartidos · Sistema web para la gestión y control
                  presupuestario de gastos operativos empresariales
                </Text>
              </Box>
            </VStack>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}