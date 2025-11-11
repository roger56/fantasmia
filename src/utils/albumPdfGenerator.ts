import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { AMStory, MediaAsset, Album } from './indexedDB';

export interface AlbumGenerationConfig {
  minStoriesForAlbum: number;
  pageSize: string;
  margins: number;
  fontFamily: string;
  fontSizeBody: number;
  fontSizeTitles: number;
  imageStyleDefault: string;
}

export interface StoryForAlbum {
  story: AMStory;
  mediaAsset?: MediaAsset;
  pagesAlloc: { text: number; image: 1 };
}

export class AlbumPDFGenerator {
  private pdf: jsPDF;
  private config: AlbumGenerationConfig;
  private currentPage: number = 1;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;

  constructor(config: AlbumGenerationConfig) {
    this.config = config;
    
    // Setup page dimensions based on config
    const orientation = config.pageSize.includes('landscape') ? 'landscape' : 'portrait';
    const format = config.pageSize.includes('letter') ? 'letter' : 'a4';
    
    this.pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });
    
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = config.margins;
    this.contentWidth = this.pageWidth - (2 * this.margin);
  }

  async generateAlbum(
    title: string,
    author: string,
    stories: StoryForAlbum[],
    onProgress?: (progress: number, message: string) => void
  ): Promise<Blob> {
    try {
      // Cover page
      onProgress?.(5, 'Creazione copertina...');
      await this.addCoverPage(title, author, stories[0]?.mediaAsset);
      
      // Table of contents
      onProgress?.(10, 'Creazione indice...');
      this.addTableOfContents(stories);
      
      // Stories
      for (let i = 0; i < stories.length; i++) {
        const progress = 10 + ((i + 1) / stories.length) * 80;
        onProgress?.(progress, `Impaginazione storia ${i + 1}/${stories.length}...`);
        await this.addStoryChapter(stories[i]);
      }
      
      onProgress?.(95, 'Finalizzazione PDF...');
      const pdfBlob = this.pdf.output('blob');
      
      onProgress?.(100, 'Completato!');
      return pdfBlob;
    } catch (error) {
      console.error('Error generating album PDF:', error);
      throw error;
    }
  }

  private async addCoverPage(title: string, author: string, coverImage?: MediaAsset) {
    this.pdf.setFontSize(this.config.fontSizeTitles * 2);
    this.pdf.setFont(this.config.fontFamily, 'bold');
    
    // Center title
    const titleY = this.pageHeight / 3;
    this.pdf.text(title, this.pageWidth / 2, titleY, { align: 'center' });
    
    // Author
    this.pdf.setFontSize(this.config.fontSizeTitles);
    this.pdf.setFont(this.config.fontFamily, 'normal');
    this.pdf.text(`di ${author}`, this.pageWidth / 2, titleY + 15, { align: 'center' });
    
    // Cover image if available
    if (coverImage?.data) {
      try {
        const imageUrl = URL.createObjectURL(coverImage.data);
        const imgWidth = this.contentWidth * 0.6;
        const imgHeight = imgWidth * 0.75; // Aspect ratio
        const imgX = (this.pageWidth - imgWidth) / 2;
        const imgY = titleY + 30;
        
        this.pdf.addImage(imageUrl, 'WEBP', imgX, imgY, imgWidth, imgHeight);
        URL.revokeObjectURL(imageUrl);
      } catch (error) {
        console.error('Error adding cover image:', error);
      }
    }
    
    // Date
    this.pdf.setFontSize(this.config.fontSizeBody);
    const dateStr = new Date().toLocaleDateString('it-IT');
    this.pdf.text(dateStr, this.pageWidth / 2, this.pageHeight - this.margin, { align: 'center' });
    
    this.currentPage = 1;
  }

  private addTableOfContents(stories: StoryForAlbum[]) {
    this.pdf.addPage();
    this.currentPage++;
    
    this.pdf.setFontSize(this.config.fontSizeTitles);
    this.pdf.setFont(this.config.fontFamily, 'bold');
    this.pdf.text('Indice', this.margin, this.margin + 10);
    
    let yPos = this.margin + 25;
    this.pdf.setFontSize(this.config.fontSizeBody);
    this.pdf.setFont(this.config.fontFamily, 'normal');
    
    let pageNum = this.currentPage + 1;
    stories.forEach((item, index) => {
      if (yPos > this.pageHeight - this.margin - 10) {
        this.pdf.addPage();
        this.currentPage++;
        yPos = this.margin + 10;
      }
      
      const storyTitle = item.story.title || `Storia ${index + 1}`;
      this.pdf.text(`${index + 1}. ${storyTitle}`, this.margin + 5, yPos);
      this.pdf.text(`pag. ${pageNum}`, this.pageWidth - this.margin - 20, yPos);
      
      yPos += 10;
      pageNum += item.pagesAlloc.text + item.pagesAlloc.image;
    });
  }

  private async addStoryChapter(item: StoryForAlbum) {
    const { story, mediaAsset, pagesAlloc } = item;
    
    // Add text pages
    for (let i = 0; i < pagesAlloc.text; i++) {
      this.pdf.addPage();
      this.currentPage++;
      
      // Title on first page
      if (i === 0) {
        this.pdf.setFontSize(this.config.fontSizeTitles);
        this.pdf.setFont(this.config.fontFamily, 'bold');
        this.pdf.text(story.title, this.margin, this.margin + 10);
      }
      
      // Text content
      this.pdf.setFontSize(this.config.fontSizeBody);
      this.pdf.setFont(this.config.fontFamily, 'normal');
      
      const textY = i === 0 ? this.margin + 25 : this.margin + 10;
      const lines = this.pdf.splitTextToSize(story.text, this.contentWidth);
      
      // Calculate how many lines fit on this page
      const linesPerPage = Math.floor((this.pageHeight - textY - this.margin) / 7);
      const startLine = i * linesPerPage;
      const endLine = Math.min(startLine + linesPerPage, lines.length);
      const pageLines = lines.slice(startLine, endLine);
      
      this.pdf.text(pageLines, this.margin, textY);
      
      // Page number
      this.pdf.setFontSize(10);
      this.pdf.text(
        String(this.currentPage),
        this.pageWidth / 2,
        this.pageHeight - this.margin / 2,
        { align: 'center' }
      );
    }
    
    // Add image page
    this.pdf.addPage();
    this.currentPage++;
    
    if (mediaAsset?.data) {
      try {
        const imageUrl = URL.createObjectURL(mediaAsset.data);
        const imgWidth = this.contentWidth;
        const imgHeight = this.pageHeight - (2 * this.margin);
        
        this.pdf.addImage(imageUrl, 'WEBP', this.margin, this.margin, imgWidth, imgHeight);
        URL.revokeObjectURL(imageUrl);
      } catch (error) {
        console.error('Error adding story image:', error);
        // Add placeholder
        this.addImagePlaceholder();
      }
    } else {
      this.addImagePlaceholder();
    }
    
    // Page number on image page
    this.pdf.setFontSize(10);
    this.pdf.text(
      String(this.currentPage),
      this.pageWidth / 2,
      this.pageHeight - this.margin / 2,
      { align: 'center' }
    );
  }

  private addImagePlaceholder() {
    const boxWidth = this.contentWidth * 0.6;
    const boxHeight = boxWidth * 0.75;
    const boxX = (this.pageWidth - boxWidth) / 2;
    const boxY = (this.pageHeight - boxHeight) / 2;
    
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(boxX, boxY, boxWidth, boxHeight, 'FD');
    
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text('[Immagine non disponibile]', this.pageWidth / 2, this.pageHeight / 2, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);
  }
}

