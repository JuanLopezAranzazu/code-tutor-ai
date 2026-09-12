import axios from "axios";
import type {
  Module,
  ChatMessageOut,
  Exercise,
  SubmitResult,
  ProgressResponse,
  AuthUser,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL });

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Si el token expiró o es inválido, limpiamos la sesión local y mandamos al login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("code-tutor-ai:token");
      setAuthToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function registerRequest(
  email: string,
  password: string,
  name?: string
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/register", { email, password, name });
  return data;
}

export async function loginRequest(email: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", { email, password });
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

// ---------- Modulos ----------

export async function fetchModules(): Promise<Module[]> {
  const { data } = await api.get<Module[]>("/modules");
  return data;
}

// ---------- Tutor ----------

export async function fetchChatHistory(moduleId: string): Promise<ChatMessageOut[]> {
  const { data } = await api.get<ChatMessageOut[]>(`/tutor/history/${moduleId}`);
  return data;
}

export async function sendTutorMessage(moduleId: string, message: string): Promise<string> {
  const { data } = await api.post<{ reply: string }>("/tutor/chat", {
    module_id: moduleId,
    message,
  });
  return data.reply;
}

export async function resetChatHistory(moduleId: string): Promise<void> {
  await api.delete(`/tutor/history/${moduleId}`);
}

// ---------- Ejercicios ----------

export async function generateExercise(
  moduleId: string,
  topic: string | null,
  difficulty: "facil" | "media" | "dificil"
): Promise<Exercise> {
  const { data } = await api.post<Exercise>("/exercises/generate", {
    module_id: moduleId,
    topic,
    difficulty,
  });
  return data;
}

export async function submitExercise(
  moduleId: string,
  exerciseTitle: string,
  exerciseStatement: string,
  userCode: string
): Promise<SubmitResult> {
  const { data } = await api.post<SubmitResult>("/exercises/submit", {
    module_id: moduleId,
    exercise_title: exerciseTitle,
    exercise_statement: exerciseStatement,
    user_code: userCode,
  });
  return data;
}

// ---------- Progreso ----------

export async function fetchProgress(): Promise<ProgressResponse> {
  const { data } = await api.get<ProgressResponse>("/progress/me");
  return data;
}