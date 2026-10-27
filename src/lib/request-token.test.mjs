import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server.js";
import { roomConnection, roomToken } from "./request-token.ts";

const token = "a".repeat(21);
test("reads cookies from a proxied Next request without reconstructing Request", () => {
  const request = new Proxy(new NextRequest("http://localhost/api/realtime", {
    headers: { cookie: `locale=fr; x-auth-token=${token}; other=value` },
  }), {
    // Next's route proxy forwards getters to the original request (see
    // proxyNextRequest in next/dist/server/route-modules/app-route/module.js).
    get(target, property) { return Reflect.get(target, property, target); },
  });
  assert.equal(roomToken(request), token);
});
test("missing, malformed and similarly named cookies are rejected", () => {
  for (const cookie of ["", "x-auth-token=short", `other-x-auth-token=${token}`, `x-auth-token=${token}extra`]) {
    assert.equal(roomToken(new Request("http://localhost", { headers: { cookie } })), undefined);
  }
});


test("reads a realtime document generation from its path or an API header", () => {
  const connection = "g".repeat(21);
  assert.equal(roomConnection(new Request("http://localhost/api/realtime/" + connection + "?channel=room")), connection);
  assert.equal(roomConnection(new Request("http://localhost/api/room/ttl", {headers:{"x-room-connection":connection}})), connection);
  assert.equal(roomConnection(new Request("http://localhost/api/realtime/short")), undefined);
  assert.equal(roomConnection(new Request("http://localhost/api/realtime")), undefined);
});
