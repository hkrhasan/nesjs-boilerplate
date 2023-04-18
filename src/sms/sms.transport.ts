import { Twilio } from 'twilio';

export class SMSTransport {
  private transporter: Twilio;
  private options: { verifyServiceId: string; smsServiceId: string };

  constructor(transport: string, options: any) {
    this.options = options;

    switch (transport) {
      case 'twilio':
        this.transporter = new Twilio(
          options.accountSid,
          options.authToken, // Corrected typo here
        );
        break;
      default:
        throw new Error('Invalid transport');
    }
  }

  async twilioPhoneVerify(phone: string) {
    return await this.transporter.verify
      .services(this.options.verifyServiceId)
      .verifications.create({
        to: phone,
        channel: 'sms',
      });
  }

  async twilioOtpVerification(phone: string, otp: string) {
    return await this.transporter.verify
      .services(this.options.verifyServiceId)
      .verificationChecks.create({
        to: phone,
        code: otp,
      });
  }

  async twilioMessageSend(to: string, body: string) {
    return await this.transporter.messages.create({
      to,
      body,
      messagingServiceSid: this.options.smsServiceId,
    });
  }
}
