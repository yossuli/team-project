import { ClerkProvider } from "@clerk/clerk-react";
import { RouterProvider } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { router } from "./route";
import "@ss/styles.css";
import { jaJP } from "@clerk/localizations";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        localization={jaJP}
        appearance={{
          variables: {
            colorPrimary: "black",
            colorTextOnPrimaryBackground: "white",
            colorText: "black",
            colorInputBackground: "#f9f9f9",
            borderRadius: "0.5rem",
          },
          elements: {
            logoBox: {
              display: "none",
            },
          },
        }}
      >
        <RouterProvider router={router} />
        {import.meta.env.DEV && <TanStackRouterDevtools router={router} />}
      </ClerkProvider>
    </StrictMode>
  );
}
