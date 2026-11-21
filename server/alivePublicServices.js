import { createIdentityService } from "../alive/identity/identityService.js";
import { createPostgresIdentityRepository } from "../alive/identity/postgresIdentityRepository.js";
import { pool } from "./auth.js";
let identityService;
export function getAlivePublicIdentityService() {
  if (!identityService) identityService = createIdentityService({ repository: createPostgresIdentityRepository(pool) });
  return identityService;
}
