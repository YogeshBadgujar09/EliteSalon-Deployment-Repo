const express = require("express");
const routes = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const imageUpload = require("../utils/imageUpload");
const CustomerController = require("../controllers/CustomerController/CustomerController");
const authMiddleware = require("../middleware/authMiddleware");
const Service = require("../models/ServiceModel");
const Appointment = require("../models/AppointmentModel");
const Staff = require("../models/StaffModel");

const requireCustomer = [authMiddleware, authMiddleware.requireRole("customer")];

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

routes.post("/register", CustomerController.registerCustomer);
routes.post("/login", CustomerController.loginCustomer);
routes.post("/verifyotp", CustomerController.verifyOTP);
routes.post("/forgotpassword", CustomerController.forgotPassword);
routes.post("/resetpassword", CustomerController.resetPassword);
routes.post("/resendotp", CustomerController.resendCustomerOtp);

routes.post(
  "/uploadprofile",
  imageUpload.single("customerProfileImage"),
  CustomerController.uploadProfileImage
);

routes.put(
  "/update-profile",
  ...requireCustomer,
  imageUpload.single("customerProfileImage"),
  CustomerController.updateCustomerProfile
);

routes.post(
  "/change-password",
  ...requireCustomer,
  CustomerController.changeCustomerPassword
);

routes.get(
  "/get-product-customer/:customerPincode",
  CustomerController.getProductsForCustomerByPin
);

routes.get(
  "/get-service-customer/:customerPincode",
  CustomerController.getServiceForCustomerByPin
);

routes.put(
  "/cancel-appointment",
  ...requireCustomer,
  CustomerController.cancelAppointmentByCustomer
);
routes.get("/profile", ...requireCustomer, CustomerController.customerProfile);

routes.post("/nearby-salons", CustomerController.getNearbySalons);
routes.post("/get-service", CustomerController.getServiceByNearBySalons);
routes.post("/get-product", CustomerController.getProductByNearBySalons);

routes.post("/chatbot", ...requireCustomer, async (req, res) => {
  try {
    const customerId = req.data?.customerId;
    if (!customerId) {
      return res.status(401).json({ reply: "Please log in again to use the assistant." });
    }

    const message = req.body?.message || "";
    const normalizedMessage = (message || "").trim();

    if (!normalizedMessage) {
      return res.status(400).json({ reply: "Please type a message first." });
    }

    const lowerText = normalizedMessage.toLowerCase();

    const wantsBooking =
      lowerText.includes("book") ||
      lowerText.includes("appointment") ||
      lowerText.includes("schedule") ||
      lowerText.includes("reserve");

    if (wantsBooking) {
      const serviceQuery = normalizedMessage
        .replace(/book|appointment|schedule|reserve|for|me|please|today|tomorrow/gi, "")
        .trim();

      const serviceMatches = await Service.find({
        serviceName: {
          $regex: serviceQuery || ".",
          $options: "i",
        },
      }).limit(10);

      if (!serviceMatches || serviceMatches.length === 0) {
        return res.status(200).json({
          reply:
            "I can help with that. Please tell me which service you want, for example: Haircut, Facial, Hair Coloring, Beard Grooming.",
        });
      }

      const selectedService = serviceMatches[0];

      const dateMatch =
        normalizedMessage.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[-/ ]\w+[-/ ]\d{4}\b|\b\w+ \d{1,2}, \d{4}\b/i) ||
        normalizedMessage.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);

      const timeMatch = normalizedMessage.match(/\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(am|pm)\b/i);

      const appointmentDate =
        dateMatch && dateMatch[0]
          ? dateMatch[0]
          : new Date(Date.now() + 86400000).toISOString().slice(0, 10);

      const appointmentTime = timeMatch && timeMatch[0] ? timeMatch[0] : "10:00";

      const staff = await Staff.findOne({
        ownerId: selectedService.ownerId,
      });

      if (!staff) {
        return res.status(200).json({
          reply:
            "I found the service, but no staff is assigned to that salon yet. Please choose a salon/service manually from the booking page.",
        });
      }

      const existing = await Appointment.findOne({
        staffId: staff._id,
        appointmentDate,
        startTime: appointmentTime,
        appointmentStatus: { $in: ["PENDING", "CONFIRMED"] },
      });

      if (existing) {
        return res.status(200).json({
          reply: `That slot (${appointmentDate} at ${appointmentTime}) is already booked. Please choose another time or book from the appointment page.`,
        });
      }

      const appointment = new Appointment({
        customerId,
        ownerId: selectedService.ownerId,
        staffId: staff._id,
        services: [
          {
            serviceId: selectedService._id,
            serviceName: selectedService.serviceName,
            duration: selectedService.serviceDuration,
            price: selectedService.servicePrice,
          },
        ],
        appointmentDate,
        startTime: appointmentTime,
        endTime: appointmentTime,
        totalDuration: selectedService.serviceDuration,
        totalPrice: selectedService.servicePrice,
        appointmentStatus: "PENDING",
      });

      await appointment.save();

      return res.status(200).json({
        reply: `Your ${selectedService.serviceName} appointment has been booked successfully for ${appointmentDate} at ${appointmentTime}.`,
      });
    }

    if (!model) {
      return res.status(503).json({
        reply: "AI assistant is not configured on the server yet.",
      });
    }

    const services = await Service.find({}).limit(20).lean();
    const serviceList = services.map((s) => ({
      name: s.serviceName,
      price: s.servicePrice,
      duration: s.serviceDuration,
      type: s.serviceType,
    }));

    const promptText = `
You are EliteSalon AI assistant for a beauty salon app.
Use this actual service data:
${JSON.stringify(serviceList)}

Help customers with salon services, pricing, booking, rescheduling, support, and nearby salon information.
Keep replies short, friendly, and useful.
Do not invent services or prices.
Customer question: ${normalizedMessage}
`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const aiReply = response.text();

    return res.status(200).json({
      reply: aiReply,
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    return res.status(500).json({
      reply: "I’m having trouble connecting right now. Please try again in a moment.",
    });
  }
});

module.exports = routes;
