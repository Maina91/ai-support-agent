import React from "react";
import { Layout } from "../components/Layout.js";
import { AdminDashboard } from "../components/AdminDashboard.js";

interface AdminPageProps {
  apiUrl?: string;
  apiKey?: string;
}

export const DashboardPage: React.FC<AdminPageProps> = ({
  apiUrl,
  apiKey = "",
}) => {
  return (
    <Layout title="Admin Dashboard" role="admin">
      <AdminDashboard apiUrl={apiUrl} apiKey={apiKey} />
    </Layout>
  );
};
