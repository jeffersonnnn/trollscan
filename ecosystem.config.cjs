module.exports = {
  apps: [{
    name: 'trollscan',
    script: 'node',
    args: '.next/standalone/server.js',
    cwd: '/var/www/trollscan',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    }
  }]
}
