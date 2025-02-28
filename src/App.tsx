import SubscribedApp from "./_pages/SubscribedApp";
import { UpdateNotification } from "./components/UpdateNotification";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./components/ui/toast";
import { ToastContext } from "./contexts/toast";

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

type ToastVariant = "neutral" | "success" | "error";

interface ToastState {
  open: boolean;
  title: string;
  description: string;
  variant: ToastVariant;
}

// Root component without any authentication or subscription logic
function App() {
  // Toast state for notifications
  const [toastState, setToastState] = useState<ToastState>({
    open: false,
    title: "",
    description: "",
    variant: "neutral",
  });
  // Default language (can be updated from within SubscribedApp)
  const [currentLanguage, setCurrentLanguage] = useState<string>("python");

  // Show toast method for notifications
  const showToast = useCallback(
    (
      title: string,
      description: string,
      variant: ToastVariant // now correctly typed
    ) => {
      setToastState({
        open: true,
        title,
        description,
        variant,
      });
    },
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ToastContext.Provider value={{ showToast }}>
          {/* Directly render the main UI; provide a default credits value */}
          <SubscribedApp
            credits={50}
            currentLanguage={currentLanguage}
            setLanguage={setCurrentLanguage}
          />
          <UpdateNotification />
          <Toast
            open={toastState.open}
            onOpenChange={(open) =>
              setToastState((prev) => ({ ...prev, open }))
            }
            variant={toastState.variant}
            duration={1500}
          >
            <ToastTitle>{toastState.title}</ToastTitle>
            <ToastDescription>{toastState.description}</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastContext.Provider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
