import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

@Injectable()
export class CertificateService {
  private templatePath = path.join(__dirname, 'templates', 'certificate.html');

  async generateCertificate(studentName: string, courseName: string, date: string): Promise<Buffer> {
    // Load HTML template
    let html = await fs.readFile(this.templatePath, 'utf-8');
    html = html.replace(/{{studentName}}/g, studentName)
               .replace(/{{courseName}}/g, courseName)
               .replace(/{{date}}/g, date);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }
} 