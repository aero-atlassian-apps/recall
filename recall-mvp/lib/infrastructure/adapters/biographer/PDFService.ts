import { jsPDF } from "jspdf";
import { PDFPort } from "../../../core/application/ports/PDFPort";

export class PDFService implements PDFPort {
    async generateBook(chapters: { title: string; content: string }[], photos: string[]): Promise<Buffer> {
        const doc = new jsPDF();

        // Title Page
        doc.setFontSize(24);
        doc.text("My Life Story", 105, 100, { align: "center" });
        doc.setFontSize(12);
        doc.text("A Biography", 105, 110, { align: "center" });

        doc.addPage();

        // Chapters
        chapters.forEach((ch, index) => {
            if (index > 0) doc.addPage();

            doc.setFontSize(18);
            doc.text(ch.title, 20, 20);

            doc.setFontSize(12);
            // Split text to fit page
            const splitText = doc.splitTextToSize(ch.content, 170);
            doc.text(splitText, 20, 40);
        });

        // Photos (Mock implementation of adding pages for photos)
        // In real app, we'd need to fetch the image data (buffer) from the URL
        if (photos.length > 0) {
            doc.addPage();
            doc.setFontSize(18);
            doc.text("Photo Album", 20, 20);
            doc.setFontSize(10);
            doc.text(`(Includes ${photos.length} photos - placeholders)`, 20, 30);
        }

        const arrayBuffer = doc.output('arraybuffer');
        return Buffer.from(arrayBuffer);
    }

    /**
     * Generate PDF for a single chapter
     */
    async generateChapterPdf(chapter: {
        id: string;
        title: string;
        content: string;
        excerpt?: string;
        createdAt: Date
    }): Promise<Buffer> {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(24);
        doc.text(chapter.title, 20, 30);

        // Date
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        const dateStr = chapter.createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(dateStr, 20, 40);

        // Excerpt/Summary (if present)
        if (chapter.excerpt) {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            const excerptText = doc.splitTextToSize(chapter.excerpt, 170);
            doc.text(excerptText, 20, 55);
            doc.setFont('helvetica', 'normal');
        }

        // Content
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const startY = chapter.excerpt ? 75 : 55;
        const splitContent = doc.splitTextToSize(chapter.content, 170);

        // Handle multi-page content
        let currentY = startY;
        const lineHeight = 7;
        const pageHeight = doc.internal.pageSize.height - 20;

        splitContent.forEach((line: string) => {
            if (currentY + lineHeight > pageHeight) {
                doc.addPage();
                currentY = 20;
            }
            doc.text(line, 20, currentY);
            currentY += lineHeight;
        });

        // Footer on last page
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated with Recall - Your Memory Companion', 105, doc.internal.pageSize.height - 10, { align: 'center' });

        const arrayBuffer = doc.output('arraybuffer');
        return Buffer.from(arrayBuffer);
    }
}

