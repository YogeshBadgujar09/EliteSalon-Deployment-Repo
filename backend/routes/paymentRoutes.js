const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  createOrder,
  verifyPayment,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getRazorpayPayments,
} = require("../controllers/PaymentController/paymentController");

router.post(
  "/create-order",
  authMiddleware,
  authMiddleware.requireRole("owner", "customer"),
  createOrder
);
router.post(
  "/verify-payment",
  authMiddleware,
  authMiddleware.requireRole("owner", "customer"),
  verifyPayment
);
router.get(
  "/razorpay-payments",
  authMiddleware,
  authMiddleware.requireRole("admin"),
  getRazorpayPayments
);
router.post("/create-subscription-order", createSubscriptionOrder);
router.post("/verify-subscription-payment", verifySubscriptionPayment);

module.exports = router;
