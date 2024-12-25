import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  PORT: Joi.number().required(),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().required(),
  JWT_SECRET: Joi.string().required(),
});
