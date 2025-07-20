export const getRedirectPathForRole = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "AGENT":
      return "/agent";
    case "USER":
      return "/chat";
    default:
      return "/login";
  }
};
