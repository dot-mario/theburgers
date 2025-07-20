# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm start` - Run the compiled application with both bot and web server
- `npm run dev` - Run TypeScript compiler in watch mode for development
- `npm run test` - Run Jest unit tests including dynamic configuration tests

### Dynamic Configuration Commands 🆕
- `npx ts-node src/migration/supabaseMigration.ts` - Migrate existing hardcoded data to Supabase
- `curl http://localhost:3000/api/config/groups` - Test API endpoints
- `curl -X POST http://localhost:3000/api/config/reload` - Force configuration reload

### Docker Commands
- `docker build -t theburgers .` - Build Docker image using multi-stage build
- `docker run -d --env-file .env -p 3000:3000 theburgers` - Run with web interface exposed
- `docker-compose up -d` - Run with auto-update functionality (checks for updates every 5 minutes)

## Architecture Overview

This is a **CHZZK-Discord integration bot** with **dynamic configuration system** that monitors Korean streaming platform CHZZK chat messages and sends Discord notifications when specific word patterns are detected. The system now supports unlimited, web-manageable detection groups instead of hardcoded patterns.

### 🆕 Dynamic Configuration System Architecture

**Revolutionary Change**: Hardcoded detection patterns → Web-managed dynamic configuration

**Core Components**:
1. **Supabase Database Integration** - PostgreSQL backend with real-time capabilities
2. **Web Management Interface** - React-like dashboard at `http://localhost:3000`
3. **RESTful API Layer** - Express.js server for configuration management
4. **Real-time Configuration Sync** - Supabase Realtime for instant updates
5. **Fallback System** - Graceful degradation when database unavailable

### Application Architecture Layers

**Application Manager** (`src/application.ts`) - Enhanced with dynamic configuration
- Central orchestrator with **Supabase integration**
- Manages **dynamic configuration services** and real-time updates
- **Configuration-aware** startup sequence and dependency management
- Provides signal handlers for graceful termination with cleanup

### Core Services (Updated for Dynamic Configuration)

All services implement the `CleanupableService` interface and support **dynamic reconfiguration**:

1. **ChzzkService** (`src/chzzkService.ts`) - **Dynamic pattern detection**
   - Connects to Korean streaming platform using `chzzk` library
   - **Dynamically loads** detection patterns from Supabase
   - Processes system messages for ban/unban events
   - **Real-time pattern updates** without service restart

2. **CountManager** (`src/countManager.ts`) - **Dynamic threshold management**
   - **Dynamically tracks** Korean character combinations by configurable groups
   - **Real-time threshold updates** and group-specific styling
   - **Hot-reload** configuration changes via event system
   - Creates Discord embeds with **database-driven** styling

3. **DiscordService** (`src/discordService.ts`) - Discord integration (unchanged)
   - Manages Discord bot client lifecycle
   - Sends embedded alerts and ban notifications
   - Handles channel resolution and error recovery

4. **DescriptionService** (`src/descriptionService.ts`) - **Enhanced dynamic content**
   - Loads alert messages from descriptions.json with file watching
   - **Supports dynamic groups** beyond hardcoded burger/chicken/pizza
   - Provides randomized content selection for notifications

### 🆕 Dynamic Configuration Services

**SupabaseConfigurationService** (`src/config/SupabaseConfigurationService.ts`)
- **Primary configuration manager** replacing hardcoded constants
- Handles CRUD operations for detection groups
- **Event-driven updates** with real-time synchronization
- **Caching strategy** with 30-second TTL for performance
- **Graceful fallback** to default configuration on database errors

**DynamicConstants** (`src/config/DynamicConstants.ts`)
- **Adapter layer** between legacy constant system and dynamic configuration
- **Real-time group loading** with automatic cache invalidation
- **Type-safe accessors** for group characters, colors, emojis, thresholds
- **Backwards compatibility** with existing service interfaces

**ConfigurationAPI** (`src/web/configApi.ts`)
- **RESTful API server** for web interface and programmatic access
- **CRUD endpoints** for detection groups and system settings
- **Real-time validation** and error handling
- **CORS-enabled** for secure web interface communication

