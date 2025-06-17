
import React from "react";
import AppProviders from "@/components/providers/AppProviders";
import AppRouter from "@/components/routing/AppRouter";

function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
