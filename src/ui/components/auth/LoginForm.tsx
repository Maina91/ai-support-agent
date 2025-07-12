"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/client";
import { z } from "zod";
import { useAuth } from "../../auth/AuthProvider";


import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["USER", "AGENT", "ADMIN"]),
});

export function LoginForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "USER",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please fill all fields correctly");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/login", parsed.data, {
        withCredentials: true,
      });

      const { user, accessToken } = res.data;

      setUser(user);
      localStorage.setItem("token", accessToken);

      toast.success("Logged in successfully");
      navigate(form.role === "ADMIN" ? "/admin" : "/chat");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleLogin}>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Access your support dashboard</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Login as</Label>
            <Select
              defaultValue="USER"
              onValueChange={(val) => setForm({ ...form, role: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
          <Button variant="outline" className="w-full" type="button">
            Login with Google
          </Button>
        </CardFooter>

        <div className="text-center text-sm">
          Don’t have an account?{" "}
          <a href="/register" className="underline underline-offset-4">
            Register
          </a>
        </div>
        
      </form>
    </Card>
  );
}
