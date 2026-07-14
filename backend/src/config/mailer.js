import nodemailer from 'nodemailer';

import { env } from './env.js';

const createMailerTransport = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});

export default createMailerTransport;