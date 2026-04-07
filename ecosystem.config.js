module.exports = {
  apps: [
    {
      name: "tindahanpos-prod",
      script: "server.js",
      cwd: "./.next/standalone",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // The standalone build requires env variables to be injected here
        // usually passed directly or through .env
      },
    },
  ],
};
