import { db } from 'src/database/db'

export function useLogger(context = 'App') {
  const saveLog = async (level, message, meta = {}) => {
    await db.logs.add({
      level,
      message: `[${context}] ${message}`,
      timestamp: new Date().toISOString(),
      ...meta,
    });
  };

  return {
    info: (msg, meta) => saveLog('info', msg, meta),
    warn: (msg, meta) => saveLog('warn', msg, meta),
    error: (msg, meta) => saveLog('error', msg, meta),
    debug: (msg, meta) => saveLog('debug', msg, meta),
  };
}
