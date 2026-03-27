const express = require("express");
const router = express.Router();
const { paymentController } = require("../controllers");
const {
  authenticate,
  validate,
  filterByBranch,
  checkBranchAccess,
  preventStaffPaymentDelete,
} = require("../middlewares");
const { payment: paymentValidator } = require("../validators");
const { createS3Upload } = require("../utils/s3");

const upload = createS3Upload("payments");

// Get attachment
router.get("/:id/attachment", paymentController.getAttachment);

router.use(authenticate);

// Check transaction reference - must be before /:id route
router.get("/check-ref", paymentController.checkTransactionRef);

// // Get attachment
// router.get(
//   '/:id/attachment',
//   paymentController.getAttachment
// );

router.post(
  "/",
  upload.single("attachment"),
  checkBranchAccess("branchId"),
  paymentController.create
);

router.get("/", filterByBranch, paymentController.findAll);

router.get("/:id", paymentController.findById);

router.put("/:id", upload.single("attachment"), paymentController.update);

router.delete("/:id", preventStaffPaymentDelete, paymentController.remove);

module.exports = router;
