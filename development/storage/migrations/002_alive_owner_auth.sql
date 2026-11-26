-- ALIVE owner authentication is deliberately isolated from player accounts.
-- Apply manually to the ALIVE development database only after owner approval.
CREATE TABLE IF NOT EXISTS public.alive_owner_user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alive_owner_session (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES public.alive_owner_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS alive_owner_session_user_idx ON public.alive_owner_session("userId");

CREATE TABLE IF NOT EXISTS public.alive_owner_account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES public.alive_owner_user(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS alive_owner_account_user_idx ON public.alive_owner_account("userId");

CREATE TABLE IF NOT EXISTS public.alive_owner_verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS alive_owner_verification_identifier_idx ON public.alive_owner_verification(identifier);

CREATE TABLE IF NOT EXISTS public.alive_owner_passkey (
  id TEXT PRIMARY KEY,
  name TEXT,
  "publicKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES public.alive_owner_user(id) ON DELETE CASCADE,
  "credentialID" TEXT NOT NULL UNIQUE,
  counter INTEGER NOT NULL,
  "deviceType" TEXT NOT NULL,
  "backedUp" BOOLEAN NOT NULL,
  transports TEXT,
  "createdAt" TIMESTAMPTZ,
  aaguid TEXT
);
CREATE INDEX IF NOT EXISTS alive_owner_passkey_user_idx ON public.alive_owner_passkey("userId");

ALTER TABLE public.alive_owner_user
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.alive_owner_two_factor (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES public.alive_owner_user(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  "backupCodes" TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMPTZ
);
