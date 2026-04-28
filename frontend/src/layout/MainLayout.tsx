import { Box, Flex, IconButton } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Flex minH="100vh" bg="gray.50">
      <Box
        display={{ base: "none", lg: "block" }}
        w={isCollapsed ? "88px" : "290px"}
        transition="width 0.2s ease"
        flexShrink={0}
      >
        <Sidebar isCollapsed={isCollapsed} />
      </Box>

      <Flex direction="column" flex="1" minW="0">
        <Header />

        <Box
          as="main"
          flex="1"
          p={{ base: "4", md: "6" }}
          overflowX="hidden"
        >
          <Flex justify="flex-start" mb="4" display={{ base: "none", lg: "flex" }}>
            <IconButton
              aria-label={
                isCollapsed ? "Expandir menú lateral" : "Comprimir menú lateral"
              }
              size="sm"
              variant="outline"
              onClick={() => setIsCollapsed((value) => !value)}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </IconButton>
          </Flex>

          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}