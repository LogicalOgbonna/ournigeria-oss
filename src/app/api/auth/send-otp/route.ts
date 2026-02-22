import { z } from "zod";
import { phoneNumberSchema } from "@/lib/phone";
import { checkRateLimit, createOTP } from "@/lib/otp";
import { sendWhatsAppOTP } from "@/lib/whatsapp";

const requestSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { phoneNumber } = parsed.data;

    const rateLimited = await checkRateLimit(phoneNumber);
    if (rateLimited) {
      return Response.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 },
      );
    }

    const code = await createOTP(phoneNumber);

    const result = await sendWhatsAppOTP(phoneNumber, code);
    if (!result.success) {
      return Response.json(
        { error: "Failed to send OTP via WhatsApp. Please try again." },
        { status: 502 },
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
