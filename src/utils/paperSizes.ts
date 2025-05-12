// Paper sizes in pixels at 96 DPI (standard screen resolution)
// 1 inch = 96 pixels at standard screen resolution

export interface PaperSize {
  name: string;
  width: number;
  height: number;
  description: string;
}

// Standard paper sizes
export const PAPER_SIZES: PaperSize[] = [
  {
    name: "A3",
    width: 1123, // 11.7 inches * 96 dpi
    height: 1587, // 16.5 inches * 96 dpi
    description: "A3 (297mm × 420mm)",
  },
  {
    name: "A4",
    width: 794, // 8.27 inches * 96 dpi
    height: 1123, // 11.7 inches * 96 dpi
    description: "A4 (210mm × 297mm)",
  },
  {
    name: "A5",
    width: 559, // 5.83 inches * 96 dpi
    height: 794, // 8.27 inches * 96 dpi
    description: "A5 (148mm × 210mm)",
  },
  {
    name: "B4",
    width: 944, // 9.84 inches * 96 dpi
    height: 1334, // 13.9 inches * 96 dpi
    description: "B4 (250mm × 353mm)",
  },
  {
    name: "B5",
    width: 693, // 7.17 inches * 96 dpi
    height: 984, // 10.12 inches * 96 dpi
    description: "B5 (176mm × 250mm)",
  },
  {
    name: "Letter",
    width: 816, // 8.5 inches * 96 dpi
    height: 1056, // 11 inches * 96 dpi
    description: "US Letter (8.5\" × 11\")",
  },
  {
    name: "Legal",
    width: 816, // 8.5 inches * 96 dpi
    height: 1344, // 14 inches * 96 dpi
    description: "US Legal (8.5\" × 14\")",
  },
  {
    name: "Tabloid",
    width: 1056, // 11 inches * 96 dpi
    height: 1632, // 17 inches * 96 dpi
    description: "Tabloid (11\" × 17\")",
  },
];

// Default paper size
export const DEFAULT_PAPER_SIZE = PAPER_SIZES.find((size) => size.name === "Letter") || PAPER_SIZES[0];

// Get paper size by name
export function getPaperSizeByName(name: string): PaperSize {
  return PAPER_SIZES.find((size) => size.name === name) || DEFAULT_PAPER_SIZE;
}

// Get paper size in landscape orientation
export function getLandscapeSize(size: PaperSize): PaperSize {
  return {
    ...size,
    width: size.height,
    height: size.width,
    description: `${size.description} (Landscape)`,
  };
}
