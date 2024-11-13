module.exports = {
  apps: [
    {
      name: "my-app",
      script: "npm",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      out_file: "~/.pm2/logs/my-app-out.log", // stdout 로그 경로
      error_file: "~/.pm2/logs/my-app-error.log", // stderr 로그 경로
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
