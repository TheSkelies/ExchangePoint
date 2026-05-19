import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import RatesPage from "./pages/RatesPage.jsx";
import YourHistoryPage from "./pages/HistoryPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ExchangePage from "./pages/ExchangePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProtectedRoute from "./components/routing/ProtectedRoute.jsx";
import EditRates from "./pages/EditRates.jsx";
import AllHistoryPage from "./pages/AllHistoryPage.jsx";

export default function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/rates" replace />} />
                <Route path="/rates" element={<RatesPage />} />
                <Route path="/exchange/:rateId" element={<ExchangePage />} />
                <Route
                    path="/my_history"
                    element={
                        <YourHistoryPage />
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/rates/edit"
                    element={
                        <ProtectedRoute allowedRoles={["seller"]}>
                            <EditRates />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/all_history"
                    element={
                        <ProtectedRoute allowedRoles={["seller"]}>
                            <AllHistoryPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/rates" replace />} />
            </Route>
        </Routes>
    );
}
