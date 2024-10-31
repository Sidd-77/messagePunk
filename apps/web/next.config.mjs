/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  headers: async () => {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
