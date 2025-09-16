# Trial System Integration Guide

This guide shows how to integrate the enhanced trial system with usage quotas across all modules.

## Overview

The trial system now includes:
- **Time-based limits**: 3 days (72 hours) from registration
- **Usage-based limits**: 20 analyses shared across all modules
- **Dual expiry**: Trial expires when either limit is reached
- **Anti-abuse measures**: Rate limiting and unique trial constraints

## Hook Usage

### useTrialUsage Hook

Use this hook for seamless trial integration in any module:

```tsx
import { useTrialUsage } from '@/hooks/useTrialUsage';

const MyModule = () => {
  const { checkAndIncrementUsage, canUseModule, usageInfo } = useTrialUsage();

  const handleAnalysis = async () => {
    // Check trial and increment usage atomically
    const canProceed = await checkAndIncrementUsage('resume_upload', {
      jobTitle: 'Software Engineer',
      fileCount: 5,
      timestamp: new Date().toISOString()
    });
    
    if (canProceed) {
      // Proceed with your module's analysis logic
      await performAnalysis();
    }
    // Error messages are handled automatically by the hook
  };

  return (
    <div>
      {/* Usage warning */}
      {canUseModule && usageInfo.remaining <= 5 && (
        <Alert>
          <AlertDescription>
            You have {usageInfo.remaining} analyses remaining.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <Button 
        onClick={handleAnalysis}
        disabled={!canUseModule}
      >
        {canUseModule ? 'Analyze' : 'Trial Limit Reached'}
      </Button>
    </div>
  );
};
```

## Module Integration Examples

### 1. Resume Upload Module

```tsx
// src/components/UploadSection.tsx
import { useTrialUsage } from '@/hooks/useTrialUsage';

const UploadSection = () => {
  const { checkAndIncrementUsage, canUseModule } = useTrialUsage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check trial before processing
    const canProceed = await checkAndIncrementUsage('resume_upload', {
      jobTitle: jobTitle.trim(),
      fileCount: selectedFiles?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    if (!canProceed) return;
    
    // Continue with upload logic...
  };

  return (
    <Button 
      onClick={handleSubmit}
      disabled={!canUseModule}
    >
      {canUseModule ? 'Analyze Resumes' : 'Trial Expired'}
    </Button>
  );
};
```

### 2. HH.uz Search Module

```tsx
// src/pages/ResumeSearch.tsx
import { useTrialUsage } from '@/hooks/useTrialUsage';

const ResumeSearch = () => {
  const { checkAndIncrementUsage, canUseModule } = useTrialUsage();

  const handleSearch = async () => {
    // Check trial before search
    const canProceed = await checkAndIncrementUsage('hh_search', {
      jobTitle,
      skills: requiredSkills,
      experienceLevel,
      city,
      timestamp: new Date().toISOString()
    });
    
    if (!canProceed) return;
    
    // Continue with search logic...
  };

  return (
    <Button 
      onClick={handleSearch}
      disabled={!canUseModule || isSearching}
    >
      {canUseModule ? 'Search Candidates' : 'Trial Expired'}
    </Button>
  );
};
```

### 3. LinkedIn Search Module

```tsx
// src/pages/LinkedinSearch.tsx
import { useTrialUsage } from '@/hooks/useTrialUsage';

const LinkedinSearch = () => {
  const { checkAndIncrementUsage, canUseModule } = useTrialUsage();

  const handleLinkedInSearch = async () => {
    // Check trial before search
    const canProceed = await checkAndIncrementUsage('linkedin_search', {
      jobTitle,
      skills: requiredSkills,
      experienceLevel,
      timestamp: new Date().toISOString()
    });
    
    if (!canProceed) return;
    
    // Continue with LinkedIn search logic...
  };

  return (
    <Button 
      onClick={handleLinkedInSearch}
      disabled={!canUseModule || isSearching}
    >
      {canUseModule ? 'Search LinkedIn' : 'Trial Expired'}
    </Button>
  );
};
```

## Trial Status Display

### Header Banner

The `TrialStatusBanner` component automatically shows in the header:

