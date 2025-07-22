const Joi = require('joi');

const loginValidation = Joi.object ({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
})

const signupValidation = Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).optional().allow(''),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    photoURL: Joi.string().uri().optional().allow('')
})

const editProfileValidation = Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName:  Joi.string().min(2).max(50).optional().allow(''),
    bio:       Joi.string().allow(''),
    photoUrl:  Joi.string().uri().optional().allow('')
  })

  .min(1)
  .required()
  .unknown(false);

module.exports = {loginValidation, signupValidation, editProfileValidation};