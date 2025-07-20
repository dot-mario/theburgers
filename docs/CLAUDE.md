# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm start` - Run the compiled application from dist/index.js
- `npm run dev` - Run TypeScript compiler in watch mode for development
- `npm run test` - Run Jest unit tests

### Docker Commands
- `docker build -t theburgers .` - Build Docker image using multi-stage build
- `docker run -d --env-file .env theburgers` - Run containerized application
- `docker-compose up -d` - Run with auto-update functionality (checks for updates every 5 minutes)

## Architecture Overview

This is a **CHZZK-Discord integration bot** that monitors Korean streaming platform CHZZK chat messages and sends Discord notifications when specific word patterns are detected.

### Core Application Architecture
The application uses a **dependency injection pattern** with centralized service lifecycle management:

**Application Manager** (`src/application.ts`)
- Central orchestrator implementing graceful startup/shutdown
- Manages service dependencies and initialization order
- Handles cleanup of all CleanupableService instances
- Provides signal handlers for graceful termination

### Core Services
All services implement the `CleanupableService` interface for consistent resource management:

1. **ChzzkService** (`src/chzzkService.ts`) - CHZZK chat integration
   - Connects to Korean streaming platform using `chzzk` library
   - Monitors real-time chat for specific Korean characters
   - Processes system messages for ban/unban events
   - Uses `IntervalManager` for connection health checks

2. **CountManager** (`src/countManager.ts`) - Pattern detection and alerting
   - Tracks Korean character combinations by food groups
   - Implements threshold-based alerting with cooldown system
   - Dynamically loads group patterns from constants
   - Creates Discord embeds with group-specific styling

3. **DiscordService** (`src/discordService.ts`) - Discord integration
   - Manages Discord bot client lifecycle
   - Sends embedded alerts and ban notifications
   - Handles channel resolution and error recovery

4. **DescriptionService** (`src/descriptionService.ts`) - Dynamic content
   - Loads alert messages from descriptions.json with file watching
   - Provides randomized content selection for notifications

### Utility Layer
**Types** (`src/types.ts`) - Centralized type definitions and interfaces
**Constants** (`src/constants.ts`) - Configuration values, Korean characters, styling
**Utils** (`src/utils.ts`) - Utility classes for common operations:
- `DateUtils` - Date formatting helpers
- `BanUtils` - Korean ban message parsing and formatting
- `ArrayUtils` - Collection manipulation helpers  
- `IntervalManager` - Centralized timer resource management

### Data Flow & Service Interaction
1. **Application** initializes services in dependency order
2. **ChzzkService** connects to target streamer's chat via CHZZK API
3. Chat messages parsed using `GROUP_CHARACTERS` constants from **Constants**
4. **CountManager** tracks character frequencies, uses **Utils** for embed creation
5. Threshold triggers query to **DescriptionService** for randomized content
6. **DiscordService** sends styled alerts to configured channels
7. **BanUtils** processes Korean system messages for moderation events

### Key Patterns
- **Resource Management**: All services implement `CleanupableService` for proper shutdown
- **Configuration**: Environment variables + constants separation for maintainability  
- **Utility Classes**: Static methods in `DateUtils`, `BanUtils`, `ArrayUtils` for reusability
- **Type Safety**: Centralized interfaces in `types.ts` prevent service coupling issues
- **Interval Management**: `IntervalManager` prevents resource leaks from multiple timers

### Korean Language Context
The bot specifically handles Korean streaming platform moderation:
- Character patterns: 젖+버+거 (burger), 젖+치+킨 (chicken), 젖+피+자 (pizza)
- Ban message parsing with Korean regex patterns in `BanUtils`
- System message format: "A님이 B님을 {action}" for moderation events
- Requires understanding of Korean chat culture for meaningful modifications

### Testing & Development
- Jest with ts-jest for TypeScript support
- Each service has corresponding test file in `__tests__/`
- External APIs (Discord, CHZZK) are mocked
- Run individual tests: `npm test -- --testNamePattern="ServiceName"`

### Configuration Requirements
- `.env`: Discord tokens, channel IDs, CHZZK authentication
- `config/descriptions.json`: Korean alert messages by food group (watched for live updates)
- `config/tsconfig.json`: TypeScript compilation settings with ES2020 target
- `config/jest.config.js`: Test configuration with ts-jest preset

### Best Practices & Development Guidelines

**Code Quality:**
- Follow existing TypeScript patterns and type safety standards
- Use utility classes from `src/utils.ts` for common operations
- Implement `CleanupableService` interface for any new services
- Add comprehensive tests for all new functionality

**Testing Strategy:**
- Run `npm test` before committing changes
- Use `npm test -- --testNamePattern="ClassName"` for focused testing
- Mock external dependencies (Discord, CHZZK APIs) in tests
- Maintain test coverage above 95%

**Deployment:**
- Use `npm run build` to compile TypeScript
- Test locally with `npm start` before Docker deployment
- Environment variables must be configured in `.env` file
- Docker builds use multi-stage optimization for production