/**
 * Utility functions for text formatting that work with contenteditable elements
 */

/**
 * Apply a formatting command to the current selection
 * @param command The document.execCommand command to apply
 * @param value Optional value for the command
 * @returns true if the command was applied successfully
 */
export function formatSelection(command: string, value: string | boolean | null = null): boolean {
  try {
    // Make sure we have focus
    document.execCommand("styleWithCSS", false, "true");
    return document.execCommand(command, false, value as string);
  } catch (error) {
    console.error(`Error applying format ${command}:`, error);
    return false;
  }
}

/**
 * Apply bold formatting to the current selection
 */
export function toggleBold(): boolean {
  return formatSelection("bold");
}

/**
 * Apply italic formatting to the current selection
 */
export function toggleItalic(): boolean {
  return formatSelection("italic");
}

/**
 * Apply underline formatting to the current selection
 */
export function toggleUnderline(): boolean {
  return formatSelection("underline");
}

/**
 * Set the font family for the current selection
 * @param fontFamily The font family to apply
 */
export function setFontFamily(fontFamily: string): boolean {
  return formatSelection("fontName", fontFamily);
}

/**
 * Set the font size for the current selection
 * @param fontSize The font size to apply (in px)
 */
export function setFontSize(fontSize: number): boolean {
  return formatSelection("fontSize", fontSize.toString());
}

/**
 * Set the text color for the current selection
 * @param color The color to apply (CSS color value)
 */
export function setTextColor(color: string): boolean {
  return formatSelection("foreColor", color);
}

/**
 * Set the background color for the current selection
 * @param color The color to apply (CSS color value)
 */
export function setBackgroundColor(color: string): boolean {
  return formatSelection("backColor", color);
}

/**
 * Set the text alignment for the current selection
 * @param alignment The alignment to apply ('left', 'center', 'right', 'justify')
 */
export function setTextAlignment(alignment: "left" | "center" | "right" | "justify"): boolean {
  const command = `justify${alignment.charAt(0).toUpperCase()}${alignment.slice(1)}`;
  return formatSelection(command);
}

/**
 * Check if the current selection has a specific formatting
 * @param command The formatting command to check
 * @returns true if the selection has the formatting
 */
export function hasFormatting(command: string): boolean {
  try {
    return document.queryCommandState(command);
  } catch (error) {
    console.error(`Error checking format ${command}:`, error);
    return false;
  }
}

/**
 * Get the current value of a formatting command
 * @param command The formatting command to check
 * @returns The current value of the command
 */
export function getFormattingValue(command: string): string {
  try {
    return document.queryCommandValue(command);
  } catch (error) {
    console.error(`Error getting format value ${command}:`, error);
    return "";
  }
}

/**
 * Check if the current selection has bold formatting
 */
export function hasBold(): boolean {
  return hasFormatting("bold");
}

/**
 * Check if the current selection has italic formatting
 */
export function hasItalic(): boolean {
  return hasFormatting("italic");
}

/**
 * Check if the current selection has underline formatting
 */
export function hasUnderline(): boolean {
  return hasFormatting("underline");
}

/**
 * Get the font family of the current selection
 */
export function getFontFamily(): string {
  return getFormattingValue("fontName");
}

/**
 * Get the font size of the current selection
 */
export function getFontSize(): string {
  return getFormattingValue("fontSize");
}

/**
 * Get the text color of the current selection
 */
export function getTextColor(): string {
  return getFormattingValue("foreColor");
}

/**
 * Get the background color of the current selection
 */
export function getBackgroundColor(): string {
  return getFormattingValue("backColor");
}
