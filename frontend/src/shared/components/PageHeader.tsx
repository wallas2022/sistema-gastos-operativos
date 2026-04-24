import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "solid" | "outline" | "subtle" | "surface" | "ghost" | "plain";
  actionColorPalette?: string;
}

export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionVariant = "outline",
  actionColorPalette = "red",
}: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="center" mb={8} wrap="wrap" gap={4}>
      <Box>
        <Heading size="lg">{title}</Heading>
        {subtitle && (
          <Text color="gray.600" mt={1}>
            {subtitle}
          </Text>
        )}
      </Box>

      {actionLabel && onAction && (
        <Button
          colorPalette={actionColorPalette}
          variant={actionVariant}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Flex>
  );
}