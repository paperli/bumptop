# Mock Assets Directory

This directory contains sample files for testing the content preview system.

## Directory Structure

```
mock-assets/
├── audio/          # Audio files (MP3, M4A, WAV)
├── videos/         # Video files (MP4, MOV)
├── images/         # Image files (JPG, PNG, SVG) - Already populated
└── text/           # Text files (TXT, MD, JSON, JS) - Already populated
```

## How to Add Sample Files

### Audio Files (public/mock-assets/audio/)

Add 5 audio files with these exact names:
- `sample-1.mp3` (recommended: podcast clip, ~10-30 seconds)
- `sample-2.mp3` (recommended: music sample)
- `sample-3.mp3` (recommended: voice memo)
- `sample-4.mp3` (recommended: sound effect or ambient audio)
- `sample-5.mp3` (recommended: audiobook sample)

**Requirements:**
- Formats: MP3, M4A, or WAV
- Size: Keep under 5MB each for fast loading
- Duration: 10-30 seconds recommended for testing

### Video Files (public/mock-assets/videos/)

Add 5 video files with these exact names:
- `sample-1.mp4` (recommended: short clip, 5-15 seconds)
- `sample-2.mp4` (recommended: screencast or tutorial)
- `sample-3.mp4` (recommended: timelapse or nature)
- `sample-4.mp4` (recommended: animation or demo)
- `sample-5.mp4` (recommended: presentation or slideshow)

**Requirements:**
- Format: MP4 (best browser compatibility)
- Resolution: 720p or lower
- Size: Keep under 10MB each for fast loading
- Duration: 5-15 seconds recommended for testing

### Text Files (Already Included)

Text files are already present:
- `sample.txt` - Plain text
- `notes.md` - Markdown
- `config.json` - JSON configuration
- `example.js` - JavaScript code

## Testing After Adding Files

1. Place your audio/video files in the respective directories
2. Reload the app (dev server will hot-reload)
3. Double-tap on audio/video file objects in the 3D scene
4. The content preview panel should open and play your actual files

## Fallback Behavior

If a file is missing, the system will:
- Show an error state (red panel)
- Log the error in the browser console
- Continue working for other files

## File Naming Convention

The MockProvider maps mock file IDs to these exact file names:
- Videos: `sample-1.mp4` through `sample-5.mp4`
- Audio: `sample-1.mp3` through `sample-5.mp3`
- Text: Uses existing files in text/ directory

If you want to use different names, update the `contentUrlMap` in `src/fs/MockProvider.ts`.
