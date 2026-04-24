import { useEffect, useState } from "react";
import { Box, Button, Container, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../shared/services/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      navigate("/documents", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token = response.data?.access_token;

      if (!token) {
        setErrorMessage("El backend no devolvió access_token.");
        return;
      }

      localStorage.setItem("access_token", token);
      navigate("/documents", { replace: true });
    } catch (error) {
      console.error("Error en login", error);
      setErrorMessage("Credenciales inválidas o error de autenticación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.100"
      px={4}
    >
      <Container maxW="md" bg="white" p={8} borderRadius="xl" boxShadow="sm">
        <Stack gap={4}>
          <Heading size="2xl">Módulo OCR</Heading>
          <Text color="gray.600">
            Ingreso de demostración para el flujo de documentos.
          </Text>

          <Input
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMessage && (
            <Box bg="red.50" borderRadius="md" p={3}>
              <Text color="red.700">{errorMessage}</Text>
            </Box>
          )}

          <Button colorPalette="blue" onClick={handleLogin} loading={loading}>
            Ingresar
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}