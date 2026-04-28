import { Box } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Sidebar />

      <Box ml="280px">
        <Header />

        <Box as="main" p="6">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}