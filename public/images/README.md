# Images Directory

## Advertisement Carousel

Add your advertisement images in this directory. The carousel will automatically rotate through all images every 10 seconds.

### Current Ad Images:
1. `sponsor-ad.png` - First advertisement
2. `sponsor-ad-2.png` - Second advertisement

### How to Add More Ads:

1. **Add images to this directory**:
   - Place new ad images in `/public/images/`
   - Use sequential naming: `sponsor-ad-3.png`, `sponsor-ad-4.png`, etc.
   - **Recommended dimensions**: 1920x200 pixels (or similar wide banner format)
   - **Format**: PNG or JPG

2. **Update the carousel**:
   - Open `src/components/HeroBanner.tsx`
   - Add new image paths to the `adImages` array:
   ```typescript
   const adImages = [
     '/images/sponsor-ad.png',
     '/images/sponsor-ad-2.png',
     '/images/sponsor-ad-3.png',  // Add new images here
     '/images/sponsor-ad-4.png',
   ];
   ```

### Features:
- ✅ Auto-rotates every 10 seconds
- ✅ Smooth fade and scale transitions
- ✅ Navigation dots indicator
- ✅ Manual navigation arrows (desktop)
- ✅ Click dots to jump to specific ad
- ✅ Supports unlimited number of images

