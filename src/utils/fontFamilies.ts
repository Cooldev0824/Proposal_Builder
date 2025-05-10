/**
 * Font families for the text editor
 * 
 * This file contains a list of font families that can be used in the text editor.
 * The fonts are categorized by type (sans-serif, serif, monospace, display, handwriting).
 * 
 * Note: These fonts rely on Google Fonts or system fonts. The Google Fonts need to be
 * loaded separately in the application.
 */

export interface FontFamily {
  name: string;
  value: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting';
  fallback: string;
}

// List of font families
export const FONT_FAMILIES: FontFamily[] = [
  // Sans-serif fonts
  {
    name: 'Roboto',
    value: 'Roboto',
    category: 'sans-serif',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Open Sans',
    value: 'Open Sans',
    category: 'sans-serif',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Lato',
    value: 'Lato',
    category: 'sans-serif',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Montserrat',
    value: 'Montserrat',
    category: 'sans-serif',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Poppins',
    value: 'Poppins',
    category: 'sans-serif',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Inter',
    value: 'Inter',
    category: 'sans-serif',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Nunito',
    value: 'Nunito',
    category: 'sans-serif',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Arial',
    value: 'Arial',
    category: 'sans-serif',
    fallback: 'sans-serif'
  },
  {
    name: 'Helvetica',
    value: 'Helvetica',
    category: 'sans-serif',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Verdana',
    value: 'Verdana',
    category: 'sans-serif',
    fallback: 'Geneva, sans-serif'
  },

  // Serif fonts
  {
    name: 'Merriweather',
    value: 'Merriweather',
    category: 'serif',
    fallback: 'Georgia, serif'
  },
  {
    name: 'Playfair Display',
    value: 'Playfair Display',
    category: 'serif',
    fallback: 'Georgia, serif'
  },
  {
    name: 'Lora',
    value: 'Lora',
    category: 'serif',
    fallback: 'Georgia, serif'
  },
  {
    name: 'Georgia',
    value: 'Georgia',
    category: 'serif',
    fallback: 'Times New Roman, serif'
  },
  {
    name: 'Times New Roman',
    value: 'Times New Roman',
    category: 'serif',
    fallback: 'serif'
  },
  {
    name: 'Garamond',
    value: 'EB Garamond',
    category: 'serif',
    fallback: 'Georgia, serif'
  },

  // Monospace fonts
  {
    name: 'Roboto Mono',
    value: 'Roboto Mono',
    category: 'monospace',
    fallback: 'monospace'
  },
  {
    name: 'Source Code Pro',
    value: 'Source Code Pro',
    category: 'monospace',
    fallback: 'monospace'
  },
  {
    name: 'Fira Code',
    value: 'Fira Code',
    category: 'monospace',
    fallback: 'monospace'
  },
  {
    name: 'Courier New',
    value: 'Courier New',
    category: 'monospace',
    fallback: 'monospace'
  },
  {
    name: 'Consolas',
    value: 'Consolas',
    category: 'monospace',
    fallback: 'monospace'
  },

  // Display fonts
  {
    name: 'Bebas Neue',
    value: 'Bebas Neue',
    category: 'display',
    fallback: 'Impact, sans-serif'
  },
  {
    name: 'Oswald',
    value: 'Oswald',
    category: 'display',
    fallback: 'Impact, sans-serif'
  },
  {
    name: 'Archivo Black',
    value: 'Archivo Black',
    category: 'display',
    fallback: 'Impact, sans-serif'
  },
  {
    name: 'Anton',
    value: 'Anton',
    category: 'display',
    fallback: 'Impact, sans-serif'
  },

  // Handwriting/script fonts
  {
    name: 'Dancing Script',
    value: 'Dancing Script',
    category: 'handwriting',
    fallback: 'cursive'
  },
  {
    name: 'Pacifico',
    value: 'Pacifico',
    category: 'handwriting',
    fallback: 'cursive'
  },
  {
    name: 'Caveat',
    value: 'Caveat',
    category: 'handwriting',
    fallback: 'cursive'
  },
  {
    name: 'Satisfy',
    value: 'Satisfy',
    category: 'handwriting',
    fallback: 'cursive'
  }
];

// Get all font families
export function getAllFontFamilies(): FontFamily[] {
  return FONT_FAMILIES;
}

// Get font families by category
export function getFontFamiliesByCategory(category: FontFamily['category']): FontFamily[] {
  return FONT_FAMILIES.filter(font => font.category === category);
}

// Get a font family by name
export function getFontFamilyByName(name: string): FontFamily | undefined {
  return FONT_FAMILIES.find(font => font.name === name);
}

// Get the CSS value for a font family (including fallbacks)
export function getFontFamilyValue(name: string): string {
  const font = getFontFamilyByName(name);
  if (font) {
    return `${font.value}, ${font.fallback}`;
  }
  return 'Roboto, Arial, sans-serif'; // Default fallback
}
