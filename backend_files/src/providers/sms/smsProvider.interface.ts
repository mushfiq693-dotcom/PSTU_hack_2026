export interface SmsProvider {
  /**
   * Sends an OTP to the target normalized phone number
   */
  sendOtp(phone: string, otp: string): Promise<void>;
}
