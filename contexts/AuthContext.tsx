import { useRouter } from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";
import { setCookie, parseCookies } from "nookies";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};
type SignCredentials = {
  email: string;
  password: string;
};
type AuthContext = {
  signIn(credentials: SignCredentials): Promise<void>;
  user: User;
  isAuthenticate: boolean;
};

type AuthProvider = {
  children: ReactNode;
};
export const AuthContext = createContext({} as AuthContext);

export function AuthProvider({ children }: AuthProvider) {
  const [user, setUser] = useState<User>({} as User);

  const router = useRouter();
  const isAuthenticate = !!user;

  useEffect(() => {
    const { "nextauth.token": token } = parseCookies();
    if (token) {
      api.get("/me").then((response) => {
        const { email, permissions, roles } = response.data;
        setUser({ email, permissions, roles });
      });
    }
  }, []);

  const signIn = async ({ email, password }: SignCredentials) => {
    try {
      const response = await api.post("sessions", {
        email,
        password,
      });
      const { permissions, roles, token, refreshToken } = response.data;

      setCookie(undefined, "nextauth.token", token, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      setCookie(undefined, "nextauth.refreshToken", refreshToken),
        {
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        };

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      router.push("/dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticate, user }}>
      {children}
    </AuthContext.Provider>
  );
}
