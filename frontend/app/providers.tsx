"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111114",
            color: "#fff",
            fontSize: "13px",
            borderRadius: "10px",
          },
          success: { iconTheme: { primary: "#7C5CFC", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
}
