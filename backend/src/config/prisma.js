const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

// PrismaClient is attached to global in development to prevent exhausting database connection limit
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error', 'warn']
    });
  }
  prisma = global.prisma;
}

module.exports = prisma;
