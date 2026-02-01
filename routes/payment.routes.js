const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { paymentController } = require("../controllers");
const {
  authenticate,
  validate,
  filterByBranch,
  checkBranchAccess,
  preventStaffPaymentDelete,
} = require("../middlewares");
const { payment: paymentValidator } = require("../validators");

// Configure multer for file uploads
const uploadDir = path.join(__dirname, "../uploads/payments");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, GIF and PDF are allowed."),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

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
