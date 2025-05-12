/**
 * PDF Exporter Fix
 *
 * This script contains the fixes needed for the PDF exporter to properly render
 * the document without UI controls showing up in the exported PDF.
 *
 * Instructions:
 * 1. Find the PdfExporter.vue file in your project
 * 2. Locate the section where elements are processed before rendering
 * 3. Replace that section with the code below
 * 4. Save the file and test the PDF export
 */

// Find this section in your PdfExporter.vue file:
// Process all elements to ensure they're visible and properly styled
// const allElements = pageClone.querySelectorAll('*');
// allElements.forEach((el) => {
//   if (el instanceof HTMLElement) {
//     // Make sure all elements are visible
//     el.style.visibility = 'visible';
//     el.style.opacity = '1';
//
//     // Ensure proper positioning
//     if (el.style.position === 'absolute') {
//       // Make sure absolute positioned elements maintain their position
//       const left = parseFloat(el.style.left || '0');
//       const top = parseFloat(el.style.top || '0');
//       el.style.left = `${left}px`;
//       el.style.top = `${top}px`;
//     }
//   }
// });

// Replace it with this code:
// Process all elements to ensure they're visible and properly styled
// const allElements = pageClone.querySelectorAll("*");
// allElements.forEach((el) => {
//   if (el instanceof HTMLElement) {
//     // Hide UI controls that shouldn't appear in the PDF
//     if (
//       el.classList.contains("resize-handle") ||
//       el.classList.contains("scroll-control") ||
//       el.classList.contains("v-navigation-drawer") ||
//       el.classList.contains("v-overlay") ||
//       el.classList.contains("v-menu") ||
//       el.classList.contains("v-btn--icon") ||
//       el.tagName === "BUTTON" ||
//       (el.getAttribute("role") === "button") ||
//       el.classList.contains("control-button") ||
//       el.classList.contains("handle") ||
//       el.classList.contains("v-slider") ||
//       el.classList.contains("v-input__control")
//     ) {
//       el.style.display = "none";
//       el.style.visibility = "hidden";
//       el.style.opacity = "0";
//       return;
//     }
//
//     // Make sure all other elements are visible
//     el.style.visibility = "visible";
//     el.style.opacity = "1";
//
//     // Ensure proper positioning
//     if (el.style.position === "absolute") {
//       // Make sure absolute positioned elements maintain their position
//       const left = parseFloat(el.style.left || "0");
//       const top = parseFloat(el.style.top || "0");
//       el.style.left = `${left}px`;
//       el.style.top = `${top}px`;
//     }
//   }
// });

/**
 * Additional Fixes:
 *
 * 1. Also find the html2canvas configuration and update it to:
 *
 * const canvas = await html2canvas(pageClone, {
 *   scale: 3, // Higher scale for better quality
 *   useCORS: true,
 *   allowTaint: true,
 *   backgroundColor: "white",
 *   logging: true,
 *   width: paperSize.width,
 *   height: paperSize.height,
 *   x: 0,
 *   y: 0,
 *   scrollX: 0,
 *   scrollY: 0,
 *   windowWidth: paperSize.width,
 *   windowHeight: paperSize.height,
 *   ignoreElements: (element) => {
 *     // Ignore UI controls
 *     return (
 *       element.tagName === "BUTTON" ||
 *       element.classList.contains('resize-handle') ||
 *       element.classList.contains('scroll-control') ||
 *       element.classList.contains('v-btn--icon') ||
 *       element.classList.contains('handle') ||
 *       element.getAttribute('role') === 'button'
 *     );
 *   },
 *   onclone: (_) => {
 *     console.log("Processing html2canvas clone");
 *   },
 * });
 *
 * 2. Make sure to add the following CSS to your component:
 *
 * .pdf-page {
 *   .resize-handle,
 *   .scroll-control,
 *   .control-button,
 *   .handle,
 *   [role="button"],
 *   button {
 *     display: none !important;
 *     visibility: hidden !important;
 *     opacity: 0 !important;
 *   }
 * }
 */
