import { describe, it, expect, beforeEach, vi } from "vitest";
import { processImages, processSvgElements, preloadImages } from "@/services/optimizedImageProcessor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockElementList<T extends Element> = T[] & {
  item(index: number): T | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forEach(callback: (value: T, key: number, parent: any) => void): void;
};

describe("optimizedImageProcessor", () => {
  let mockImg: HTMLImageElement;
  let mockContainer: HTMLDivElement;
  let mockSvg: SVGElement;
  let mockPolygon: SVGPolygonElement;

  const createMockImageCollection = (): MockElementList<HTMLImageElement> => {
    const collection = [mockImg] as MockElementList<HTMLImageElement>;
    collection.item = (index: number) => index === 0 ? mockImg : null;
    collection.forEach = Array.prototype.forEach;
    return collection;
  };

  const createMockSvgCollection = (): MockElementList<SVGElement> => {
    const collection = [mockSvg] as MockElementList<SVGElement>;
    collection.item = (index: number) => index === 0 ? mockSvg : null;
    collection.forEach = Array.prototype.forEach;
    return collection;
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockImg = document.createElement("img");
    mockContainer = document.createElement("div");
    mockContainer.appendChild(mockImg);

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      objectFit: "cover",
    } as CSSStyleDeclaration);

    mockSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    mockPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    mockSvg.appendChild(mockPolygon);
  });

  describe("processImages", () => {
    it("should set cross-origin attribute", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockImg.crossOrigin).toBe("anonymous");
    });

    it("should make images visible", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockImg.style.display).toBe("block");
      expect(mockImg.style.visibility).toBe("visible");
    });

    it("should apply correct styles for \"cover\" object-fit", () => {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockImg.style.objectFit).toBe("contain");
      expect(mockImg.style.height).toBe("100%");
      expect(mockImg.style.width).toBe("auto");
    });

    it("should style the parent container correctly", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processImages(createMockImageCollection() as any);
      expect(mockContainer.style.position).toBe("relative");
      expect(mockContainer.style.overflow).toBe("hidden");
      expect(mockContainer.style.boxSizing).toBe("border-box");
    });
  });

  describe("processSvgElements", () => {
    it("should add xmlns attribute if missing", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processSvgElements(createMockSvgCollection() as any);
      expect(mockSvg.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");
    });

    it("should make SVG elements visible", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processSvgElements(createMockSvgCollection() as any);
      expect(mockSvg.style.display).toBe("block");
      expect(mockSvg.style.visibility).toBe("visible");
    });

    it("should add default attributes to polygon elements", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      processSvgElements(createMockSvgCollection() as any);
      expect(mockPolygon.getAttribute("fill")).toBe("#E2E8F0");
      expect(mockPolygon.getAttribute("stroke")).toBe("#CBD5E1");
      expect(mockPolygon.getAttribute("stroke-width")).toBe("1");
    });
  });

  describe("preloadImages", () => {
    it("should resolve when all images are loaded", async () => {
      const mockImages = [
        { complete: true },
        { complete: false, onload: null, onerror: null },
      ] as unknown as HTMLImageElement[];

      const mockImageList = mockImages as unknown as MockElementList<HTMLImageElement>;
      mockImageList.item = (index: number) => index < mockImages.length ? mockImages[index] : null;
      mockImageList.forEach = Array.prototype.forEach;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const promise = preloadImages(mockImageList as any);

      if (mockImages[1].onload) {
        (mockImages[1].onload as () => void)();
      }

      await expect(promise).resolves.toBeUndefined();
    });
  });
});
