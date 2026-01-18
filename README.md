# MetaStamp 📷

> **Disclaimer:** This project was vibe coded and I did not write any of the code myself.

Add beautiful date and time stamps to your photos instantly. All processing happens in your browser — your images never leave your device.

## Features

- **📅 EXIF Metadata Extraction**: Automatically reads date/time from EXIF data (DateTimeOriginal, CreateDate, ModifyDate)
- **🎨 Fully Customizable**: Adjust font, color, position, size, stroke, and drop shadow
- **⚡ Client-Side Processing**: All image processing happens locally in your browser
- **🔒 Privacy-First**: Your images are never uploaded to any server
- **📦 Batch Processing**: Upload and process multiple images at once
- **💾 Download Options**: Download individual images or all as a ZIP file
- **👁️ Lightbox Viewer**: Click any processed image to view it in fullscreen
- **💾 Settings Persistence**: Your customization preferences are saved automatically

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **exifr** - EXIF metadata extraction
- **jszip** - ZIP file creation

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MetaStamp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Usage

1. **Upload Images**: Click the upload area or drag and drop image files (JPEG, PNG, WebP supported)
2. **Customize Settings**: Click "Customize Overlay" to adjust:
   - Date/time format
   - Font family, size, and color
   - Text position (top/bottom left/right)
   - Text offset (X and Y)
   - Stroke color and width
   - Drop shadow settings
3. **View Results**: Processed images appear in a grid. Click any image to view it in the lightbox
4. **Download**: Download individual images or download all as a ZIP file

## Customization Options

### Date/Time Format
Choose from preset formats or create a custom format using tokens like:
- `YYYY` - 4-digit year
- `MM` - Month (01-12)
- `DD` - Day (01-31)
- `HH` - Hour (00-23)
- `mm` - Minute (00-59)
- `ss` - Second (00-59)

### Text Styling
- **Font Family**: Choose from various web fonts or use system default
- **Font Size**: Adjustable from 24px to 500px
- **Font Color**: Full color picker support
- **Stroke**: Add outline with customizable color and width

### Position
- Bottom Right (default)
- Bottom Left
- Top Right
- Top Left
- Custom X/Y offsets

### Drop Shadow
- Enable/disable drop shadow
- Adjust blur radius
- Set shadow offset (X and Y)
- Customize shadow color

## EXIF Metadata

MetaStamp tries to extract date/time information in this order:
1. `DateTimeOriginal` - When the photo was originally taken
2. `CreateDate` - File creation date
3. `ModifyDate` - File modification date
4. Current date/time (fallback if no EXIF data is available)

Images that use the fallback date/time are marked with a clock icon indicator.

## Privacy & Security

- **100% Client-Side**: All processing happens in your browser using the HTML5 Canvas API
- **No Server Uploads**: Images are never sent to any server
- **Local Storage**: Only your customization preferences are stored locally in your browser

## Development

### Project Structure

```
MetaStamp/
├── src/
│   ├── components/      # React components
│   │   ├── Lightbox.tsx
│   │   ├── OverlayPreview.tsx
│   │   └── SettingsPanel.tsx
│   ├── types/           # TypeScript type definitions
│   │   └── config.ts
│   ├── utils/           # Utility functions
│   │   ├── configStorage.ts
│   │   └── formatPresets.ts
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── app/                 # TanStack Router files
└── public/              # Static assets
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
