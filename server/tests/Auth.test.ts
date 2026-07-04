import { test, expect } from "bun:test";
import request from "supertest";
import app from "../src/index";

test("login success", async () => {
  const res = await request(app)
    .post("/login")
    .send({
      email: "admin@test.com",
      password: "1234",
    });

  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
});