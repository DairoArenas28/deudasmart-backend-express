import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Requirements: 2.1, 2.2, 2.3, 2.4
export const loginValidator = [
  body('email')
    .notEmpty()
    .withMessage('El campo email es requerido')
    .bail()
    .isEmail()
    .withMessage('El formato del email es inválido'),

  body('password')
    .notEmpty()
    .withMessage('El campo password es requerido')
    .bail()
    .isLength({ min: 8 })
    .withMessage('El password debe tener al menos 8 caracteres'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    next();
  },
];
