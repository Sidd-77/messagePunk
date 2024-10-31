import request from "supertest";
import app from "..";

describe("Message Service", () => {
    it("should return a health check", async () => {
        const response = await request(app).get("/health").expect(200);
        expect(response.body.status).toBe("healthy");
    })
})