```tsx
// src/components/Header.tsx
import { TrialStatusBanner } from './TrialStatusBanner';

const Header = () => {
  return (
    <>
      <header>
        {/* Header content */}
      </header>
      
      {/* Trial banner shows automatically when user has active trial */}
      {user && (
        <div className="container mx-auto px-6">
          <TrialStatusBanner />
        </div>
      )}
    </>
  );
};
```

### TrialGuard Component

Use `TrialGuard` to protect pages or sections:

```tsx
import { TrialGuard } from '@/components/TrialGuard';

const ProtectedPage = () => {
  return (
    <TrialGuard>
      <YourPageContent />
    </TrialGuard>
  );
};
```

## Database Functions

### increment_trial_usage Function

This function handles usage tracking atomically:

```sql
-- Called automatically by useTrialUsage hook
SELECT increment_trial_usage(
  p_user_id := 'user-uuid',
  p_module_type := 'resume_upload',
  p_metadata := '{"jobTitle": "Engineer", "fileCount": 3}'
);
```

Returns:
```json
{
  "success": true,
  "analyses_used": 5,
  "analyses_limit": 20,
  "remaining": 15,
  "trial_active": true
}
```

## Anti-Abuse Features

### Rate Limiting

The system includes rate limiting to prevent abuse:

- **Per-user limits**: Max actions per time window
- **Database-level constraints**: Prevent duplicate trials
- **Usage logging**: Detailed audit trail in `trial_usage_log`

### Security Measures

1. **Unique trial constraint**: One trial per user
2. **RLS policies**: Users can only access their own data
3. **Atomic operations**: Usage increments are transactional
4. **Audit logging**: All trial actions are logged

## Error Handling

The system provides comprehensive error handling:

```tsx
const result = await checkAndIncrementUsage('resume_upload');

// Possible error responses:
// - no_user: User not authenticated
// - no_active_trial: No trial found
// - trial_expired: Time limit exceeded
// - usage_limit_exceeded: Usage limit exceeded
// - database_error: Database operation failed
```

## Localization

Add trial-related translations to your locale files:

```json
// src/i18n/locales/en.json
{
  "trial": {
    "banner": {
      "title": "Free Trial Active",
      "timeRemaining": "Time Remaining",
      "analysesRemaining": "Analyses Remaining",
      "contact": "Contact Support"
    },
    "usage": {
      "warning": {
        "title": "Usage Warning",
        "description": "You have {{remaining}} analyses remaining in your trial."
      },
      "expired": {
        "title": "Trial Expired",
        "description": "Your trial has expired. Please contact support to continue."
      },
      "error": {
        "title": "Usage Error",
        "generic": "Unable to process request. Please try again."
      }
    }
  }
}
```

## Migration Checklist

To implement this system in existing modules:

1. ✅ **Database Migration**: Add usage tracking tables and functions
2. ✅ **Enhanced useTrialStatus**: Update hook with usage tracking
3. ✅ **useTrialUsage Hook**: Create module integration hook
4. ✅ **TrialStatusBanner**: Add header banner component
5. ✅ **TrialGuard Updates**: Enhance with usage display
6. 🔄 **Module Integration**: Add to resume upload (partial), HH search, LinkedIn search
7. 🔄 **Localization**: Add trial translations
8. 🔄 **Testing**: Verify all limits and error scenarios

## Best Practices

1. **Always check trial before processing**: Use `checkAndIncrementUsage` at the start of operations
2. **Provide clear feedback**: Show usage warnings when approaching limits
3. **Handle errors gracefully**: Let the hook manage error messages
4. **Log meaningful metadata**: Include relevant context in usage logs
5. **Test edge cases**: Verify behavior at exactly 20 uses and 72 hours

## Monitoring

Monitor trial usage through the database:

```sql
-- View trial usage statistics
SELECT 
  module_type,
  COUNT(*) as total_uses,
  COUNT(DISTINCT user_id) as unique_users
FROM trial_usage_log 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY module_type;

-- View current trial status
SELECT 
  user_id,
  analyses_used,
  analyses_limit,
  (analyses_limit - analyses_used) as remaining,
  trial_ends_at,
  is_active
FROM user_trials 
WHERE is_active = true;
```