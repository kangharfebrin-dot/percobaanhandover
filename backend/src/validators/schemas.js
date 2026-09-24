const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const submitHandoverSchema = Joi.object({
  noPolisi: Joi.string().required(),
  shift: Joi.string().required(),
  status: Joi.string().valid('Aman', 'Perlu Perbaikan', 'DIBLOKIR').required(),
  locationLat: Joi.number().allow(null),
  locationLng: Joi.number().allow(null),
  // items harus berupa array string (JSON stringified) atau array object
  items: Joi.any().required(),
  issueItems: Joi.any().allow(null, '')
});

module.exports = {
  loginSchema,
  submitHandoverSchema
};
