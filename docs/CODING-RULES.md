# Coding Rules for daft.fm

Follow these rules religiously to maintain code quality and avoid common pitfalls.

## Research First
- **Always check latest documentation** before implementing any new feature - frameworks change rapidly
- Verify package versions and compatibility before adding dependencies
- Check for breaking changes in recent releases
- Use official examples and starter templates as reference

## Code Standards
- **TypeScript everywhere** - No plain JavaScript files
- **Use the framework's conventions** - Don't fight against Nuxt patterns
- **Components over pages** - Build reusable, testable components
- **Single responsibility** - Each function/component should do one thing well

## UI/Styling Standards
- **Native components first** - Use Nuxt UI Pro components and layouts without modification
- **Component props over custom CSS** - Configure components via props and design tokens
- **No custom styling** - Avoid writing custom CSS unless absolutely necessary
- **Design system consistency** - Stick to built-in color schemes, spacing, and typography

## Performance Rules
- **Images must be optimized** - Use Nuxt's built-in image optimization
- **Lazy load by default** - Don't load data until needed
- **Cache aggressively** - Use proper HTTP caching headers
- **Bundle size matters** - Check bundle analyzer regularly

## Database Rules
- **Use TypeScript types** - Generate types from Drizzle schema
- **Index commonly queried fields** - wikidataId, slug, etc.
- **Validate all external data** - APIs can return garbage
- **Handle missing data gracefully** - Not all entities have complete info

## API & External Services
- **Rate limit respect** - Follow API guidelines religiously
- **Retry with backoff** - Network requests fail, handle it
- **Log everything** - Especially external API responses
- **Store raw responses** - For debugging data issues

## Git Workflow
- **Small, focused commits** - One logical change per commit
- **Test before committing** - Ensure build passes
- **Descriptive commit messages** - Include context for future you

## Error Handling
- **Fail gracefully** - Show partial data instead of blank pages
- **User-friendly errors** - No technical jargon to users
- **Log detailed errors** - For debugging

## Documentation
- **Comment the "why" not the "what"** - Code should be self-documenting
- **Update docs with code changes** - Keep implementation guide current
- **Document all external integrations** - API quirks, rate limits, etc.