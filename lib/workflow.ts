import { Client as WorkflowClient } from '@upstash/workflow';
import { Client as QStashClient } from '@upstash/qstash';
import emailjs from '@emailjs/browser';
import config from '@/lib/config';

export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashUrl,
  token: config.env.upstash.qstashToken,
});

const qstashClient = new QStashClient({
  token: config.env.upstash.qstashToken,
});

export const sendEmail = async ({
  email,
  subject,
  message,
}: {
  email: string;
  subject: string;
  message: string;
}) => {
  try {
    const response = await emailjs.send(
      config.env.emailJs.emailJsServiceId,
      config.env.emailJs.emailJstemplateId,
      {
        email,
        subject,
        message,
      },
      config.env.emailJs.emailJsPublicKey
    );
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
