import { auth, pool } from "../../server/auth.js";
import { isSameOriginRequest } from "../../server/origin.js";
import { toWebHeaders } from "../../server/http.js";
import { createAliveIdentityApiHandler } from "../../server/aliveIdentityApi.js";

const handler = createAliveIdentityApiHandler({
  getSession: req => auth.api.getSession({ headers: toWebHeaders(req.headers) }),
  query: (sql, values) => pool.query(sql, values),
  isSameOrigin: isSameOriginRequest
});

export default handler;
