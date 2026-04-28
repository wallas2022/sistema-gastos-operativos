import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Heading,
} from "@chakra-ui/react";
import { api } from "../../../shared/services/api";

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token =
        response.data.access_token ||
        response.data.token ||
        response.data.accessToken;


      if (!token) {
        setErrorMessage("No se recibió token desde el servidor.");
        return;
      }

      localStorage.setItem("token", token);
      navigate("/", { replace: true });

    } catch (error) {
      console.error(error);
      setErrorMessage("Credenciales incorrectas o error al iniciar sesión.");
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
      bg="gray.50"
    >
      <Box
        w="100%"
        maxW="400px"
        bg="white"
        p="8"
        rounded="xl"
        border="1px solid"
        borderColor="gray.200"
      >
        <VStack gap="4" align="stretch">
          <Box textAlign="center" mb="4">
            <Heading size="lg">Iniciar sesión</Heading>
            <Text color="gray.500" fontSize="sm" mt="2">
              Sistema de gestión de gastos operativos
            </Text>
          </Box>

          <Input
            placeholder="Correo electrónico"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {errorMessage && (
            <Text color="red.500" fontSize="sm">
              {errorMessage}
            </Text>
          )}

          <Button
            colorPalette="blue"
            loading={loading}
            onClick={handleLogin}
          >
            Ingresar
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}