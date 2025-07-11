import React, { ReactNode, useEffect } from "react";


interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title = "AI Support Agent",
  description = "An intelligent customer support agent powered by AI",
}) => {
  useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "description";
      newMeta.content = description;
      document.head.appendChild(newMeta);
    }
  }, [title, description]);

  return <>{children}</>;
};