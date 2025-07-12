import { GalleryVerticalEnd } from "lucide-react";
import aiBanner from "../../assets/ai_banner.jpg";


import { RegisterForm } from "../components/auth/RegisterForm";


export default function RegisterPage() {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      {/* Left Side: Image - Hidden on small screens */}
      <div className="bg-muted relative hidden lg:block">
        <img
          src={aiBanner}
          alt="AI Support Assistant"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>

      {/* Right Side: Form */}
      <div className="bg-muted flex flex-col items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a
            href="#"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Maina AI Support Agent
          </a>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
