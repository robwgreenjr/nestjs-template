import { ISESSender } from "./ISESSender";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { AWSError, SES } from "aws-sdk";
import { SendEmailRequest } from "aws-sdk/clients/ses";

export const AWS_SES = "AWS_SES";

@Injectable()
export class SESSender implements ISESSender {
    constructor(private readonly configService: ConfigService) {}

    async sendEmail(
        to: string[],
        subject: string,
        htmlBody: string,
        textBody: string,
    ): Promise<void> {
        const charset = "UTF-8";

        try {
            const ses = new SES({
                apiVersion: this.configService.get<string>(
                    "AWS_SES_API_VERSION",
                ),
                region: this.configService.get<string>("AWS_SES_REGION"),
            });

            const params: SendEmailRequest = {
                Source: this.configService.get<string>("EMAIL_SOURCE") ?? "",
                Destination: {
                    ToAddresses: to,
                },
                Message: {
                    Subject: {
                        Data: subject,
                        Charset: charset,
                    },
                    Body: {
                        Text: {
                            Data: textBody,
                            Charset: charset,
                        },
                        Html: {
                            Data: htmlBody,
                            Charset: charset,
                        },
                    },
                },
            };

            await ses.sendEmail(params, async (err: AWSError) => {
                if (err) {
                    console.log(err);
                }
            });
        } catch (exception: any) {
            console.log(exception);
        }
    }
}
