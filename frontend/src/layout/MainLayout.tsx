import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  return (
    <Flex minH="100vh" bg="gray.50">
      <Sidebar />

      <Box flex="1" ml="260px">
        <Header />

        <Box as="main" p="6">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
}