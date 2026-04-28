import { Box, Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface PageContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageContainer({
  title,
  description,
  children,
}: PageContainerProps) {
  return (
    <Box>
      <Box mb="6">
        <Heading size="lg" color="gray.800">
          {title}
        </Heading>

        {description && (
          <Text mt="2" color="gray.500">
            {description}
          </Text>
        )}
      </Box>

      {children}
    </Box>
  );
}