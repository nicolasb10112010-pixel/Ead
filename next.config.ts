import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desligado para evitar que o Payment Brick do Mercado Pago seja montado
  // duas vezes em desenvolvimento (StrictMode monta/desmonta/monta, e o SDK
  // deixa dois formulários na tela). Não afeta produção.
  reactStrictMode: false,
};

export default nextConfig;
