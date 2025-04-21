import { Inject, Injectable } from '@nestjs/common';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EnvConfig } from './config.interface';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) {
    const filePath = `.env.${process.env.NODE_ENV || 'development'}`;
    const envFile = path.resolve(
      __dirname,
      `${process.env.NODE_ENV === 'production' ? '../../' : '../'}`,
      options.folder,
      filePath,
    );

    if (!fs.existsSync(envFile)) {
      throw new Error(`Config file ${envFile} does not exist`);
    }

    try {
      const config = dotenv.parse(fs.readFileSync(envFile));
      this.envConfig = { ...config, ...process.env };
    } catch (error) {
      throw new Error(`Error reading config file ${envFile}: ${error.message}`);
    }
  }

  get(key: string): string {
    const value = this.envConfig[key];
    if (!value) {
      console.log(`Config key "${key}" not found`);
      return '';
    }
    return value;
  }

  encrypt(value: string): string {
    const iv = crypto.randomBytes(Number(this.get('ENCRYPTION_IV_LENGTH')));
    const key = Buffer.from(this.get('ENCRYPTION_KEY'), 'utf8');

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(value: string): string {
    const [iv, encrypted] = value.split(':');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.get('ENCRYPTION_KEY')),
      Buffer.from(iv, 'hex'),
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
