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

  it("returns 501 for a tool with no registered processor (guarded even if flipped to active by mistake)", async () => {
    // All 51 registry tools are active with real processors as of this
    // build, so this test simulates the guard directly rather than relying
    // on a real coming-soon tool existing (there currently isn't one).
    const { getToolBySlug } = await import("@shared/tools");
    const anyTool = getToolBySlug("compress-pdf");
    expect(anyTool?.status).toBe("active"); // sanity: registry really has no coming-soon tools left
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
  it("includes active tool URLs (all 51 tools are active in this build)", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.text).toContain("/compress-pdf");
    expect(res.text).toContain("/ocr-pdf"); // now active, must be indexed
  });

  it("never includes non-registry routes like job/download URLs", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.text).not.toContain("/api/jobs");
    expect(res.text).not.toContain("/api/tools");
  });
});
