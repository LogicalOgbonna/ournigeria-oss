const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

interface SendResult {
  success: boolean;
  error?: string;
}

/**
 * Send an OTP code to a phone number via WhatsApp (Meta Cloud API).
 */
export async function sendWhatsAppOTP(
  phoneNumber: string,
  code: string,
): Promise<SendResult> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.error("WhatsApp env vars not configured");
    return { success: false, error: "WhatsApp not configured" };
  }

  // Strip the + prefix for the WhatsApp API
  const to = phoneNumber.replace(/^\+/, "");

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            body: `Your NaijaBudget verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
          },
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("WhatsApp API error:", res.status, body);
      return { success: false, error: "Failed to send WhatsApp message" };
    }

    return { success: true };
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return { success: false, error: "Failed to send WhatsApp message" };
  }
}
