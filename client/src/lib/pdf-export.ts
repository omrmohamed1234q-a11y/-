/**
 * PDF Export Library - Using pdf-lib for reliable multi-page support
 * مكتبة تصدير PDF - استخدام pdf-lib لدعم متعدد الصفحات
 */

import { PDFDocument } from 'pdf-lib';
import type { ScannedPage } from './document-scanner';

export interface PDFExportOptions {
    pageSize?: 'a4' | 'a3' | 'letter';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
    title?: string;
}

const PAGE_SIZES = {
    a4: { width: 210, height: 297 },
    a3: { width: 297, height: 420 },
    letter: { width: 216, height: 279 },
};

/**
 * الحصول على أبعاد الصورة
 */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

/**
 * إنشاء PDF من الصور وإرجاع البيانات
 * Create PDF from images and return bytes (for upload to print)
 */
export async function createPDFBytes(
    images: string[],
    options: PDFExportOptions = {}
): Promise<Uint8Array> {
    const {
        pageSize = 'a4',
        margin = 10,
        title = 'Scanned Document',
    } = options;

    console.log('=== Creating PDF Bytes ===');
    console.log('Images count:', images.length);

    // Create new PDF document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(title);
    pdfDoc.setSubject('Scanned document from Itbaaly');
    pdfDoc.setCreator('Itbaaly - Document Scanner');
    pdfDoc.setAuthor('Itbaaly');

    // Page dimensions in points (A4 = 595x842 points)
    const pageWidth = PAGE_SIZES[pageSize].width * 2.83465; // mm to points
    const pageHeight = PAGE_SIZES[pageSize].height * 2.83465;
    const marginPoints = margin * 2.83465;

    // Add each image as a new page
    for (let i = 0; i < images.length; i++) {
        // Remove data URL prefix
        const base64Data = images[i].split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Embed image (supports PNG and JPEG)
        let image;
        if (images[i].startsWith('data:image/png')) {
            image = await pdfDoc.embedPng(imageBytes);
        } else {
            image = await pdfDoc.embedJpg(imageBytes);
        }

        // Create new page
        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate image dimensions to fit page with margin
        const imgDims = image.scale(1);
        const availableWidth = pageWidth - (marginPoints * 2);
        const availableHeight = pageHeight - (marginPoints * 2);

        const scale = Math.min(
            availableWidth / imgDims.width,
            availableHeight / imgDims.height
        );

        const scaledWidth = imgDims.width * scale;
        const scaledHeight = imgDims.height * scale;

        // Center image on page
        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        // Draw image
        page.drawImage(image, {
            x,
            y,
            width: scaledWidth,
            height: scaledHeight,
        });
    }

    // Save and return PDF bytes
    const pdfBytes = await pdfDoc.save();
    console.log(`✅ PDF created: ${pdfDoc.getPageCount()} pages, ${(pdfBytes.length / 1024).toFixed(1)} KB`);

    return pdfBytes;
}

/**
 * إنشاء PDF من الصور وحفظه
 * يستخدم hidden iframe لتحميل مباشر بدون blob URL
 */
