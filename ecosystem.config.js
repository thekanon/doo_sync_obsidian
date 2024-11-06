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
      output: "./logs/out.log",
      error: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
