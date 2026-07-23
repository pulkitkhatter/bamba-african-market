import { HelmetProvider } from "react-helmet-async";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Contact } from "./pages/Contact";
import { Home } from "./pages/Home";
import { WhatWeCarry } from "./pages/WhatWeCarry";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminLogin } from "./pages/admin/Login";

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* English only for now per the brief. A future French version
                  would add sibling routes here (e.g. "/fr", "/fr/what-we-carry")
                  or an i18n library -- not built now since no French copy exists yet. */}
              <Route
                path="/"
                element={
                  <Layout>
                    <Home />
                  </Layout>
                }
              />
              <Route
                path="/what-we-carry"
                element={
                  <Layout>
                    <WhatWeCarry />
                  </Layout>
                }
              />
              <Route
                path="/cart"
                element={
                  <Layout>
                    <Cart />
                  </Layout>
                }
              />
              <Route
                path="/checkout"
                element={
                  <Layout>
                    <Checkout />
                  </Layout>
                }
              />
              <Route
                path="/contact"
                element={
                  <Layout>
                    <Contact />
                  </Layout>
                }
              />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
