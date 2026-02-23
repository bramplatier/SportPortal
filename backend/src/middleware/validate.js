const { validationResult } = require('express-validator');

/**
 * Middleware: Verwerk validatieresultaten van express-validator.
 * Geeft nette foutmeldingen terug bij ongeldige invoer.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({ error: 'Validatiefout', details: messages });
  }

  next();
}

module.exports = { handleValidationErrors };
