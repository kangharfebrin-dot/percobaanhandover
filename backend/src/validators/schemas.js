const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    'string.empty': 'Username tidak boleh kosong',
    'any.required': 'Username wajib diisi'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password tidak boleh kosong',
    'any.required': 'Password wajib diisi'
  })
});

const submitHandoverSchema = Joi.object({
  noPolisi: Joi.string().trim().required().messages({
    'string.empty': 'Nomor polisi kendaraan wajib diisi',
    'any.required': 'Nomor polisi kendaraan wajib diisi'
  }),
  shift: Joi.string().trim().required().messages({
    'string.empty': 'Shift / Waktu perjalanan wajib diisi',
    'any.required': 'Shift / Waktu perjalanan wajib diisi'
  }),
  type: Joi.string().valid('mulai', 'akhiri').default('mulai'),
  locationLat: Joi.number().allow(null, ''),
  locationLng: Joi.number().allow(null, ''),
  items: Joi.alternatives().try(Joi.string(), Joi.array()).required().messages({
    'any.required': 'Daftar item checklist wajib disertakan'
  }),
  amt1: Joi.string().allow(null, ''),
  amt2: Joi.string().allow(null, ''),
  userId: Joi.string().allow(null, '')
}).unknown(true);

const vehicleSchema = Joi.object({
  noPolisi: Joi.string().trim().required(),
  barcode: Joi.string().trim().required(),
  jenisKendaraan: Joi.string().allow(null, ''),
  brand: Joi.string().allow(null, ''),
  status: Joi.string().valid('Active', 'Maintenance', 'READY_TO_START', 'DIBLOKIR').default('Active')
});

const userManageSchema = Joi.object({
  name: Joi.string().trim().required(),
  username: Joi.string().trim().required(),
  password: Joi.string().allow('', null),
  role: Joi.string().valid('ADMIN', 'SUPER_ADMIN', 'PENGAWAS', 'AMT', 'USER'),
  jabatan: Joi.string().allow(null, '')
});

const checklistItemSchema = Joi.object({
  name: Joi.string().trim().required(),
  category: Joi.string().trim().required(),
  severity: Joi.string().valid('Major', 'Minor').default('Minor')
});

module.exports = {
  loginSchema,
  submitHandoverSchema,
  vehicleSchema,
  userManageSchema,
  checklistItemSchema
};
