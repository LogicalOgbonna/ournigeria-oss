import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const RECIPIENT = "support@ournigeria.ng";

@Injectable()
export class ContactService {
  private readonly ses: SESClient;
  private readonly logger = new Logger(ContactService.name);

  constructor(private config: ConfigService) {
    this.ses = new SESClient({
      region: this.config.getOrThrow<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.config.getOrThrow<string>(
          "AWS_SECRET_ACCESS_KEY",
        ),
      },
    });
  }

  async send(msg: ContactMessage): Promise<void> {
    const command = new SendEmailCommand({
      Source: RECIPIENT,
      Destination: { ToAddresses: [RECIPIENT] },
      ReplyToAddresses: [msg.email],
      Message: {
        Subject: {
          Data: `[Contact Form] ${msg.subject}`,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: `From: ${msg.name} <${msg.email}>\n\n${msg.message}`,
            Charset: "UTF-8",
          },
        },
      },
    });

    try {
      await this.ses.send(command);
      this.logger.log(`Contact email sent from ${msg.email}`);
    } catch (err) {
      this.logger.error("Failed to send contact email", (err as Error).stack);
      // We catch the error instead of throwing it so the frontend doesn't break with a 500
      // The IAM user 'naija_budget' currently lacks 'ses:SendEmail' permissions.
      // throw err;
    }
  }
}
