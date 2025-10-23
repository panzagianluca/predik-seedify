# Dialog/Modal Top Alignment Update

## 🎯 Objective
Update all dialogs/modals to:
1. **Align to TOP** instead of center (5vh from top)
2. **Take full viewport height** (max-h-90vh with padding)
3. **Maintain breathable spacing** with proper padding

---

## ✅ Changes Made

### 1. **Base Dialog Component** (`components/animate-ui/components/radix/dialog.tsx`)

**Before:**
```tsx
top-[50%] -translate-y-[50%]  // Centered vertically
```

**After:**
```tsx
top-[5vh] translate-y-0       // 5vh from top
max-h-[90vh]                   // Max height 90% of viewport
overflow-hidden                // Prevent overflow
```

**Benefits:**
- Consistent positioning across all dialogs
- More viewport space utilization
- Better mobile experience
- Prevents content from being cut off at bottom

---

### 2. **Global Search** (`components/layout/GlobalSearch.tsx`)

**Changes:**
- ✅ Removed center positioning overrides (`!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2`)
- ✅ Now uses default top alignment from base component
- ✅ Increased height: `max-h-[85vh]`
- ✅ Made scrollable with `flex flex-col` layout
- ✅ Search input: Increased to `h-14` with larger text/icons
- ✅ Results: `flex-1 overflow-y-auto` with `mobile-scroll` class
- ✅ Close button: Now visible (was hidden before)

**Structure:**
```tsx
<DialogContent max-h-[85vh] flex flex-col>
  <div> {/* Search Input - fixed */}
  <div flex-1 overflow-y-auto> {/* Results - scrollable */}
</DialogContent>
```

---

### 3. **Mobile Search** (`components/layout/MobileSearch.tsx`) - NEW

**Features:**
- Full-screen on mobile (`max-w-full w-full rounded-none`)
- Desktop modal on larger screens (`md:max-w-2xl md:rounded-2xl`)
- Custom header with search input + close button
- Smooth scrolling results
- Touch-optimized tap targets
- Loading states with spinner
- Empty states with icons
- Controlled via ref from BottomNav

**Mobile Layout:**
```tsx
max-w-full w-full         // Full width mobile
max-h-screen              // Full height mobile
rounded-none              // No border radius mobile
md:max-w-2xl              // Constrained width desktop
md:max-h-[85vh]           // Limited height desktop
md:rounded-2xl            // Rounded corners desktop
```

**Integration:**
```tsx
// In BottomNav.tsx
const mobileSearchRef = useRef<MobileSearchRef>(null)

// Search button onClick
mobileSearchRef.current?.open()
```

---

### 4. **Deposit Modal** (`components/wallet/DepositModal.tsx`)

**Changes:**
- ✅ Removed center positioning (`!left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2`)
- ✅ Changed from fixed height `h-[80vh]` to max height `max-h-[90vh]`
- ✅ Now uses default top alignment

**Before:**
```tsx
h-[80vh]                          // Fixed height
!top-1/2 !-translate-y-1/2        // Centered
```

**After:**
```tsx
max-h-[90vh]                      // Max height (more flexible)
// Uses default top-[5vh] from base component
```

---

### 5. **Tutorial Dialog** (`components/layout/Navbar.tsx`)

**Changes:**
- ✅ Removed center positioning
- ✅ Added `max-h-[90vh]` constraint
- ✅ Added `overflow-hidden` to prevent scroll issues

---

### 6. **Submit Proposal Modal** (`components/proponer/SubmitProposalModal.tsx`)

**Changes:**
- ✅ Removed center positioning
- ✅ Added `max-h-[90vh]` with `overflow-y-auto`
- ✅ Form is now scrollable if content exceeds viewport

---

## 📱 Visual Changes

### Before (Centered):
```
┌──────────────────────┐
│                      │
│                      │
│   ┌────────────┐    │
│   │   Dialog   │    │ ← Centered vertically
│   │            │    │
│   └────────────┘    │
│                      │
│                      │
└──────────────────────┘
```

### After (Top-Aligned):
```
┌──────────────────────┐
│   ┌────────────┐    │ ← 5vh from top
│   │   Dialog   │    │
│   │            │    │
│   │  Content   │    │
│   │            │    │
│   │ (scrolls)  │    │
│   │            │    │
│   │            │    │
│   └────────────┘    │ ← Max 90vh
└──────────────────────┘
```

---

## 🎨 Spacing & Breathability

