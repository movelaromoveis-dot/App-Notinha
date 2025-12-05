import React, { useContext } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

// suas páginas
import Login from "./pages/Login";
import NovaNota from "./pages/NovaNota";
import ListaNotas from "./pages/ListaNotas";
import Usuarios from "./pages/Usuarios";
import CriarUsuario from "./pages/CriarUsuario";
import EditarUsuario from "./pages/EditarUsuario";
import Auditoria from "./pages/Auditoria";

import PrivateRoute from "./components/PrivateRoute";

function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);

  if (!user) return <>{children}</>;

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Notafácil</h2>

        <Link to="/notas">Notas</Link>
        <Link to="/notas/nova">Criar Nota</Link>

        {(user.role === "gerente" || user.role === "admin") && (
          <Link to="/usuarios">Usuários</Link>
        )}

        {user.role === "admin" && (
          <Link to="/audit">Auditoria</Link>
        )}

        <button onClick={logout}>Sair</button>
      </div>

      <div className="content">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route
                path="/notas"
                element={
                  <PrivateRoute>
                    <ListaNotas />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notas/nova"
                element={
                  <PrivateRoute>
                    <NovaNota />
                  </PrivateRoute>
                }
              />

              <Route
                path="/usuarios"
                element={
                  <PrivateRoute roles={["gerente", "admin"]}>
                    <Usuarios />
                  </PrivateRoute>
                }
              />
              <Route
                path="/usuarios/novo"
                element={
                  <PrivateRoute roles={["gerente", "admin"]}>
                    <CriarUsuario />
                  </PrivateRoute>
                }
              />
              <Route
                path="/usuarios/:id/editar"
                element={
                  <PrivateRoute roles={["gerente", "admin"]}>
                    <EditarUsuario />
                  </PrivateRoute>
                }
              />

              <Route
                path="/audit"
                element={
                  <PrivateRoute roles={["admin"]}>
                    <Auditoria />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

