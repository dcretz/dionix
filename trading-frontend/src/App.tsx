import { Route, Routes } from "react-router-dom";

import ConnectGate from "./components/ConnectGate";
import Layout from "./components/Layout";
import AccountsPage from "./pages/AccountsPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <ConnectGate>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<AccountsPage />} />
        </Routes>
      </Layout>
    </ConnectGate>
  );
}
