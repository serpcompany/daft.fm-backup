# README

This project contains comprehensive coding rules and guidelines that must be followed when working on any codebase. All rules in this documentation are mandatory and should be applied consistently.

Explore the entire repository to understand the codebase from multiple angles: as a software architect, software developer, product manager, project manager, quality assurance tester. I want you to compile your findings into a very extensive markdown document in the root of the repository (with the date in the filename). Include schema diagrams, flow charts, or any other graphics relevant to describing the project. Familiarize yourself with the package.json file so you understand the technologies we are working with, and their unique mix/interaction with each other.


- Use all enabled MCP servers. Especially browser-tools mcp so you can interact with the browser, take screenshots, get console errors, etc. (`npx @agentdeskai/browser-tools-server@1.2.0` to star the server)

- Always research the most up to date documentation relevant to the issue AND our tech stack to find best practices, code patterns, snippets, and configuration settings. Add the findings to the issue comments before starting.

## Problem Solving

- When planning or working on a task, Do not make assumptions "The problem is likely that ....." Always research and reference updated documentation and issues from online to be sure before doing or trying anything. We are coding. The bad news about that is there will be bugs. The good news is that everything that happens is happening because there is written code somewhere that is causing it - and for that reason we should be able to figure out how to debug anything we encounter as long as we look in the correct places.

## Key Project Guidelines

- After making a change, always check your terminal output for issues and errors (or browser console, network, etc. via browser tools mcp)
- For front-end changes, always check the browser context, console, and screenshots using browser-tools mcp


## Git and Development Workflow

- Before doing any coding, always research & reference online documentation, web searches, context7 and other mcp servers for the mix of technologies involved in the issue
- Use conventional commits with meaningful messages, and commit SMALL and OFTEN
- Keep PRs focused and small
- Everything should be tested appropriately, keep a strong focus on SRE and software robustness
- Never overwrite .env files without confirmation
- Consider dev, test, and prod environments in all code changes
- Only work on one very specific item at a time that is defined within the project issue. Do not get sidetracked. Do not over-engineer.
- Always create a branch for an issue to work on it so we can isolate our work.
- Always work from ISSUES in the repository remote on a corresponding issue branch. Naming convention: `claude/issueNum/short-description` (ex: `claude/17/refactor-components`)

## Code Style

- Follow nuxt documentation for code styles, examples, guidelines
- Prefer simple solutions over complex ones
- Avoid code duplication - always check for existing implementations
- Make all code modular and easily maintainable
- Use meaningful variable names and keep functions small and focused