### 🌐 Web Management Interface

**Dashboard** (`src/web/public/dashboard.html`)
- **Responsive web interface** for managing detection groups
- **Real-time preview** of configuration changes
- **Mobile-optimized** design with touch-friendly controls
- **Multi-tab interface**: Groups, Settings, Monitor, Statistics

**Frontend Logic** (`src/web/public/js/dashboard.js`)
- **Vanilla JavaScript** implementation (no framework dependencies)
- **Real-time API communication** with automatic error handling
- **Live configuration updates** with immediate feedback
- **Form validation** and user-friendly error messages

### 📊 Database Schema (Supabase)

**detection_groups** table:
```sql
- id: UUID (primary key)
- name: TEXT (unique group identifier)
- display_name: TEXT (Korean display name)
- characters: JSONB (array of detection characters)
- color: INTEGER (Discord embed color)
- emoji: TEXT (group emoji)
- enabled: BOOLEAN (group activation status)
- threshold: INTEGER (detection threshold)
- created_at/updated_at: TIMESTAMP
```

**system_settings** table:
```sql
- key_name: TEXT (setting identifier)
- value_data: JSONB (setting value)
- updated_at: TIMESTAMP
```

**configuration_history** table:
```sql
- group_id: UUID (references detection_groups)
- change_type: TEXT (CREATE/UPDATE/DELETE)
- old_data/new_data: JSONB (change tracking)
- changed_by: TEXT (audit trail)
```

### Data Flow & Service Interaction (Updated)

1. **Application** initializes services with **dynamic configuration loading**
2. **SupabaseConfigurationService** loads detection groups from database
3. **ChzzkService** connects to target streamer's chat via CHZZK API
4. Chat messages parsed using **dynamic group patterns** from database
5. **CountManager** tracks character frequencies with **real-time thresholds**
6. **Real-time updates** apply new patterns without service restart
7. **Web interface** provides live management and monitoring capabilities
8. **API endpoints** enable programmatic configuration management

### Key Patterns (Enhanced)

- **Dynamic Configuration**: Database-driven patterns replacing hardcoded constants
- **Real-time Updates**: Configuration changes apply instantly without restart
- **Resource Management**: All services implement `CleanupableService` for proper shutdown
- **Event-Driven Architecture**: Configuration changes propagate via event system
- **Fallback Strategy**: Graceful degradation when Supabase unavailable
- **Type Safety**: TypeScript interfaces for database schema and API contracts
- **Caching Strategy**: Intelligent caching with TTL for performance optimization

### Korean Language Context (Expanded)

The bot handles Korean streaming platform moderation with **unlimited pattern support**:
- **Dynamic character patterns**: Web-configurable sequences beyond 젖+버+거, 젖+치+킨, 젖+피+자
- **Extensible groups**: Add 젖+라+면 (ramen), 젖+떡+볶+이 (tteokbokki), etc. via web interface
- Ban message parsing with Korean regex patterns in `BanUtils`
- System message format: "A님이 B님을 {action}" for moderation events
- **Cultural adaptability**: Easy addition of new Korean food/meme patterns

### Testing & Development (Updated)

- **Jest with ts-jest** for TypeScript support including dynamic configuration tests
- **Mock Supabase** client for isolated testing
- **Configuration service tests** for CRUD operations and caching
- **API endpoint tests** for web interface functionality
- **Integration tests** for dynamic pattern loading and real-time updates
- Run individual tests: `npm test -- --testNamePattern="SupabaseConfiguration"`

### Configuration Requirements (Updated)

**Environment Variables (.env)**:
```bash
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_ALERT_CHANNEL_ID=your_discord_alert_channel_id
DISCORD_BAN_CHANNEL_ID=your_discord_ban_channel_id

# CHZZK Configuration
NID_AUTH=your_nid_auth_token
NID_SESSION=your_nid_session_token

# 🆕 Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 🆕 Web Server Configuration
WEB_PORT=3000
ENABLE_WEB_SERVER=true
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Database Setup**: Run SQL scripts from `docs/DYNAMIC_CONFIG_SETUP.md` in Supabase SQL editor

**Legacy Files** (still supported for fallback):
- `config/descriptions.json`: Korean alert messages by food group
- `src/constants.ts`: Fallback configuration when database unavailable

### 🆕 Web Interface Usage

**Dashboard Access**: `http://localhost:3000` when ENABLE_WEB_SERVER=true

