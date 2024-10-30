import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res
    .status(200)
    .json({
      status: "healthy",
      uptime: process.uptime(),
      timestamp: Date.now(),
      service: "web",
    });
}