export async function createAndSavePDF(
    images: string[],
    filename: string,
    options: PDFExportOptions = {}
): Promise<void> {
    const {
        pageSize = 'a4',
        margin = 10,
        title = 'Scanned Document',
    } = options;

    console.log('=== PDF Export Start (pdf-lib) ===');
    console.log('Images count:', images.length);

    // Create new PDF document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(title);
    pdfDoc.setSubject('Scanned document from Itbaaly');
    pdfDoc.setCreator('Itbaaly - Document Scanner');
    pdfDoc.setAuthor('Itbaaly');

    // Page dimensions in points (A4 = 595x842 points)
    const pageWidth = PAGE_SIZES[pageSize].width * 2.83465; // mm to points
    const pageHeight = PAGE_SIZES[pageSize].height * 2.83465;
    const marginPoints = margin * 2.83465;

    console.log(`📄 Page size: ${pageWidth.toFixed(1)}x${pageHeight.toFixed(1)} points`);

    // Add each image as a new page
    for (let i = 0; i < images.length; i++) {
        console.log(`\n🖼️ Processing image ${i + 1} of ${images.length}`);

        try {
            // Remove data URL prefix
            const base64Data = images[i].split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            console.log(`📦 Image ${i + 1} size: ${(imageBytes.length / 1024).toFixed(1)} KB`);

            // Embed image (supports PNG and JPEG)
            let image;
            if (images[i].startsWith('data:image/png')) {
                image = await pdfDoc.embedPng(imageBytes);
                console.log(`🖼️ Embedded PNG image ${i + 1}`);
            } else {
                image = await pdfDoc.embedJpg(imageBytes);
                console.log(`🖼️ Embedded JPG image ${i + 1}`);
            }

            // Create new page
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            console.log(`📄 Added page ${i + 1}`);

            // Calculate image dimensions to fit page with margin
            const imgDims = image.scale(1);
            const availableWidth = pageWidth - (marginPoints * 2);
            const availableHeight = pageHeight - (marginPoints * 2);

            const scale = Math.min(
                availableWidth / imgDims.width,
                availableHeight / imgDims.height
            );

            const scaledWidth = imgDims.width * scale;
            const scaledHeight = imgDims.height * scale;

            // Center image on page
            const x = (pageWidth - scaledWidth) / 2;
            const y = (pageHeight - scaledHeight) / 2;

            console.log(`📍 Drawing image at (${x.toFixed(1)}, ${y.toFixed(1)}) size ${scaledWidth.toFixed(1)}x${scaledHeight.toFixed(1)}`);

            // Draw image
            page.drawImage(image, {
                x,
                y,
                width: scaledWidth,
                height: scaledHeight,
            });

            console.log(`✅ Image ${i + 1} added successfully`);
        } catch (error) {
            console.error(`❌ Error processing image ${i + 1}:`, error);
            throw error;
        }
    }

    const totalPages = pdfDoc.getPageCount();
    console.log(`\n📊 Total pages in PDF: ${totalPages}`);

    if (!filename.toLowerCase().endsWith('.pdf')) {
        filename += '.pdf';
    }

    // Save PDF
    console.log('💾 Saving PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log(`📦 PDF size: ${(pdfBytes.length / 1024).toFixed(1)} KB`);

    // VERIFY PDF by re-loading it
    console.log('🔍 Verifying PDF...');
    const verifyDoc = await PDFDocument.load(pdfBytes);
    const verifyPageCount = verifyDoc.getPageCount();
    console.log(`✅ Verification: PDF has ${verifyPageCount} pages`);

    if (verifyPageCount !== images.length) {
        console.error(`❌ ERROR: Expected ${images.length} pages but PDF has ${verifyPageCount}!`);
    }

    // Convert to base64 for server
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
        binary += String.fromCharCode(pdfBytes[i]);
    }
    const pdfBase64 = btoa(binary);

    console.log('📤 Sending to server for download...');

    // Create a temporary form and submit to trigger download
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/pdf/download';
    form.style.display = 'none';

    const dataInput = document.createElement('input');
    dataInput.type = 'hidden';
    dataInput.name = 'pdfData';
    dataInput.value = pdfBase64;
    form.appendChild(dataInput);

    const filenameInput = document.createElement('input');
    filenameInput.type = 'hidden';
    filenameInput.name = 'filename';
    filenameInput.value = filename;
    form.appendChild(filenameInput);

    document.body.appendChild(form);
    console.log(`📥 Submitting form to download: ${filename}`);
    form.submit();

    // Cleanup after a delay
    setTimeout(() => {
        document.body.removeChild(form);
    }, 1000);

    console.log('=== PDF Download Complete ===');
}

/**
 * إنشاء PDF من صفحات ممسوحة وحفظه
 */
export async function createAndSaveFromScannedPages(
    pages: ScannedPage[],
    filename: string,
    options: PDFExportOptions = {}
): Promise<void> {
    const images = pages.map(page => page.image);
    return createAndSavePDF(images, filename, options);
}

/**
 * حساب حجم PDF التقريبي (بـ MB)
 */
export function estimatePDFSize(imageCount: number, avgImageSizeKB: number = 500): number {
    const estimatedBytes = imageCount * avgImageSizeKB * 1024 + 50 * 1024;
    return estimatedBytes / (1024 * 1024);
}
