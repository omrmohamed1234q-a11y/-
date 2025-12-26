/**
 * Document Scanner Library
 * مكتبة مسح المستندات الذكية
 * 
 * توفر وظائف:
 * - اكتشاف حواف المستند تلقائياً
 * - تصحيح المنظور
 * - تطبيق فلاتر ذكية
 * - تحسين جودة النص
 */

// أنواع البيانات
export interface Point {
    x: number;
    y: number;
}

export interface DocumentCorners {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;
}

export type FilterType = 'original' | 'document' | 'grayscale' | 'blackwhite' | 'magic';

export interface ScanResult {
    originalImage: string;
    processedImage: string;
    corners: DocumentCorners | null;
    filter: FilterType;
}

export interface ScannedPage {
    id: string;
    image: string;
    thumbnail: string;
    filter: FilterType;
    timestamp: Date;
}

// ===== الفلاتر الذكية =====

/**
 * تطبيق فلتر على الصورة
 */
export function applyFilter(
    canvas: HTMLCanvasElement,
    filter: FilterType
): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (filter) {
        case 'grayscale':
            applyGrayscale(data);
            break;
        case 'blackwhite':
            applyBlackWhite(data);
            break;
        case 'document':
            applyDocumentFilter(data);
            break;
        case 'magic':
            applyMagicFilter(data);
            break;
        case 'original':
        default:
            // لا تطبيق فلتر
            break;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * فلتر الرمادي
 */
function applyGrayscale(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;     // red
        data[i + 1] = gray; // green
        data[i + 2] = gray; // blue
    }
}

/**
 * فلتر الأبيض والأسود الحاد
 */
function applyBlackWhite(data: Uint8ClampedArray, threshold: number = 128): void {
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const bw = gray > threshold ? 255 : 0;
        data[i] = bw;     // red
        data[i + 1] = bw; // green
        data[i + 2] = bw; // blue
    }
}

/**
 * فلتر المستندات - تحسين النصوص
 */
function applyDocumentFilter(data: Uint8ClampedArray): void {
    // 1. تحويل لرمادي
    const grayValues: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        grayValues.push(gray);
    }

    // 2. حساب الـ threshold التكيفي (Otsu's method مبسط)
    const histogram = new Array(256).fill(0);
    grayValues.forEach(v => histogram[Math.round(v)]++);

    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 128;
    const total = grayValues.length;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;

        wF = total - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;

        const variance = wB * wF * (mB - mF) * (mB - mF);
        if (variance > maxVariance) {
            maxVariance = variance;
            threshold = t;
        }
    }

    // 3. تطبيق مع تبييض الخلفية
    for (let i = 0; i < data.length; i += 4) {
        const gray = grayValues[i / 4];

        if (gray > threshold + 30) {
            // خلفية - تبييض
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
        } else if (gray < threshold - 30) {
            // نص - تسويد
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
        } else {
            // منطقة انتقالية - تحسين التباين
            const enhanced = gray < threshold ? gray * 0.5 : 255 - (255 - gray) * 0.5;
            data[i] = enhanced;
            data[i + 1] = enhanced;
            data[i + 2] = enhanced;
        }
    }
}

/**
 * الفلتر السحري - تحسين تلقائي شامل
 */
function applyMagicFilter(data: Uint8ClampedArray): void {
    // 1. حساب الإحصائيات
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (let i = 0; i < data.length; i += 4) {
        minR = Math.min(minR, data[i]);
        maxR = Math.max(maxR, data[i]);
        minG = Math.min(minG, data[i + 1]);
        maxG = Math.max(maxG, data[i + 1]);
        minB = Math.min(minB, data[i + 2]);
        maxB = Math.max(maxB, data[i + 2]);
    }

    // 2. تمديد الهيستوجرام (Histogram Stretching)
    const rangeR = maxR - minR || 1;
    const rangeG = maxG - minG || 1;
    const rangeB = maxB - minB || 1;

    for (let i = 0; i < data.length; i += 4) {
        // تمديد
        data[i] = ((data[i] - minR) / rangeR) * 255;
        data[i + 1] = ((data[i + 1] - minG) / rangeG) * 255;
        data[i + 2] = ((data[i + 2] - minB) / rangeB) * 255;

        // زيادة التشبع قليلاً
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const saturationBoost = 1.2;

        data[i] = Math.min(255, gray + (data[i] - gray) * saturationBoost);
        data[i + 1] = Math.min(255, gray + (data[i + 1] - gray) * saturationBoost);
        data[i + 2] = Math.min(255, gray + (data[i + 2] - gray) * saturationBoost);
    }
}

// ===== اكتشاف الحواف =====

/**
 * اكتشاف حواف المستند باستخدام خوارزمية بسيطة
 * (بديل خفيف لـ OpenCV)
 */
