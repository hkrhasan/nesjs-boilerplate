import { Injectable } from '@nestjs/common';
import { MailTransport } from './mail.transport';
import Handlebars from 'handlebars';

@Injectable()
export class MailService {
    private mailTransport: MailTransport;
    private from = 'hkrhasan8010@gmail.com';

    private schema = {
        verification: {
            subject: 'User Verification',
            template: 'verification',
        },
        test: {
            subject: 'Test',
            template: 'test',
        },
        entityCreated: {
            subject: 'Bank Connected',
            template: 'entity-created',
        },
    };

    constructor() {
        this.mailTransport = new MailTransport('sendgrid', 'handlebars', {
            auth: {
                api_key:
                    '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',
            },
        });
    }

    async sendEmail(
        to: string,
        template: string | undefined = undefined,
        context: object,
        html: string | undefined = undefined,
        subject: string | undefined = undefined,
    ) {
        let htmlTemplate = html;

        if (htmlTemplate) {
            const template = Handlebars.compile(htmlTemplate, {
                noEscape: true,
            });
            htmlTemplate = template(context);
        }

        const message = {
            from: this.from,
            to,
            subject: subject ? subject : this.schema[template].subject,
            template: template ? this.schema[template].template : undefined,
            html: htmlTemplate ? htmlTemplate : undefined,
            context,
        };

        return await this.mailTransport.sendEmail(message);
    }
}
