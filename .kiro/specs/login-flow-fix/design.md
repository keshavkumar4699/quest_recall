# Design Document

## Overview

The login flow issue occurs because the `showMainApp()` method only shows the header and stats dashboard elements but doesn't hide the authentication page. This results in both the auth page and main app interface being visible simultaneously after successful login or registration.

## Architecture

The application uses a page-based navigation system where:

- Pages are HTML elements with the class `page`
- Page visibility is controlled by adding/removing the `active` class
- The `hideAllPages()` method removes the `active` class from all pages
- Individual page show methods call `hideAllPages()` first, then add `active` to the target page

## Components and Interfaces

### Current Page Navigation Methods

1. **hideAllPages()** - Removes `active` class from all `.page` elements
2. **showAuthPage()** - Hides all pages, shows auth page, hides header/stats
3. **showMainApp()** - Shows header/stats, updates user display (MISSING: hide auth page)
4. **showHomePage()** - Hides all pages, shows home page
5. **showSubjectsPage()** - Hides all pages, shows subjects page
6. **showTopicsPage()** - Hides all pages, shows topics page
7. **showImportantPage()** - Hides all pages, shows important page

### Authentication Flow Methods

1. **login()** - Calls `showMainApp()` after successful authentication
2. **register()** - Calls `showMainApp()` after successful registration
3. **init()** - Calls either `showMainApp()` or `showAuthPage()` based on token validity

## Data Models

No data model changes required. The issue is purely in the UI state management.

## Error Handling

The fix will ensure proper page transitions in all authentication scenarios:

- Successful login/registration
- Token verification success/failure
- Logout operations
- App initialization

## Testing Strategy

### Unit Tests

- Test that `showMainApp()` properly hides the auth page
- Test that authentication methods result in correct page visibility
- Test that logout properly shows only the auth page

### Integration Tests

- Test complete login flow from auth page to main app
- Test complete registration flow from auth page to main app
- Test app initialization with valid/invalid tokens
- Test logout flow from main app to auth page

### Manual Testing

- Verify no visual overlap between auth and main app interfaces
- Verify smooth transitions between authentication states
- Test on different screen sizes to ensure consistent behavior

## Implementation Plan

The fix involves modifying the `showMainApp()` method to properly hide the authentication page before showing the main application interface. This ensures a clean transition and prevents the overlapping UI issue.

### Key Changes Required

1. **Modify showMainApp() method**: Add call to `hideAllPages()` to ensure auth page is hidden
2. **Ensure proper page activation**: Make sure the home page is properly activated when showing main app
3. **Maintain consistency**: Ensure all page navigation follows the same pattern of hiding all pages first

### Root Cause Analysis

The issue stems from inconsistent page navigation patterns:

- `showAuthPage()` properly calls `hideAllPages()` before showing auth page
- `showMainApp()` only manipulates header/stats visibility but ignores page state
- This asymmetry causes the auth page to remain visible when transitioning to main app

### Solution Approach

Standardize the page navigation pattern by ensuring `showMainApp()` follows the same approach as other page navigation methods:

1. Hide all pages first
2. Show the appropriate main app page (home page)
3. Show header and stats dashboard
4. Update user display