export function detectDocumentEdges(canvas: HTMLCanvasElement): DocumentCorners | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. تحويل لرمادي وتطبيق Sobel edge detection
    const edges = new Uint8Array(width * height);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;

            // حساب التدرج
            const gx =
                -1 * getGray(data, idx - 4 - width * 4) +
                1 * getGray(data, idx + 4 - width * 4) +
                -2 * getGray(data, idx - 4) +
                2 * getGray(data, idx + 4) +
                -1 * getGray(data, idx - 4 + width * 4) +
                1 * getGray(data, idx + 4 + width * 4);

            const gy =
                -1 * getGray(data, idx - 4 - width * 4) +
                -2 * getGray(data, idx - width * 4) +
                -1 * getGray(data, idx + 4 - width * 4) +
                1 * getGray(data, idx - 4 + width * 4) +
                2 * getGray(data, idx + width * 4) +
                1 * getGray(data, idx + 4 + width * 4);

            const magnitude = Math.sqrt(gx * gx + gy * gy);
            edges[y * width + x] = magnitude > 50 ? 255 : 0;
        }
    }

    // 2. البحث عن أقوى الأركان
    // نقسم الصورة لـ 4 أرباع ونبحث عن أقوى نقطة في كل ربع
    const corners: DocumentCorners = {
        topLeft: findCornerInRegion(edges, width, height, 0, 0, width / 2, height / 2, 'topLeft'),
        topRight: findCornerInRegion(edges, width, height, width / 2, 0, width, height / 2, 'topRight'),
        bottomLeft: findCornerInRegion(edges, width, height, 0, height / 2, width / 2, height, 'bottomLeft'),
        bottomRight: findCornerInRegion(edges, width, height, width / 2, height / 2, width, height, 'bottomRight'),
    };

    // التحقق من صحة الأركان
    if (isValidDocumentShape(corners, width, height)) {
        return corners;
    }

    // إرجاع الأركان الافتراضية (الصورة كاملة)
    return {
        topLeft: { x: 0, y: 0 },
        topRight: { x: width, y: 0 },
        bottomLeft: { x: 0, y: height },
        bottomRight: { x: width, y: height },
    };
}

function getGray(data: Uint8ClampedArray, idx: number): number {
    if (idx < 0 || idx >= data.length) return 0;
    return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
}

function findCornerInRegion(
    edges: Uint8Array,
    width: number,
    height: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
): Point {
    let bestPoint: Point = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    let bestScore = 0;

    for (let y = Math.floor(y1); y < Math.floor(y2); y++) {
        for (let x = Math.floor(x1); x < Math.floor(x2); x++) {
            if (edges[y * width + x] > 0) {
                // حساب النقاط بناءً على القرب من الركن
                let score = 0;
                switch (corner) {
                    case 'topLeft':
                        score = (x2 - x) + (y2 - y);
                        break;
                    case 'topRight':
                        score = (x - x1) + (y2 - y);
                        break;
                    case 'bottomLeft':
                        score = (x2 - x) + (y - y1);
                        break;
                    case 'bottomRight':
                        score = (x - x1) + (y - y1);
                        break;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestPoint = { x, y };
                }
            }
        }
    }

    return bestPoint;
}

function isValidDocumentShape(corners: DocumentCorners, width: number, height: number): boolean {
    // التحقق من أن الشكل منطقي
    const minArea = width * height * 0.1; // على الأقل 10% من الصورة

    // حساب مساحة المستطيل
    const area = calculateQuadArea(corners);

    return area >= minArea;
}

function calculateQuadArea(corners: DocumentCorners): number {
    // صيغة Shoelace
    const { topLeft, topRight, bottomRight, bottomLeft } = corners;

    return 0.5 * Math.abs(
        topLeft.x * topRight.y - topRight.x * topLeft.y +
        topRight.x * bottomRight.y - bottomRight.x * topRight.y +
        bottomRight.x * bottomLeft.y - bottomLeft.x * bottomRight.y +
        bottomLeft.x * topLeft.y - topLeft.x * bottomLeft.y
    );
}

// ===== تصحيح المنظور =====

/**
 * تصحيح منظور الصورة بناءً على الأركان المحددة
 */
