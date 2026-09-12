# Code Tutor AI

Tutor de programación con IA: chat explicativo, generación/evaluación de ejercicios y seguimiento de progreso por usuario, organizado en módulos por lenguaje (Python, JavaScript, TypeScript, Go, Rust, Java).

- **Backend:** Python + FastAPI + PostgreSQL (SQLAlchemy) + JWT + Groq (`openai/gpt-oss-120b`)
- **Frontend:** React + TypeScript + Tailwind CSS + Radix UI (Vite)

## 1. Base de datos (Postgres)

Con Docker (recomendado):

```bash
docker compose up -d db
```

Esto levanta Postgres en `localhost:5432` con usuario `postgres` / password `postgres` / base `code_tutor_ai` (ver `docker-compose.yml`). Si ya tenés un Postgres propio, simplemente ajustá `DATABASE_URL` en el `.env` del backend.

## 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Editá .env:
#   - DATABASE_URL (si no usás los defaults de docker-compose)
#   - GROQ_API_KEY (https://console.groq.com/keys)
#   - JWT_SECRET_KEY (cualquier string largo y aleatorio, ej: `openssl rand -hex 32`)

uvicorn app.main:app --reload --port 8000
```

Al arrancar, `models.Base.metadata.create_all(bind=engine)` crea las tablas (`users`, `module_progress`) si no existen. Para producción se recomienda reemplazar esto por migraciones de Alembic (ya está en `requirements.txt` para que lo sumes cuando quieras).

Docs interactivas: `http://localhost:8000/docs`.

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # por defecto apunta a http://localhost:8000
npm run dev
```

Abrí `http://localhost:5173`. Te va a pedir crear cuenta (`/register`) o iniciar sesión (`/login`) antes de ver el dashboard.

## Autenticación

- **Registro** (`POST /auth/register`): guarda el usuario con password hasheado (argon2) y devuelve un JWT.
- **Login** (`POST /auth/login`): valida credenciales y devuelve un JWT (expira en `JWT_EXPIRE_MINUTES`, por defecto 7 días).
- El frontend guarda el token en `localStorage` y lo manda como `Authorization: Bearer <token>` en cada request (interceptor de axios).
- Todos los endpoints de tutor/ejercicios/progreso requieren el token y usan `Depends(get_current_user)` para saber de qué usuario se trata — ya no se manda `user_id` en el body.
- Si el token expira o es inválido, el backend responde 401 y el frontend limpia la sesión y redirige a `/login`.

## Cómo funciona el resto

- **Tutor:** system prompt propio por módulo/lenguaje; el historial de chat se reenvía en cada request para mantener contexto.
- **Ejercicios:** se le pide al modelo un JSON estricto (`title`, `statement`, `starter_code`, `hints`). Al enviar la solución, otro prompt evalúa el código (`correct`, `score`, `feedback`) y esto se guarda en la tabla `module_progress` (una fila por usuario+módulo, actualizada con cada intento).
- **Progreso:** `GET /progress/me` calcula intentos, aciertos y puntaje promedio por módulo para el usuario autenticado.