### Desktop
- **Top margin:** 5vh (60px on 1200px screen)
- **Bottom margin:** 5vh (60px on 1200px screen)
- **Max height:** 90vh (ensures 5vh top + 5vh bottom)
- **Side padding:** Maintained by dialog (p-6)

### Mobile
- **Top margin:** 5vh (smaller on mobile)
- **Bottom margin:** Auto (scroll if needed)
- **Max height:** 90vh on desktop, 100vh on mobile (MobileSearch)
- **Side padding:** 1rem (maintained by dialog)

---

## 🔧 Technical Implementation

### Base Dialog Default Classes
```tsx
className={cn(
  'fixed left-[50%] top-[5vh]',        // Position: center horizontal, 5vh from top
  'translate-x-[-50%] translate-y-0',   // Transform: center horizontal only
  'max-h-[90vh]',                       // Height: max 90% viewport
  'overflow-hidden',                     // Prevent overflow
  'w-full max-w-[calc(100%-2rem)]',    // Width: responsive with margin
  'sm:max-w-lg',                        // Desktop: constrained width
  className                              // Allow overrides
)}
```

### Component-Specific Overrides
Components can override:
- `max-w-*` - Custom width
- `max-h-*` - Custom height (if needed)
- Layout structure (flex, grid, etc.)

---

## ✅ All Affected Components

| Component | File | Status |
|-----------|------|--------|
| Base Dialog | `components/animate-ui/components/radix/dialog.tsx` | ✅ Updated |
| Global Search | `components/layout/GlobalSearch.tsx` | ✅ Updated |
| Mobile Search | `components/layout/MobileSearch.tsx` | ✅ Created |
| Deposit Modal | `components/wallet/DepositModal.tsx` | ✅ Updated |
| Tutorial Dialog | `components/layout/Navbar.tsx` | ✅ Updated |
| Submit Proposal | `components/proponer/SubmitProposalModal.tsx` | ✅ Updated |
| Edit Profile | `components/profile/EditProfileModal.tsx` | ✅ Already correct |

---

## 🧪 Testing Checklist

### Desktop (≥768px)
- [ ] Dialogs appear 5vh from top
- [ ] Max height is 90vh
- [ ] Content scrolls if taller than 90vh
- [ ] Close button works
- [ ] Backdrop click closes
- [ ] ESC key closes
- [ ] Proper padding maintained

### Mobile (<768px)
- [ ] Search takes full screen
- [ ] Other dialogs still constrained to 90vh
- [ ] Touch scrolling smooth
- [ ] Close buttons accessible
- [ ] No content cut off
- [ ] Proper margin from edges

### Search Functionality
- [ ] Desktop: Click search bar opens search
- [ ] Mobile: Tap "Buscar" in bottom nav opens search
- [ ] Typing filters results
- [ ] Selecting market navigates correctly
- [ ] Loading state shows
- [ ] Empty state shows

---

## 🚀 Benefits

1. **Better Space Utilization**
   - More vertical space for content
   - Easier to read long forms/lists

2. **Consistent UX**
   - All dialogs behave the same way
   - Predictable positioning

3. **Mobile Friendly**
   - Top alignment feels more natural on mobile
   - Easier to reach close button
   - More space for content

4. **Accessibility**
   - Content less likely to be cut off
   - Scrolling more intuitive
   - Keyboard navigation preserved

5. **Performance**
   - No layout shifts
   - Smooth animations maintained
   - Efficient rendering

---

## 📝 Notes

### Why 5vh instead of 0?
- Provides breathing room at top
- Prevents content from touching screen edge
- Easier to see backdrop (visual feedback)
- More aesthetically pleasing

### Why 90vh max height?
- 5vh top + 90vh content + 5vh bottom = 100vh
- Ensures vertical margins on all screens
- Prevents content from reaching bottom edge
- Allows backdrop to be visible top and bottom

### Why not 100vh on mobile?
- Mobile browsers have dynamic viewport (URL bar)
- 100vh can cause content to be hidden behind browser chrome
- 90vh ensures content always visible
- Exception: MobileSearch intentionally uses 100vh for full-screen feel

---

## 🔄 Future Enhancements

1. **Dynamic Height**
   - Adjust based on content size
   - Smaller dialogs don't need 90vh

2. **Animation Variants**
   - Slide from top (already implemented)
   - Fade in
   - Scale in

3. **Responsive Widths**
   - Different max widths for different screen sizes
   - Better tablet support

4. **Stacking Context**
   - Support multiple dialogs
   - Proper z-index management

---

**Status:** ✅ Complete
**Tested:** Ready for testing
**Breaking Changes:** None (all positioning is additive)
