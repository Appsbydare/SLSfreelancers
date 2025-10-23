# Animation System Guide

## Overview
This document outlines the modern animation system implemented across the Sri Lanka Tasks website. The animations are designed to be consistent, performant, and accessible across all pages.

## Animation Features

### 1. Header Animations
- **Fixed header with scroll effects**: Header becomes translucent with backdrop blur when scrolling
- **Logo hover effects**: Scale and shadow animations on hover
- **Navigation animations**: Staggered fade-in animations for menu items
- **Mobile menu**: Slide-down animation with staggered item reveals
- **Active state indicators**: Animated underline for current page

### 2. Hero Banner Animations
- **Background effects**: Animated floating orbs with pulse effects
- **Content animations**: Staggered fade-in-up animations for text and buttons
- **Interactive elements**: Hover scale and glow effects
- **Floating decorations**: Bouncing emoji elements
- **Gradient text**: Animated gradient text effects

### 3. Category Grid Animations
- **Staggered card animations**: Each category card animates in with increasing delay
- **Hover effects**: Lift, scale, and rotate animations on hover
- **Icon animations**: Scale and rotation effects for category icons
- **Button animations**: Scale and shadow effects for CTA buttons

### 4. Footer Animations
- **Section animations**: Staggered fade-in animations for footer sections
- **Link hover effects**: Slide-right animations for footer links
- **Social media icons**: Scale animations on hover
- **Logo effects**: Scale and shadow animations

## Animation Classes

### Fade Animations
- `animate-fade-in`: Basic fade in effect
- `animate-fade-in-up`: Fade in from bottom
- `animate-fade-in-down`: Fade in from top
- `animate-fade-in-left`: Fade in from left
- `animate-fade-in-right`: Fade in from right

### Scale Animations
- `animate-scale-in`: Scale in from 90% to 100%
- `hover:animate-scale-in`: Scale effect on hover

### Slide Animations
- `animate-slide-in-up`: Slide in from bottom
- `animate-slide-in-down`: Slide in from top

### Bounce Animations
- `animate-bounce-in`: Bounce in effect with scale
- `animate-bounce`: Continuous bounce animation

### Hover Effects
- `hover-lift`: Lift element on hover
- `hover-glow`: Glow effect on hover
- `hover-shake`: Shake effect on hover

### Stagger Animations
- `animate-stagger-1` through `animate-stagger-5`: Staggered animations with increasing delays

## Implementation Details

### Animation Utilities
Located in `src/lib/animations.ts`:
- Predefined animation classes
- Animation variants for different use cases
- Utility functions for combining animations
- Stagger delay calculations

### CSS Animations
Located in `src/styles/animations.css`:
- Custom keyframe definitions
- Animation class implementations
- Responsive animation adjustments
- Accessibility considerations (reduced motion)

### Tailwind Configuration
Located in `tailwind.config.js`:
- Extended animation definitions
- Custom keyframes
- Animation timing configurations

## Usage Examples

### Basic Fade Animation
```tsx
<div className="animate-fade-in-up">
  Content that fades in from bottom
</div>
```

### Staggered Animation
```tsx
{items.map((item, index) => (
  <div 
    key={item.id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {item.content}
  </div>
))}
```

### Hover Effects
```tsx
<button className="hover:scale-105 hover:shadow-lg transition-all duration-300">
  Animated Button
</button>
```

## Performance Considerations

### Optimizations
- CSS-based animations for better performance
- Hardware acceleration using transform properties
- Reduced motion support for accessibility
- Mobile-optimized animations (reduced complexity)

### Best Practices
- Use `transform` and `opacity` for smooth animations
- Avoid animating layout properties (width, height, margin)
- Implement proper animation delays for staggered effects
- Test animations on various devices and browsers

## Accessibility

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Management
- Proper focus indicators for interactive elements
- Keyboard navigation support
- Screen reader compatibility

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- CSS Custom Properties support
- Transform and animation support

## Customization

### Adding New Animations
1. Define keyframes in `src/styles/animations.css`
2. Add animation class in the same file
3. Update `tailwind.config.js` if needed
4. Add utility functions in `src/lib/animations.ts`

### Modifying Existing Animations
1. Update keyframes in CSS file
2. Adjust timing and easing functions
3. Test across different components
4. Update documentation

## Testing Checklist
- [ ] Animations work on desktop browsers
- [ ] Animations work on mobile devices
- [ ] Reduced motion preferences are respected
- [ ] Performance is smooth (60fps)
- [ ] Accessibility features work correctly
- [ ] Cross-browser compatibility
- [ ] Animation timing feels natural
- [ ] No layout shifts during animations

## Future Enhancements
- Intersection Observer for scroll-triggered animations
- More sophisticated easing functions
- Animation presets for different content types
- Performance monitoring and optimization
- A/B testing for animation effectiveness
