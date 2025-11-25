// PM2 Ecosystem Configuration for RangerPlex AI
// Documentation: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'rangerplex-proxy',
      script: 'proxy_server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3010
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3010
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced features
      listen_timeout: 10000,
      kill_timeout: 5000,
      shutdown_with_message: true,

      // Restart delays
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Process management
      pid_file: './logs/rangerplex-proxy.pid'
    },
    {
      name: 'rangerplex-vite',
      script: 'node_modules/.bin/vite',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development'
      },
      // Logging
      error_file: './logs/pm2-vite-error.log',
      out_file: './logs/pm2-vite-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Vite needs a bit more time to start
      listen_timeout: 15000,
      kill_timeout: 3000,

      // Restart delays
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 2000,

      // Process management
      pid_file: './logs/rangerplex-vite.pid'
    }
  ]
};
