import dotenv from 'dotenv';

dotenv.config();

const { default: app } = await import('./app.js');
const { default: connectDB } = await import('./config/db.js');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`SMCMS API listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received. Shutting down gracefully.`);
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
