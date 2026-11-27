const express = require("express");
const routes = express.Router();
const AdminController = require("../controllers/AdminController/AdminController");
const authMiddleware = require("../middleware/authMiddleware");

const requireAdmin = [authMiddleware, authMiddleware.requireRole("admin")];

routes.post("/login", AdminController.loginAdmin);

routes.put("/approve/:ownerId", ...requireAdmin, AdminController.approveOwner);
routes.get("/owner-request", ...requireAdmin, AdminController.ownerRequest);
routes.get("/get-owners-list", ...requireAdmin, AdminController.getAllOwnersList);
routes.get("/get-customers-list", ...requireAdmin, AdminController.getAllCustomersList);

routes.get("/get-deactive-customers-list", ...requireAdmin, AdminController.getDeactiveCustomersList);
routes.get("/get-deactive-owners-list", ...requireAdmin, AdminController.getDeactiveOwnersList);

routes.put("/customer-status", ...requireAdmin, AdminController.deactivateCustomer);
routes.put("/owner-status", ...requireAdmin, AdminController.deactivateOwner);

// customer count
routes.get("/total-customers", ...requireAdmin, AdminController.totalCustomers);
routes.get("/active-customers-count", ...requireAdmin, AdminController.totalActiveCustomers);
routes.get("/deactive-customers-count", ...requireAdmin, AdminController.totalDeactiveCustomers);

// owner count
routes.get("/total-owners", ...requireAdmin, AdminController.totalOwners);
routes.get("/active-owners-count", ...requireAdmin, AdminController.totalActiveOwners);
routes.get("/deactive-owners-count", ...requireAdmin, AdminController.totalDeactiveOwners);
routes.get("/approved-owners-count", ...requireAdmin, AdminController.totalApprovedOwners);
routes.get("/pending-owners-count", ...requireAdmin, AdminController.totalPendingOwners);
routes.get("/confirmed-owners-count", ...requireAdmin, AdminController.totalConfirmedOwners);

// appointment count
routes.get("/total-appointments", ...requireAdmin, AdminController.totalAppointments);

// analytics
routes.get("/dashboard-stats", ...requireAdmin, AdminController.getAdminDashboardStats);

module.exports = routes;
