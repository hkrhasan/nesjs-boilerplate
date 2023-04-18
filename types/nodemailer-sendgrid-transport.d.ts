declare module 'nodemailer-sendgrid-transport' {
  import * as nodemailer from 'nodemailer';

  interface Options {
    apiKey: string;
  }

  function sendgridTransport(options: Options): nodemailer.Transport;

  export = sendgridTransport;
}
