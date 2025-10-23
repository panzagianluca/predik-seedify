# Mobile Strategy for Predik

## 🎯 Core Principle: DESKTOP FIRST, MOBILE ADAPTIVE
**CRITICAL: Desktop layout is PERFECT. All mobile work must be additive only.**

---

## 📱 Viewport Configuration

### Meta Tags (Configured in `app/layout.tsx`)
```typescript
viewport: {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}
```

**Why these values:**
- `width: device-width` - Proper mobile viewport
- `initialScale: 1` - No zoom on load
- `maximumScale: 5` - Allow users to zoom (accessibility)
- `userScalable: true` - Users can pinch-zoom (accessibility)

---

## 📐 Breakpoints System

### Tailwind Breakpoints (Mobile-First)
Configured in `tailwind.config.ts`:

```typescript
screens: {
  'xs': '375px',   // Small phones (iPhone SE, etc.)
  'sm': '640px',   // Large phones (iPhone 14 Pro, etc.)
  'md': '768px',   // Tablets (iPad Mini, etc.)
  'lg': '1024px',  // Desktop (default)
  'xl': '1280px',  // Large desktop
  '2xl': '1536px', // Extra large desktop
}
```

### Usage Pattern
```tsx
// Mobile-first approach: base styles apply to mobile, then override for larger screens
<div className="w-full md:w-auto">        // Full width on mobile, auto on desktop
<div className="flex-col md:flex-row">    // Stack on mobile, row on desktop
<div className="text-sm md:text-base">    // Smaller text on mobile
<div className="p-4 md:p-6">              // Less padding on mobile
```

---

## 🎨 Mobile Utility Classes

### Added to `globals.css`:

#### Touch Targets
```css
.touch-target
```
- Ensures minimum 44x44px tap targets (Apple HIG & Material Design standard)
- Use on all interactive elements (buttons, links, etc.)

#### Mobile Padding
```css
.mobile-padding
```
- Consistent mobile spacing (px-4 py-3)
- Use for cards and containers on mobile

#### Mobile Text
```css
.mobile-text-base
```
- Clamps text between 16px-18px (prevents mobile browser zoom on input focus)
- Use for form inputs and body text

#### Mobile Scrolling
```css
.mobile-scroll
```
- Smooth touch scrolling on iOS
- Prevents overscroll bounce issues

#### Visibility Helpers
```css
.mobile-hidden  // Hide on mobile, show on desktop (md+)
.mobile-only    // Show on mobile, hide on desktop
.mobile-full    // Full width on mobile, auto on desktop
.mobile-stack   // Stack on mobile, row on desktop
```

---

## 🚀 Mobile Development Workflow

### 1. Before Touching Any Component:
```bash
# Test desktop first - ensure it still works
# Open http://localhost:3000 on desktop browser
# Verify all existing functionality
```

### 2. Add Mobile Styles:
```tsx
// ❌ WRONG - Breaks desktop
<div className="w-[320px]">

// ✅ CORRECT - Adds mobile support
<div className="w-full md:w-[320px]">

// ❌ WRONG - Changes desktop behavior
<div className="grid-cols-2">

// ✅ CORRECT - Mobile stacks, desktop unchanged
<div className="grid-cols-1 md:grid-cols-2">
```

### 3. Test Breakpoints:
```
Chrome DevTools -> Toggle Device Toolbar (Cmd+Shift+M)
Test at:
- 375px (iPhone SE) - Minimum supported
- 390px (iPhone 14 Pro) - Common
- 768px (iPad Mini) - Tablet
- 1024px+ (Desktop) - MUST STILL LOOK PERFECT
```

### 4. Verify Desktop Unchanged:
```bash
# After any mobile work, ALWAYS verify:
# 1. Desktop layout unchanged
# 2. Desktop interactions unchanged
# 3. Desktop performance unchanged
```

---

## 📋 Mobile Checklist for Components

When making a component mobile-responsive:

