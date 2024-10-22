module.exports = {
  apps: [
    {
      name: "doo_sync_obsidian",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
      instances: 2,
      autorestart: true,
      exec_mode: "cluster",
    },
  ],
};
