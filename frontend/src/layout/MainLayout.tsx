import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const SIDEBAR_WIDTH = "280px";

export function MainLayout() {
  return (
    <Flex minH="100vh" bg="gray.50">
      <Sidebar />

      <Box
        flex="1"
        minW="0"
        w={{ base: "100%", lg: `calc(100% - ${SIDEBAR_WIDTH})` }}
        ml={{ base: "0", lg: SIDEBAR_WIDTH }}
      >
        <Header />

        <Box
          as="main"
          px={{ base: "4", md: "6", xl: "8" }}
          py={{ base: "4", md: "6" }}
          maxW="100%"
          overflowX="hidden"
        >
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
}