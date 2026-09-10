import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { registerAllProcessors } from "../src/processors/register.js";

const app = createApp();

beforeAll(() => {
  registerAllProcessors();
});

describe("GET /api/health", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/tools", () => {
  it("returns the tool registry", async () => {
    const res = await request(app).get("/api/tools");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tools)).toBe(true);
    expect(res.body.tools.length).toBeGreaterThan(0);
  });
});

describe("POST /api/tools/:slug/run", () => {
  it("returns 404 for an unknown tool", async () => {
    const res = await request(app).post("/api/tools/not-a-real-tool/run").attach("files", Buffer.from("x"), "x.txt");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TOOL_NOT_FOUND");
  });

  it("returns 501 for a coming-soon tool", async () => {
    const res = await request(app)
      .post("/api/tools/ocr-pdf/run")
      .attach("files", Buffer.from("%PDF-1.4"), "test.pdf");
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe("TOOL_COMING_SOON");
  });

  it("rejects an upload with no files", async () => {
    const res = await request(app).post("/api/tools/compress-pdf/run");
    expect(res.status).toBe(400);
  });

  it("rejects a file whose content doesn't match its claimed format", async () => {
    const res = await request(app)
      .post("/api/tools/compress-pdf/run")
      .attach("files", Buffer.from("this is not really a pdf"), "fake.pdf");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FILE_SIGNATURE");
  });
});

describe("GET /sitemap.xml", () => {
  it("only includes active tool URLs", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.text).toContain("/compress-pdf");
    expect(res.text).not.toContain("/ocr-pdf"); // coming-soon, must not be indexed
  });
});
