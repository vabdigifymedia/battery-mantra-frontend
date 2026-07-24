import { createServerFn } from "@tanstack/react-start";
import nodemailer from "nodemailer";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string(),
  mobile: z.string(),
  email: z.string().optional(),
  message: z.string(),
  recaptcha: z.string(),
});

export const sendContactEmail = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof contactSchema>) => data)
  .handler(async ({ data }) => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Battery Mantra" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `Congratulations! New enquiry from : Battery Mantra (Frontend)`,
      html: `
        <h2>New Contact Inquiry</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td><strong>Name</strong></td>
            <td>${data.name}</td>
          </tr>
          <tr>
            <td><strong>Mobile</strong></td>
            <td>${data.mobile}</td>
          </tr>
          <tr>
            <td><strong>Email</strong></td>
            <td>${data.email || "N/A"}</td>
          </tr>
          <tr>
            <td><strong>Message</strong></td>
            <td>${data.message}</td>
          </tr>
        </table>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email. Check SMTP configuration.");
    }
  });
