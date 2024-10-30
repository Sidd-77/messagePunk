const env = {
  // Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
  publicEnvs: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
  },

  // Server-side only environment variables
  privateEnvs: {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
  },
};

// Validate that all required environment variables are set
const validateEnv = () => {
  const missingEnvs: string[] = [];

  // Check public envs
  Object.entries(env.publicEnvs).forEach(([key, value]) => {
    if (!value) missingEnvs.push(`NEXT_PUBLIC_${key.toUpperCase()}`);
  });

  // Check private envs
  Object.entries(env.privateEnvs).forEach(([key, value]) => {
    if (!value) missingEnvs.push(key.toUpperCase());
  });

  if (missingEnvs.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingEnvs.join("\n")}`,
    );
  }

  return env;
};

export const validatedEnv = validateEnv();
