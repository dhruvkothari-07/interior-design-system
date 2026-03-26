const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

// Common validation rules
const rules = {
    // User validations
    signup: [
        body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email').custom(value => {
            const domain = value.split('@')[1];
            if (domain !== 'gmail.com' && domain !== 'yahoo.com') {
                throw new Error('Only @gmail.com or @yahoo.com emails are supported');
            }
            return true;
        }),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    signin: [
        body('username').trim().notEmpty().withMessage('Username required'),
        body('password').notEmpty().withMessage('Password required').custom(value => {
            const domain = value.split('@')[1];
            if (domain !== 'gmail.com' && domain !== 'yahoo.com') {
                throw new Error('Only @gmail.com or @yahoo.com emails are supported');
            }
            return true;
        }),
    ],

    // Client validations
    createClient: [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
        body('phone').optional({ checkFalsy: true }).isString().trim().isLength({ min: 5, max: 25 }).withMessage('Invalid phone')
    ],

    // Material validations
    createMaterial: [
        body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Name required'),
        body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
        body('unit').trim().notEmpty().withMessage('Unit required')
    ],

    // Quotation validations
    createQuotation: [
        body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title required'),
        body('client_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Valid client required'),
        body('client_name').optional().trim().isLength({ min: 2 }).withMessage('Client name required when creating new client')
    ],
    // Room validations
    createRoom: [
        body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Room name required')
    ],

    // Room material validations
    addRoomMaterial: [
        body('material_id').optional().isInt({ min: 1 }).withMessage('Invalid material'),
        body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
        body('description').optional().trim(),
        body('rate').optional().isFloat({ min: 0 }).withMessage('Rate must be positive')
    ],

    // Project validations
    createProject: [
        body('quotation_id').isInt({ min: 1 }).withMessage('Valid quotation ID required'),
        body('start_date').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid start date'),
        body('end_date').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid end date')
    ],

    // Common param validations
    idParam: [
        param('id').isInt({ min: 1 }).withMessage('Invalid ID')
    ]
};

module.exports = { validate, rules, body, param, query };
