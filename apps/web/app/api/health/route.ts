// end point to check health in nextjs 14

export async function GET(request: Request) {
  return Response.json({
    status: 200,
    body: {
      status: "healthy",
      uptime: process.uptime(),
      timestamp: Date.now(),
      service: "web",
    },
  });
}
