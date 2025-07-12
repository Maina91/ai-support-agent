export const RegisterRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token"); // replace with cookie/session check later
  return token ? children : <Navigate to="/register" />;
};
