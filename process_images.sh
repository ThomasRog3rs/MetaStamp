#!/bin/bash

# Configuration
INPUT_DIR="input_heic_images"  # Directory containing your .heic files
OUTPUT_DIR="output_png_with_date" # Directory where processed .png files will be saved
FONT_SIZE=120                   # Font size for the date text
FONT_COLOR="yellow"             # Color of the date text (e.g., black, white, red, #RRGGBB)
FONT_STROKE="black"            # Stroke color for the text (e.g., black, white, red, #RRGGBB)
FONT_STROKE_WIDTH=5            # Stroke width for the text (in pixels)
POSITION="SouthEast"           # Position of the text (NorthWest, North, NorthEast, West, Center, East, SouthWest, South, SouthEast)
X_OFFSET=20                    # X-offset from the specified position (pixels)
Y_OFFSET=20                    # Y-offset from the specified position (pixels)
DATE_FORMAT="%Y-%m-%d %H:%M:%S" # Format for the displayed date/time

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Processing HEIC images from '$INPUT_DIR'..."sss
echo "Output PNGs will be saved to '$OUTPUT_DIR'."

# Loop through each .heic file in the input directory
find "$INPUT_DIR" -type f -iname "*.heic" | while read -r HEIC_FILE; do
    if [[ ! -f "$HEIC_FILE" ]]; then
        echo "Skipping non-existent file: $HEIC_FILE"
        continue
    fi

    echo "Processing '$HEIC_FILE'..."

    # Get the base filename without extension
    BASENAME=$(basename "$HEIC_FILE" .heic)
    OUTPUT_PNG_FILE="$OUTPUT_DIR/${BASENAME}.png"

    # 1. Extract Date/Time Original using ExifTool
    # Try 'DateTimeOriginal' first, then 'CreateDate' if not found.
    # The -d option formats the date directly.
    DATETIME=$(exiftool -d "$DATE_FORMAT" -q -s -s -s -DateTimeOriginal "$HEIC_FILE")

    if [[ -z "$DATETIME" ]]; then
        DATETIME=$(exiftool -d "$DATE_FORMAT" -q -s -s -s -CreateDate "$HEIC_FILE")
    fi

    if [[ -z "$DATETIME" ]]; then
        echo "  Warning: Could not find 'DateTimeOriginal' or 'CreateDate' for '$HEIC_FILE'. Using file modification time."
        # Fallback to file modification time if no EXIF date is found
        DATETIME=$(date -r "$(stat -f %m "$HEIC_FILE")" +"$DATE_FORMAT")
        if [[ -z "$DATETIME" ]]; then
            echo "  Error: Could not determine any date for '$HEIC_FILE'. Skipping this file."
            continue
        fi
    fi

    # 2. Convert HEIC to PNG and overlay the date using ImageMagick
    # Use 'magick' command as 'convert' might conflict with macOS's built-in convert
    magick "$HEIC_FILE" \
           -gravity "$POSITION" \
           -pointsize "$FONT_SIZE" \
           -fill "$FONT_COLOR" \
           -annotate +"$X_OFFSET"+"$Y_OFFSET" "$DATETIME" \
           "$OUTPUT_PNG_FILE"

    if [[ $? -eq 0 ]]; then
        echo "  Successfully processed to '$OUTPUT_PNG_FILE'"
    else
        echo "  Error processing '$HEIC_FILE'. ImageMagick command failed."
    fi

done

echo "Processing complete!"
echo "Check the '$OUTPUT_DIR' directory for your new PNG files."