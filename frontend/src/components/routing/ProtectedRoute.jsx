import { Navigate } from "react-router-dom";

function getToken() {
    return localStorage.getItem("access_token");
}

function getRole() {
    return localStorage.getItem("role");
}

export default function ProtectedRoute({ children, allowedRoles }) {
    const token = getToken();
    if (!token) return <Navigate to="/login" replace />;

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const role = getRole();
        if (!role) return <Navigate to="/login" replace />;
        if (!allowedRoles.includes(role)) return <Navigate to="/rates" replace />;
    }

    return children;
}