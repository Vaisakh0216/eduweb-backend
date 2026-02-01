const express = require('express');
const router = express.Router();
const { courseController } = require('../controllers');
const { authenticate, authorize, validate } = require('../middlewares');
const { course: courseValidator } = require('../validators');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

// Get courses by college (all authenticated users)
router.get('/college/:collegeId', courseController.findByCollege);

router.post(
  '/',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(courseValidator.createCourseSchema),
  courseController.create
);

router.get('/', courseController.findAll);

router.get('/:id', courseController.findById);

router.put(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(courseValidator.updateCourseSchema),
  courseController.update
);

router.delete(
  '/:id',
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  courseController.remove
);

module.exports = router;
