const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    contactPhone: {
      type: String,
      default: "+1 555-0101",
    },
    contactEmail: {
      type: String,
      default: "support@carhospi.com",
    },
    contactAddress: {
      type: String,
      default: "123 Garage Street, Auto City, AC 12345",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Settings", settingsSchema);
