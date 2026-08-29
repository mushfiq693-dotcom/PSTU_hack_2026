import { SmsProvider } from './smsProvider.interface';
import { Logger } from '../../utils/logger';

export class DemoSmsProvider implements SmsProvider {
  private isProduction: boolean = process.env.NODE_ENV === 'production';

  public async sendOtp(phone: string, otp: string): Promise<void> {
    if (!this.isProduction) {
      // In Development mode, log a clearly marked message for testing
      Logger.info('OTP', 'DEMO_MODE', `[DEMO OTP DISPATCH] phone=${phone} expiresIn=300s (Development OTP: ${otp})`, {
        phone,
        expiresIn: '300s',
      });
    } else {
      // In Production, never log the plaintext OTP
      Logger.info('OTP', 'SENT', `SMS dispatched via provider to ${phone}`, {
        phone,
      });
    }
  }
}

export const defaultSmsProvider = new DemoSmsProvider();
