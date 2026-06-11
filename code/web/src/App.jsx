import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { ProtectedRoute, RoleRoute } from "./auth/guards";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Accounts from "./pages/Accounts";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Payslips from "./pages/Payslips";
import Loans from "./pages/Loans";
import Appraisals from "./pages/Appraisals";
import EmployeeHome from "./pages/EmployeeHome";

const MGMT = ["SuperAdmin", "CompanyAdmin", "HRManager", "DeptManager"];

export default function App() {
  const { isAuthenticated, homePath } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={homePath} /> : <Login />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={homePath} /> : <Signup />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<RoleRoute allow={MGMT}><Dashboard /></RoleRoute>} />
        <Route path="/employees" element={<RoleRoute allow={MGMT}><Employees /></RoleRoute>} />
        <Route path="/departments" element={<RoleRoute allow={MGMT}><Departments /></RoleRoute>} />
        <Route path="/attendance" element={<RoleRoute allow={MGMT}><Attendance /></RoleRoute>} />
        <Route path="/payroll" element={<RoleRoute allow={["SuperAdmin","CompanyAdmin","HRManager"]}><Payroll /></RoleRoute>} />
        <Route path="/loans" element={<RoleRoute allow={MGMT}><Loans /></RoleRoute>} />
        <Route path="/accounts" element={<RoleRoute allow={["SuperAdmin","CompanyAdmin","HRManager"]}><Accounts /></RoleRoute>} />
        <Route path="/appraisals" element={<RoleRoute allow={MGMT}><Appraisals /></RoleRoute>} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/payslips" element={<Payslips />} />
        <Route path="/me" element={<EmployeeHome />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? homePath : "/login"} />} />
    </Routes>
  );
}
