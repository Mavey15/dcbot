module.exports = {
  apps: [
    {
      name: 'dcbot',
      script: 'src/index.js',
      restart_delay: 3000,
      max_restarts: 20,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