**Key Features**:
- **Group Management**: Create, edit, delete detection groups
- **Real-time Preview**: See configuration changes immediately
- **Pattern Testing**: Test detection patterns before applying
- **System Monitoring**: View current counts and system status
- **Mobile Responsive**: Works on all device sizes

**API Endpoints**:
- `GET /api/config/groups` - List all detection groups
- `POST /api/config/groups` - Create new detection group
- `PUT /api/config/groups/:id` - Update existing group
- `DELETE /api/config/groups/:id` - Delete group
- `POST /api/config/reload` - Force configuration reload
- `GET /api/config/status` - System status and statistics

### Migration from Hardcoded System

**Automatic Migration**: Run `npx ts-node src/migration/supabaseMigration.ts`

**Manual Steps**:
1. Set up Supabase project and database schema
2. Configure environment variables
3. Run migration script to transfer existing patterns
4. Verify configuration in web dashboard
5. Test dynamic pattern updates

**Backwards Compatibility**: System gracefully falls back to hardcoded constants if Supabase unavailable

### Best Practices & Development Guidelines (Updated)

**Dynamic Configuration Development**:
- **Database-first approach**: Design schema changes before code changes
- **Event-driven updates**: Use configuration change events for service updates
- **Graceful degradation**: Always provide fallback behavior
- **Real-time validation**: Validate configurations before applying
- **Audit trail**: Track all configuration changes for debugging

**Code Quality**:
- Follow existing TypeScript patterns and type safety standards
- Use **dynamic configuration services** instead of hardcoded constants
- Implement `CleanupableService` interface for any new services
- Add comprehensive tests for all new functionality including API endpoints

**Testing Strategy**:
- Run `npm test` before committing changes
- Test **dynamic configuration scenarios** including database failures
- Mock Supabase client for isolated unit tests
- Test web interface functionality and API endpoints
- Maintain test coverage above 95% including new dynamic features

**Web Interface Development**:
- **Mobile-first responsive design** for all new UI components
- **Progressive enhancement** for JavaScript functionality
- **Graceful error handling** with user-friendly messages
- **Real-time updates** without page refresh where possible

**Deployment**:
- Configure **Supabase environment** before deployment
- Test **web interface accessibility** on port 3000
- Verify **database connectivity** and fallback behavior
- Environment variables must include both legacy and Supabase configuration
- Docker builds include web server capability with port exposure

### Performance Considerations

**Database Optimization**:
- **Connection pooling** for Supabase client
- **Intelligent caching** with 30-second TTL
- **Batch operations** for multiple configuration changes
- **Query optimization** with proper indexing

**Real-time Performance**:
- **Event debouncing** for rapid configuration changes
- **Lazy loading** of non-critical configuration data
- **Progressive enhancement** for web interface features
- **Efficient polling** for real-time status updates

### Security Considerations

**API Security**:
- **CORS configuration** for allowed origins
- **Input validation** on all API endpoints
- **SQL injection prevention** via parameterized queries
- **Rate limiting** on configuration change endpoints

**Database Security**:
- **Row Level Security (RLS)** on Supabase tables
- **Service role isolation** for server operations
- **Environment variable protection** for sensitive keys
- **Audit logging** for all configuration changes

### Troubleshooting

**Common Issues**:
- **Supabase connection failures**: Check environment variables and network connectivity
- **Configuration not updating**: Verify real-time subscriptions and cache invalidation
- **Web interface not loading**: Check WEB_PORT and ENABLE_WEB_SERVER settings
- **Pattern detection issues**: Verify group configuration and character sequences

**Debug Steps**:
1. Check **Supabase connection** with `testSupabaseConnection()`
2. Verify **configuration loading** in application logs
3. Test **API endpoints** directly with curl/Postman
4. Check **browser console** for web interface errors
5. Review **database logs** in Supabase dashboard