### Layout
- [ ] Component adapts to full width on mobile
- [ ] Desktop width preserved (no changes to existing `w-[320px]` etc.)
- [ ] Proper stacking on mobile (flex-col)
- [ ] Desktop flex-row preserved

### Touch Targets
- [ ] All buttons min 44x44px on mobile
- [ ] Touch targets have adequate spacing (min 8px apart)
- [ ] No tiny tap targets (<44px)

### Typography
- [ ] Base font size ≥16px (prevents iOS zoom)
- [ ] Readable text size on mobile
- [ ] Desktop typography unchanged

### Spacing
- [ ] Reduced padding on mobile (p-4 instead of p-6)
- [ ] Adequate margin between sections
- [ ] Desktop spacing preserved

### Performance
- [ ] No layout shift on resize
- [ ] Smooth transitions
- [ ] No performance regression on desktop

---

## 🎯 Priority Components for Mobile

### Phase 1: Critical Path (Now)
1. **TradingPanel** - Core trading functionality
2. **Navbar** - Navigation
3. **MarketCard** - Market browsing
4. **MarketsGrid** - Market list

### Phase 2: User Features
5. **Profile** - User profile page
6. **PositionsList** - User positions
7. **Comments** - Market discussions
8. **Notifications** - User notifications

### Phase 3: Polish
9. **Footer** - Footer navigation
10. **Modals** - All modal dialogs
11. **Forms** - Form layouts
12. **Charts** - Data visualizations

---

## 🛠️ Testing Strategy

### Manual Testing
```
1. Desktop Chrome (1920x1080) - Reference implementation
2. Desktop Safari (1920x1080) - Desktop Mac compatibility
3. iPhone SE (375x667) - Smallest mobile
4. iPhone 14 Pro (390x844) - Common modern phone
5. iPad Mini (768x1024) - Tablet
```

### Automated Testing (Future)
```bash
# Playwright visual regression tests at breakpoints
npm run test:visual -- --grep "responsive"
```

### Performance Budget
- First Contentful Paint: <1.5s (mobile)
- Time to Interactive: <3.5s (mobile)
- Layout Shift: <0.1 (both)

---

## 🚫 Absolute Don'ts

1. **NEVER** change desktop classes without `md:` prefix
2. **NEVER** remove fixed widths without adding responsive variants
3. **NEVER** change desktop layout structure
4. **NEVER** merge mobile/desktop styles into single class
5. **NEVER** test only on mobile - desktop must remain perfect
6. **NEVER** use `!important` to override desktop styles
7. **NEVER** introduce new global styles that affect desktop

---

## ✅ Best Practices

1. **Always use mobile-first approach:**
   ```tsx
   // Base = mobile, md: = desktop
   <div className="p-4 md:p-6">
   ```

2. **Preserve desktop classes:**
   ```tsx
   // Keep desktop class, add mobile override
   <div className="w-full md:w-[320px]">
   ```

3. **Test both breakpoints:**
   ```bash
   # After any change
   1. Test mobile (375px)
   2. Test desktop (1024px+)
   3. Verify no regressions
   ```

4. **Use semantic breakpoints:**
   ```tsx
   // ✅ Clear intent
   <div className="mobile-stack">
   
   // ❌ Unclear
   <div className="flex-col md:flex-row">
   ```

5. **Document mobile changes:**
   ```tsx
   // Add comment when changing layout for mobile
   {/* Mobile: full width, Desktop: fixed 320px */}
   <Card className="w-full md:w-[320px]">
   ```

---

## 📚 Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Material Design - Touch Targets](https://m3.material.io/foundations/interaction/touch-targets)
- [Web.dev - Responsive Design](https://web.dev/responsive-web-design-basics/)

---

## 🔄 Version History

- **v1.0** (2025-10-18) - Initial mobile breakpoint strategy
  - Added viewport meta tags
  - Configured Tailwind breakpoints
  - Created mobile utility classes
  - Documented mobile-first workflow

---

**Remember: Desktop is sacred. Mobile is additive. Test both always.**
