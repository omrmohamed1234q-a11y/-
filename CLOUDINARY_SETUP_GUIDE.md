# Cloudinary Setup Guide

## Upload Preset Configuration

Your Cloudinary upload is failing with a 400 error. This usually means the upload preset needs proper configuration.

### To Fix This Issue:

1. **Go to your Cloudinary Console**: https://cloudinary.com/console
2. **Navigate to Settings > Upload presets**
3. **Find your preset**: `اطبعلي`
4. **Check these settings**:
   - **Signing Mode**: Should be "Unsigned" for browser uploads
   - **Resource Type**: Should allow "Image" and "Raw" files
   - **Format**: Should allow multiple formats (jpg, png, pdf, txt, etc.)
   - **Access Control**: Should be "Public" if you want files to be publicly accessible

### Required Settings for اطبعلي Preset:
```
Name: اطبعلي
Signing Mode: Unsigned
Resource Type: Auto-detect
Allowed Formats: All or specific ones (jpg, png, pdf, txt, doc, docx)
Public ID: User-defined (allows custom naming)
Access Control: Public
```

### Alternative: Create New Preset
If your current preset has issues, create a new one:
1. Click "Add upload preset"
2. Name: `atbaali-unsigned`
3. Signing Mode: Unsigned
4. Resource Type: Auto
5. Save

Then update your environment variable:
`VITE_CLOUDINARY_UPLOAD_PRESET=atbaali-unsigned`

### Test the Configuration
After updating your preset, the upload test should work successfully.