export async function generateAlbumZIP(
  album: Album,
  pdfBlob: Blob,
  stories: StoryForAlbum[]
): Promise<Blob> {
  const zip = new JSZip();
  
  // Add PDF
  zip.file('album.pdf', pdfBlob);
  
  // Add metadata JSON
  const metadata = {
    title: album.title,
    author: album.author,
    createdAt: album.createdAt,
    stories: album.stories,
    settings: album.settingsSnapshot
  };
  zip.file('album.json', JSON.stringify(metadata, null, 2));
  
  // Add images folder
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    for (const item of stories) {
      if (item.mediaAsset?.data) {
        const fileName = `${item.story.id}.webp`;
        imagesFolder.file(fileName, item.mediaAsset.data);
      }
    }
  }
  
  // Generate ZIP
  return await zip.generateAsync({ type: 'blob' });
}

export function calculatePagesAllocation(storyType: string): { text: number; image: 1 } {
  // CSS, "Cosa faccio da grande", GHOST → 1 page text + 1 page image
  const shortFormats = ['CSS', 'GHOST'];
  
  if (shortFormats.includes(storyType.toUpperCase())) {
    return { text: 1, image: 1 };
  }
  
  // All other types → 3 pages text + 1 page image
  return { text: 3, image: 1 };
}
