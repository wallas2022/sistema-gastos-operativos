import { Box, Text } from "@chakra-ui/react";

interface StatusMessageProps {
  type: "success" | "error" | "info";
  message: string;
}

const styles = {
  success: {
    bg: "green.50",
    color: "green.700",
  },
  error: {
    bg: "red.50",
    color: "red.700",
  },
  info: {
    bg: "blue.50",
    color: "blue.700",
  },
};

export default function StatusMessage({
  type,
  message,
}: StatusMessageProps) {
  const style = styles[type];

  return (
    <Box bg={style.bg} borderRadius="lg" p={3}>
      <Text color={style.color}>{message}</Text>
    </Box>
  );
}