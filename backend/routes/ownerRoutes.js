const express = require("express");
const router = express.Router();
const OwnerController = require("../controllers/OwnerController/OwnerController");
const imageUpload = require("../utils/imageUpload");
const authMiddleware = require("../middleware/authMiddleware");

const requireOwner = [authMiddleware, authMiddleware.requireRole("owner")];

// Public onboarding & auth routes
router.post(
  "/register",
  imageUpload.fields([
    { name: "ownerShopCertificate", maxCount: 1 },
    { name: "shopFrontPhoto", maxCount: 1 },
    { name: "shopInsidePhoto", maxCount: 1 },
  ]),
  OwnerController.registerOwner
);

router.post("/login", OwnerController.loginOwner);
router.post("/verifyotp", OwnerController.verifyOTP);
router.post("/forgotpassword", OwnerController.forgotPassword);
router.post("/resetpassword", OwnerController.resetPassword);
router.post("/resendotp", OwnerController.resendOwnerOtp);
router.post("/staff-verify", OwnerController.staffOTPverify);

// Customer-accessible salon catalog read routes
router.get("/allservices/:ownerId", OwnerController.searchServicesByOwnerId);
router.get("/viewall-products/:ownerId", OwnerController.viewAllProductsByOwnerId);
router.get("/search-product/:productId", OwnerController.searchProduct);
router.get("/staff-list/:ownerId", OwnerController.getOwnerStaff);

// Protected owner profile route
router.put(
  "/update-owner/:id",
  ...requireOwner,
  imageUpload.single("ownerProfileImage"),
  OwnerController.updateOwnerProfile
);

// Protected Services Operations
router.post("/add-service", ...requireOwner, imageUpload.array("serviceImages", 3), OwnerController.addService);
router.put("/update-service/:serviceId", ...requireOwner, imageUpload.array("serviceImages", 3), OwnerController.updateService);
router.put("/search-service/:serviceId", ...requireOwner, OwnerController.searchServices);
router.delete("/delete-service/:serviceId", ...requireOwner, OwnerController.deleteService);

// Protected Product Operations
router.post("/add-product", ...requireOwner, imageUpload.array("productImages", 3), OwnerController.addProduct);
router.put("/update-product/:productId", ...requireOwner, imageUpload.array("productImages", 3), OwnerController.updateProduct);
router.delete("/delete-product/:productId", ...requireOwner, OwnerController.deleteProduct);

// Protected Staff Operations
router.post("/add-staff/:ownerId", ...requireOwner, imageUpload.single("staffProfile"), OwnerController.addStaff);
router.put("/staff-update/:staffId", ...requireOwner, imageUpload.single("staffProfile"), OwnerController.updateStaff);
router.delete("/staff-delete/:staffId", ...requireOwner, OwnerController.deleteStaff);

// Protected Owner Analytics
router.get("/total-customers/:ownerId", ...requireOwner, OwnerController.totalOwnerCustomers);
router.get("/total-services/:ownerId", ...requireOwner, OwnerController.totalOwnerServices);
router.get("/total-earning/:ownerId", ...requireOwner, OwnerController.totalOwnerEarning);
router.get("/total-appointments/:ownerId", ...requireOwner, OwnerController.totalOwnerAppointments);
router.get("/dashboard-stats/:ownerId", ...requireOwner, OwnerController.getOwnerDashboardStats);

module.exports = router;
