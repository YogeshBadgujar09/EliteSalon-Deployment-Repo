const express = require("express");
const routes = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAvailableSlots,
  bookAppointment,
  appointmentResult,
  getSalons,
  getOwnersAppointments,
  getCustomersAppointments,
  rescheduleAppointment,
} = require("../controllers/AppointmentController/appointmentController");

const requireCustomer = [authMiddleware, authMiddleware.requireRole("customer")];
const requireOwner = [authMiddleware, authMiddleware.requireRole("owner")];

routes.post("/slots", getAvailableSlots);
routes.post("/book", ...requireCustomer, bookAppointment);
routes.put("/appointment-result", ...requireOwner, appointmentResult);
routes.get("/get-salon/:pincode", getSalons);
routes.get("/get-appointment/:ownerId", ...requireOwner, getOwnersAppointments);
routes.get("/customer-appointments", ...requireCustomer, getCustomersAppointments);
routes.put("/reschedule-appointment", ...requireCustomer, rescheduleAppointment);

module.exports = routes;
