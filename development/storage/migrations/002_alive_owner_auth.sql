-- ALIVE owner authentication is deliberately isolated from player accounts.
-- Apply manually to the ALIVE development database only after owner approval.
CREATE TABLE IF NOT EXISTS alive_owner_user (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alive_owner_session (
  id text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES alive_owner_user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS alive_owner_session_user_idx ON alive_owner_session("userId");

CREATE TABLE IF NOT EXISTS alive_owner_account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES alive_owner_user(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alive_owner_account_user_idx ON alive_owner_account("userId");

CREATE TABLE IF NOT EXISTS alive_owner_verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS alive_owner_verification_identifier_idx ON alive_owner_verification(identifier);

CREATE TABLE IF NOT EXISTS alive_owner_passkey (
  id text PRIMARY KEY,
  name text,
  "publicKey" text NOT NULL,
  "userId" text NOT NULL REFERENCES alive_owner_user(id) ON DELETE CASCADE,
  "credentialID" text NOT NULL UNIQUE,
  counter integer NOT NULL,
  "deviceType" text NOT NULL,
  "backedUp" boolean NOT NULL,
  transports text,
  "createdAt" timestamptz,
  aaguid text
);
CREATE INDEX IF NOT EXISTS alive_owner_passkey_user_idx ON alive_owner_passkey("userId");

-- Better Auth two-factor support and one-time backup codes.
ALTER TABLE alive_owner_user
  ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS alive_owner_two_factor (
  id text PRIMARY KEY,
  "userId" text NOT NULL UNIQUE REFERENCES alive_owner_user(id) ON DELETE CASCADE,
  secret text NOT NULL,
  "backupCodes" text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  "failedVerificationCount" integer NOT NULL DEFAULT 0,
  "lockedUntil" timestamptz
);
