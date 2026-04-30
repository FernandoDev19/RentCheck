import { Logger } from '@nestjs/common';
import * as Joi from 'joi';

const logger = new Logger('EnvConfigService');

logger.log('EnvConfigService');

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  TZ: Joi.string().default('UTC'),

  // Base de datos
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().integer().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_NAME: Joi.string().default('rentcheck_db'),

  // JWT
  JWT_SECRET: Joi.string().min(10).required(),

  // CORS
  CORS_ORIGIN: Joi.string().required(),

  // Admin seed
  ADMIN_USERNAME: Joi.string().required(),
  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().min(6).required(),
});

export interface EnvVars {
  NODE_ENV: 'development' | 'production' | 'test';
  TZ: string;

  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;

  JWT_SECRET: string;

  CORS_ORIGIN: string;

  ADMIN_USERNAME: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
}
