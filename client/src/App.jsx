import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AuthLayout from "./components/Authlayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyRegistration from "./pages/VerifyRegistration";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
     <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
<Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
<Route path="/verify" element={<AuthLayout><VerifyRegistration /></AuthLayout>} />

      <Route element={<Layout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}