export function correctPerspective(
    sourceCanvas: HTMLCanvasElement,
    corners: DocumentCorners,
    outputWidth?: number,
    outputHeight?: number
): HTMLCanvasElement {
    const srcCtx = sourceCanvas.getContext('2d');
    if (!srcCtx) return sourceCanvas;

    // حساب أبعاد المخرج
    const topWidth = Math.sqrt(
        Math.pow(corners.topRight.x - corners.topLeft.x, 2) +
        Math.pow(corners.topRight.y - corners.topLeft.y, 2)
    );
    const bottomWidth = Math.sqrt(
        Math.pow(corners.bottomRight.x - corners.bottomLeft.x, 2) +
        Math.pow(corners.bottomRight.y - corners.bottomLeft.y, 2)
    );
    const leftHeight = Math.sqrt(
        Math.pow(corners.bottomLeft.x - corners.topLeft.x, 2) +
        Math.pow(corners.bottomLeft.y - corners.topLeft.y, 2)
    );
    const rightHeight = Math.sqrt(
        Math.pow(corners.bottomRight.x - corners.topRight.x, 2) +
        Math.pow(corners.bottomRight.y - corners.topRight.y, 2)
    );

    const width = outputWidth || Math.max(topWidth, bottomWidth);
    const height = outputHeight || Math.max(leftHeight, rightHeight);

    // إنشاء كانفاس المخرج
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) return sourceCanvas;

    // الحصول على بيانات الصورة المصدر
    const srcImageData = srcCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const outputImageData = outputCtx.createImageData(width, height);

    // تطبيق التحويل العكسي (Inverse mapping)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // حساب الإحداثيات المصدر باستخدام الاستيفاء الثنائي الخطي
            const u = x / width;
            const v = y / height;

            // الاستيفاء بين الأركان
            const srcX = bilinearInterpolate(
                corners.topLeft.x, corners.topRight.x,
                corners.bottomLeft.x, corners.bottomRight.x,
                u, v
            );
            const srcY = bilinearInterpolate(
                corners.topLeft.y, corners.topRight.y,
                corners.bottomLeft.y, corners.bottomRight.y,
                u, v
            );

            // نسخ البكسل
            const srcIdx = (Math.floor(srcY) * sourceCanvas.width + Math.floor(srcX)) * 4;
            const dstIdx = (y * width + x) * 4;

            if (srcIdx >= 0 && srcIdx < srcImageData.data.length - 3) {
                outputImageData.data[dstIdx] = srcImageData.data[srcIdx];
                outputImageData.data[dstIdx + 1] = srcImageData.data[srcIdx + 1];
                outputImageData.data[dstIdx + 2] = srcImageData.data[srcIdx + 2];
                outputImageData.data[dstIdx + 3] = srcImageData.data[srcIdx + 3];
            }
        }
    }

    outputCtx.putImageData(outputImageData, 0, 0);
    return outputCanvas;
}

function bilinearInterpolate(
    tl: number, tr: number,
    bl: number, br: number,
    u: number, v: number
): number {
    const top = tl + (tr - tl) * u;
    const bottom = bl + (br - bl) * u;
    return top + (bottom - top) * v;
}

// ===== تحسين الصورة =====

/**
 * تحسين الصورة للطباعة
 */
export function enhanceForPrinting(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 1. زيادة الحدة (Unsharp mask مبسط)
    const sharpened = sharpenImage(canvas);

    return sharpened;
}

function sharpenImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);

    // Sharpen kernel
    const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                        sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
                    }
                }
                const idx = (y * width + x) * 4 + c;
                output[idx] = Math.max(0, Math.min(255, sum));
            }
        }
    }

    const outputImageData = new ImageData(output, width, height);
    ctx.putImageData(outputImageData, 0, 0);
    return canvas;
}

// ===== أدوات مساعدة =====

/**
 * تحويل صورة إلى كانفاس
 */
export function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(image, 0, 0);
    }

    return canvas;
}

/**
 * تحويل Data URL إلى كانفاس
 */
export async function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(imageToCanvas(img));
        img.onerror = reject;
        img.src = dataUrl;
    });
}

/**
 * تحويل كانفاس إلى Data URL
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number = 0.8): string {
    return canvas.toDataURL('image/jpeg', quality);
}

/**
 * تحويل كانفاس إلى Blob
 */
export function canvasToBlob(canvas: HTMLCanvasElement, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to convert canvas to blob'));
            },
            'image/jpeg',
            quality
        );
    });
}

/**
 * إنشاء thumbnail صغير
 */
export function createThumbnail(canvas: HTMLCanvasElement, maxSize: number = 150): HTMLCanvasElement {
    const ratio = canvas.width / canvas.height;
    let width = maxSize;
    let height = maxSize;

    if (ratio > 1) {
        height = maxSize / ratio;
    } else {
        width = maxSize * ratio;
    }

    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.width = width;
    thumbnailCanvas.height = height;

    const ctx = thumbnailCanvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(canvas, 0, 0, width, height);
    }

    return thumbnailCanvas;
}

/**
 * قص الصورة بناءً على المنطقة المحددة
 */
export function cropImage(
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number
): HTMLCanvasElement {
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = width;
    croppedCanvas.height = height;

    const ctx = croppedCanvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(
            canvas,
            x, y, width, height,  // source rectangle
            0, 0, width, height   // destination rectangle
        );
    }

    return croppedCanvas;
}

/**
 * توليد معرف فريد
 */
export function generateId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
