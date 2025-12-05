import React, { useContext } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { SyncContext } from "./context/SyncContext";

// suas páginas
import Login from "./pages/Login";
import NovaNota from "./pages/NovaNota";
import ListaNotas from "./pages/ListaNotas";
import Usuarios from "./pages/Usuarios";
import CriarUsuario from "./pages/CriarUsuario";
import EditarUsuario from "./pages/EditarUsuario";
import Auditoria from "./pages/Auditoria";

import PrivateRoute from "./components/PrivateRoute";
import { UpdateNotifier } from "./components/UpdateNotifier";

function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const { status } = useContext(SyncContext);

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

        <div style={{marginTop:8, fontSize:13}}>
          <div>Status: {status?.online ? 'Online' : 'Offline'} {status?.syncing ? '(Syncing...)' : ''}</div>
          <div>Pendentes: <b>{status?.pending || 0}</b></div>
        </div>
        <button onClick={logout} style={{marginTop:10}}>Sair</button>
      </div>

      <div className="content">{children}</div>
    </div>
  );
}

export default function App() {
  console.log('App rendering');
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
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
    <UpdateNotifier />
    </>
  );
}

export function AppWithUpdater() {
  return (
    <>
      <App />
      <UpdateNotifier />
    </>
  );
}

