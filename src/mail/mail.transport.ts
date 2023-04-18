import * as nodemailer from 'nodemailer';
import expressHandlebars from 'nodemailer-express-handlebars';
import sgTransport from 'nodemailer-sendgrid-transport';

import AWS from 'aws-sdk';

export class MailTransport {
  private transporter;

  constructor(transport: string, templateEngine: string, options: any) {
    switch (transport) {
      case 'smtp':
        this.transporter = nodemailer.createTransport(options);
        break;
      case 'sendgrid':
        this.transporter = nodemailer.createTransport(sgTransport(options));
        break;
      case 'amazonSES':
        this.transporter = nodemailer.createTransport({
          SES: new AWS.SES(options),
        });
        break;
      default:
        throw new Error('Invalid transport');
    }
    switch (templateEngine) {
      case 'handlebars':
        try {
          this.transporter.use(
            'compile',
            expressHandlebars({
              viewEngine: {
                extname: '.hbs',
                partialsDir: 'src/mail/partials',
                layoutsDir: 'src/mail/layouts',
                defaultLayout: false,
              },
              viewPath: 'src/mail/layouts',
              extName: '.hbs',
            }),
          );
        } catch (error) {
          console.error('Something went wrong with template engine');
        }
        break;
      case 'nunjucks':
        // configure nunjucks here
        break;
      case 'pug':
        // configure pug here
        break;
      case 'ejs':
        // configure ejs here
        break;
      default:
        throw new Error('Invalid template engine');
    }
  }

  async sendEmail(message: {
    from: string;
    to: string;
    subject: string;
    template?: string;
    html?: string;
    context?: object;
  }) {
    try {
      return await this.transporter.sendMail(message);
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`);
    }
  }
}
