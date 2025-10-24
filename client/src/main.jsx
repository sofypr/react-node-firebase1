import "@fontsource/inter";
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Páginas
import Login from "./pages/Login.jsx";
import CreateUser from "./pages/CreateUser.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import User from "./pages/User.jsx";
import RecoverPassword from "./pages/RecoverPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx"; // nueva
import MyCar from "./pages/MyCar.jsx"; 
import EmailActionHandler from "./pages/EmailActionHandler.jsx";

// Rutas
const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/create-user", element: <CreateUser /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/user", element: <User /> },
  { path: "/recover-password", element: <RecoverPassword /> },
  { path: "/my-car", element: <MyCar /> },
  { path: '/reset-password', element: <ResetPassword /> },// nueva
  { path: "/__/auth/*", element: <EmailActionHandler /> },// nueva
]);


// Render
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
