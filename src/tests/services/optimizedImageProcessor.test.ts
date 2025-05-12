import { describe, it, expect, beforeEach, vi } from "vitest";
import { processImages, processSvgElements, preloadImages } from "@/services/optimizedImageProcessor";

// Create a mock type for testing that matches the NodeListOf interface
// This avoids ESLint errors about NodeListOf not being defined
// We use 'any' here because we're mocking the DOM API and the exact type doesn't matter for testing
 
type MockElementList<T extends Element> = T[] & {
  item(index: number): T | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forEach(callback: (value: T, key: number, parent: any) => void): void;
};

describe("optimizedImageProcessor", () => {
  // Mock DOM elements
  let mockImg: HTMLImageElement;
  let mockContainer: HTMLDivElement;
  let mockSvg: SVGElement;
  let mockPolygon: SVGPolygonElement;

  // Create mock image collection
  const createMockImageCollection = (): MockElementList<HTMLImageElement> => {
    const collection = [mockImg] as MockElementList<HTMLImageElement>;
    collection.item = (index: number) => index === 0 ? mockImg : null;
    collection.forEach = Array.prototype.forEach;
    return collection;
  };

  // Create mock SVG collection
  const createMockSvgCollection = (): MockElementList<SVGElement> => {
    const collection = [mockSvg] as MockElementList<SVGElement>;
    collection.item = (index: number) => index === 0 ? mockSvg : null;
    collection.forEach = Array.prototype.forEach;
    return collection;
  };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Create mock elements
    mockImg = document.createElement("img");
    mockContainer = document.createElement("div");
    mockContainer.appendChild(mockImg);

    // Mock computed style
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      objectFit: "cover",
    } as CSSStyleDeclaration);

    // Create mock SVG elements
    mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    mockPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    mockSvg.appendChild(mockPolygon);
  });

  // Note: We use 'any' type casting in these tests to work around the NodeListOf type issue
  // This is acceptable in tests since we're just testing the functionality, not the types
  describe("processImages", () => {
    it("should set cross-origin attribute", () => {
      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockImg.crossOrigin).toBe("anonymous");
    });

    it("should make images visible", () => {
      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockImg.style.display).toBe("block");
      expect(mockImg.style.visibility).toBe("visible");
    });

    it("should apply correct styles for \"cover\" object-fit", () => {
      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockImg.style.objectFit).toBe("cover");
      expect(mockImg.style.width).toBe("100%");
      expect(mockImg.style.height).toBe("100%");
    });

    it("should apply correct styles for \"contain\" object-fit", () => {
      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        objectFit: "contain",
      } as CSSStyleDeclaration);

      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockImg.style.objectFit).toBe("contain");
      expect(mockImg.style.height).toBe("100%");
      expect(mockImg.style.width).toBe("auto");
    });

    it("should style the parent container correctly", () => {
      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockContainer.style.position).toBe("relative");
      expect(mockContainer.style.overflow).toBe("hidden");
      expect(mockContainer.style.boxSizing).toBe("border-box");
    });
  });

  describe("processSvgElements", () => {
    it("should add xmlns attribute if missing", () => {
      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processSvgElements(createMockSvgCollection() as any);
      expect(mockSvg.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
    });

    it("should make SVG elements visible", () => {
      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processSvgElements(createMockSvgCollection() as any);
      expect(mockSvg.style.display).toBe("block");
      expect(mockSvg.style.visibility).toBe("visible");
    });

    it("should add default attributes to polygon elements", () => {
      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processSvgElements(createMockSvgCollection() as any);
      expect(mockPolygon.getAttribute("fill")).toBe("#E2E8F0");
      expect(mockPolygon.getAttribute("stroke")).toBe("#CBD5E1");
      expect(mockPolygon.getAttribute("stroke-width")).toBe("1");
    });
  });

  describe("preloadImages", () => {
    it("should resolve when all images are loaded", async () => {
      // Create a mock array with the necessary properties
      const mockImages = [
        { complete: true },
        { complete: false, onload: null, onerror: null },
      ] as unknown as HTMLImageElement[];

      // Add item and forEach methods to make it compatible with NodeListOf
      const mockImageList = mockImages as unknown as MockElementList<HTMLImageElement>;
      mockImageList.item = (index: number) => index < mockImages.length ? mockImages[index] : null;
      mockImageList.forEach = Array.prototype.forEach;

      // Use our mock collection that mimics NodeListOf
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const promise = preloadImages(mockImageList as any);

      // Simulate the second image loading
      if (mockImages[1].onload) {
        // Use a more specific type instead of Function
        (mockImages[1].onload as () => void)();
      }

      await expect(promise).resolves.toBeUndefined();
    });
  });
});
