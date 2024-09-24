export default interface ResponseConfiguration {
  sub: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  returnCode: string[];
}
