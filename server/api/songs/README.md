# API Design Philosophy

## Why We Use Zod (and when to skip it)

Zod is meant to:
1. ✅ Catch actual type mismatches (string when expecting number)
2. ✅ Document the API contract
3. ✅ Provide TypeScript types automatically

Zod is NOT meant to:
1. ❌ Break the API when data is slightly different than expected
2. ❌ Be so strict that valid data fails validation
3. ❌ Make development harder

## Our Approach

1. **Use `.passthrough()`** on schemas to allow extra fields
2. **Use `.optional()` liberally** for fields that might not always exist
3. **Log validation errors** but don't break the API in production
4. **Fix the data source** when possible, rather than working around it

## Example

```typescript
// Too strict - will break with any extra field
const strictSchema = z.object({
  id: z.string(),
  name: z.string()
})

// Better - allows flexibility
const flexibleSchema = z.object({
  id: z.string(),
  name: z.string()
}).passthrough() // Allow extra fields
```