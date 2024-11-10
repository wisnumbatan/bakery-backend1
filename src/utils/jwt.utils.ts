import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logger from './logger';

export const generateJwtSecrets = (): void => {
  try {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    const accessSecret = crypto.randomBytes(32).toString('hex');
    const refreshSecret = crypto.randomBytes(32).toString('hex');

    // Update JWT secrets in .env
    if (envContent.includes('JWT_ACCESS_SECRET=')) {
      envContent = envContent.replace(/JWT_ACCESS_SECRET=.*/, `JWT_ACCESS_SECRET=${accessSecret}`);
    } else {
      envContent += `\nJWT_ACCESS_SECRET=${accessSecret}`;
    }

    if (envContent.includes('JWT_REFRESH_SECRET=')) {
      envContent = envContent.replace(/JWT_REFRESH_SECRET=.*/, `JWT_REFRESH_SECRET=${refreshSecret}`);
    } else {
      envContent += `\nJWT_REFRESH_SECRET=${refreshSecret}`;
    }

    fs.writeFileSync(envPath, envContent);
    logger.info('JWT secrets generated successfully');

    // Force reload environment variables
    Object.assign(process.env, {
      JWT_ACCESS_SECRET: accessSecret,
      JWT_REFRESH_SECRET: refreshSecret
    });
  } catch (error) {
    logger.error('Error generating JWT secrets:', error);
    throw error;
  }
};