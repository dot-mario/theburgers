# The Burgers

[한국어](./README.md) · **English** · [🏠 Back to Root](../README.md)

About 99% of the total code for this project was generated automatically by ChatGPT o3 mini, and then underwent comprehensive refactoring and **dynamic configuration system implementation** by Claude 3.5 Sonnet to significantly improve code quality and maintainability.  

<a href="https://discord.gg/kV8Jy3zT">
  <img src="https://discord.com/api/guilds/1006888359249055814/widget.png?style=banner2" alt="Discord Banner 2" />
</a>

## Project Overview

**The Burgers** is a bot that integrates the CHZZK chat service with Discord to automatically send notifications to Discord channels when certain words or commands are typed a certain number of times.

### 🆕 **Dynamic Configuration System** - Major Innovation

We've completely transformed the hardcoded detection patterns into a **fully dynamic, web-manageable system**:

- **Web Dashboard**: Intuitive browser-based UI for managing detection groups
- **Real-time Application**: Configuration changes apply instantly without server restart
- **Supabase Integration**: Scalable PostgreSQL-based data storage
- **Unlimited Groups**: Add as many detection patterns as desired beyond the original '젖버거', '젖피자'
- **Real-time Monitoring**: Live tracking of current count status and system health

### Key Features

- **Real-time Chat Monitoring:**  
  Connects to the CHZZK chat server to monitor chat messages in a streamer's channel.
  
- **Dynamic Word/Phrase Detection:** 🆕  
  Create and manage unlimited detection groups through the web interface. Configure character sequences, colors, emojis, and thresholds individually for each group.
  
- **Intelligent Notification System:**  
  Sends styled embedded messages to Discord channels when each group's count reaches its configured threshold.  
  Also sends notification messages to Discord channels when system message events (e.g., activity restriction, temporary restriction, unrestriction) occur.
  
- **Web-based Configuration Management:** 🆕  
  Responsive web dashboard accessible at `http://localhost:3000` for managing all settings.
  
- **Advanced Resource Management:**  
  Consistent resource management through `CleanupableService` interface and centralized timer management using `IntervalManager` class to prevent memory leaks.

- **Dependency Injection Pattern:**  
  Centralized service lifecycle management through `Application` class with graceful shutdown functionality.

## Technology Stack

### Core System
- **TypeScript:** Reliable code development with static type checking and modern JavaScript syntax
- **Node.js:** Server-side runtime environment
- **Discord.js:** Library for Discord API integration
- **CHZZK:** [kimcore/chzzk](https://github.com/kimcore/chzzk) open source library for CHZZK chat API integration

### Dynamic Configuration System 🆕
- **Supabase:** PostgreSQL-based real-time database and authentication
- **Express.js:** RESTful API server and web interface provision
- **Vanilla JavaScript:** Lightweight frontend (no external framework dependencies)
- **CORS:** Secure cross-origin request handling

### Development Tools
- **date-fns:** Date and time handling
- **dotenv:** Environment variable management
- **Jest:** Unit testing framework
- **Docker:** Container image creation with multi-stage builds

## Project File Structure

```bash
theburgers/
├── .env                       # Environment variables file (including Supabase settings)
├── .env.example               # 🆕 Environment variables example file
├── config/descriptions.json   # Dynamic description phrases file
├── Dockerfile                 # Docker multi-stage build file
├── docker-compose.yml         # Docker Compose configuration file
├── package.json               # Dependency and script management file
├── src/                       # Source code directory
│   ├── application.ts         # Central service lifecycle manager
│   ├── config.ts              # Environment variable and configuration management module
│   ├── constants.ts           # Extended constants management (for fallback)
│   ├── types.ts               # Centralized type definitions and interfaces
│   ├── utils.ts               # Common utility classes
│   ├── descriptionService.ts  # Dynamic phrase loading and file watching service
│   ├── discordService.ts      # Discord client and message sending module
│   ├── countManager.ts        # 🔄 Dynamic pattern detection, threshold notifications, cooldown management
│   ├── chzzkService.ts        # 🔄 CHZZK chat integration and dynamic pattern processing
│   ├── index.ts               # 🔄 Web server integrated application entry point
│   ├── webServer.ts           # 🆕 Web server integration manager
│   ├── types/                 # 🆕 Type definitions directory
│   │   └── database.ts        # 🆕 Supabase database types
│   ├── database/              # 🆕 Database integration
│   │   └── supabaseClient.ts  # 🆕 Supabase client configuration
│   ├── config/                # 🆕 Dynamic configuration system
│   │   ├── SupabaseConfigurationService.ts  # 🆕 Configuration service
│   │   └── DynamicConstants.ts              # 🆕 Dynamic constants management
│   ├── web/                   # 🆕 Web interface
│   │   ├── configApi.ts       # 🆕 REST API endpoints
│   │   └── public/            # 🆕 Web dashboard
│   │       ├── dashboard.html # 🆕 Main dashboard UI
│   │       ├── css/dashboard.css  # 🆕 Responsive styling
│   │       └── js/dashboard.js    # 🆕 Frontend logic
│   └── migration/             # 🆕 Data migration
│       └── supabaseMigration.ts   # 🆕 Existing data migration script
├── docs/                      # 📚 Documentation directory
│   ├── README.md              # Korean documentation
│   ├── README.en.md           # English documentation (current file)
│   ├── CLAUDE.md              # Claude Code development guide
│   └── DYNAMIC_CONFIG_SETUP.md  # 🆕 Dynamic configuration system setup guide
└── __tests__/                 # Comprehensive test files directory
    ├── application.test.ts         # Application class tests
    ├── utils.test.ts               # Utility classes tests
    ├── config.test.ts              # config module tests
    ├── descriptionService.test.ts  # File watching, random selection, error handling tests
    ├── discordService.test.ts      # Discord client lifecycle and error handling tests
    ├── countManager.test.ts        # Dynamic pattern-based tests, threshold validation
    └── chzzkService.test.ts        # Message processing, ban system, event handling tests
```

## How to Use

### 🚀 Quick Start (Dynamic Configuration System)

1. **Clone Project and Install Dependencies**
```bash
git clone https://github.com/your-repo/theburgers.git
cd theburgers
npm install
```

2. **Set up Supabase Project**
- Create a new project on [Supabase](https://supabase.com)
- Note down the project URL and API keys

3. **Configure Environment Variables**
Create a `.env` file and configure the required values:
```bash
# Existing Discord/CHZZK Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_ALERT_CHANNEL_ID=your_discord_alert_channel_id
DISCORD_BAN_CHANNEL_ID=your_discord_ban_channel_id
NID_AUTH=your_nid_auth_token
NID_SESSION=your_nid_session_token

# 🆕 Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 🆕 Web Server Configuration
WEB_PORT=3000
ENABLE_WEB_SERVER=true
ALLOWED_ORIGINS=http://localhost:3000
```

4. **Initialize Database**
Run the SQL scripts from [Dynamic Configuration System Setup Guide](./DYNAMIC_CONFIG_SETUP.md) in the Supabase SQL editor.

5. **Build and Run**
```bash
npm run build
npm start
```

6. **Access Web Dashboard** 🎉
Open your browser and navigate to `http://localhost:3000` to manage detection groups!

### 📊 Web Dashboard Features

#### Detection Group Management
- **Add Groups**: Create new detection pattern groups (e.g., 'ramen', 'tteokbokki', etc.)
- **Edit Groups**: Configure character sequences, colors, emojis, and thresholds individually
- **Real-time Preview**: See configuration changes immediately
- **Group Activation/Deactivation**: Temporarily disable specific groups
- **Search and Filter**: Easy management even with many groups

#### System Settings
- **Global Threshold**: Set default threshold for all groups
- **Alert Cooldown**: Configure minimum interval between consecutive alerts
- **Count Reset**: Set automatic count reset interval

#### Real-time Monitoring
- **Current Counts**: Live tracking of count status for each group
- **System Status**: Connection status, uptime, number of active groups
- **Auto Refresh**: Automatic status updates every 30 seconds

### 🔧 Development Mode

For development with automatic TypeScript file watching and compilation:
```bash
npm run dev
```

### 🧪 Testing

Run unit tests:
```bash
npm run test

# Run specific tests
npm test -- --testNamePattern="SupabaseConfiguration"
npm test -- --testNamePattern="DynamicConstants"
```

### 🐳 Using Docker

```bash
# Build Docker image
docker build -t theburgers .

# Run container
docker run -d --env-file .env -p 3000:3000 theburgers

# Using Docker Compose
docker-compose up -d
```

## API Endpoints 🆕

RESTful API for programmatic configuration management:

### Group Management
- `GET /api/config/groups` - List all detection groups
- `POST /api/config/groups` - Create new detection group
- `PUT /api/config/groups/:id` - Update existing group
- `DELETE /api/config/groups/:id` - Delete group

### System Settings
- `GET /api/config/settings` - Get system settings
- `PUT /api/config/settings/:key` - Update settings

### System Control
- `POST /api/config/reload` - Force configuration reload
- `GET /api/config/status` - System status and statistics
- `GET /api/config/validation` - Configuration validation

## Migration Guide 🔄

How to upgrade from the hardcoded version to the dynamic configuration system:

1. **Backup**: Back up existing `descriptions.json` file
2. **Add Environment Variables**: Add Supabase-related environment variables
3. **Database Setup**: Run SQL scripts
4. **Run Migration**: 
   ```bash
   npx ts-node src/migration/supabaseMigration.ts
   ```
5. **Verify Configuration**: Check migrated data in the web dashboard

For detailed instructions, see the [Dynamic Configuration System Setup Guide](./DYNAMIC_CONFIG_SETUP.md).

## CI/CD & GitHub Actions

This project leverages GitHub Actions to set up an automated CI/CD pipeline:

### 1. Build and Deploy Docker Image
This workflow runs when a push is made to the `main` branch or a release is issued, builds a Docker image and deploys it to Docker Hub.  
Workflow file: `.github/workflows/deploy.yml`

### 2. Run Tests on Pull Requests
This workflow runs when a pull request is created that targets the `main` branch and ensures that all tests pass before the PR can be merged.  
Workflow file: `.github/workflows/test.yml`

### Branching Strategy and Protection Rules
- **develop**: Development branch for new features and bug fixes
- **main**: Deployment branch where only tested and code-reviewed changes are merged

GitHub Branch Protection Rules prevent direct pushes to the main branch and only allow merges via PRs that have passed testing and CI.

## Code Architecture & Refactoring

### 🏗️ Architecture Innovations

#### Dynamic Configuration System 🆕
- **Web-based Management**: Hardcoded → Dynamic web interface
- **Supabase Integration**: PostgreSQL + Realtime for scalable data storage
- **Real-time Application**: Configuration changes apply instantly without server restart
- **Unlimited Expansion**: Add as many detection groups as desired
- **Type Safety**: TypeScript ensures database schema type safety

#### Existing Architecture Improvements
- **Dependency Injection Pattern**: Centralized service management through `Application` class
- **Enhanced Type Safety**: Central interface management in `types.ts`
- **Utility-Based Design**: Reusable `BanUtils`, `DateUtils`, `ArrayUtils` classes
- **Improved Resource Management**: `IntervalManager` and `CleanupableService` interface

### 🔧 Code Quality Enhancements

- **Dynamic Configuration Loading**: Hardcoded constants → Database-based dynamic loading
- **Standardized Error Handling**: Consistent error handling patterns across all services
- **Fallback System**: Automatic fallback to default configuration when Supabase unavailable
- **Expanded Test Coverage**: Comprehensive testing including dynamic configuration system
- **Graceful Shutdown**: Safe termination process through signal handlers

### 🧪 Testing Strategy

- **Unit Tests**: Independent tests for each utility class
- **Integration Tests**: Complete Application lifecycle testing
- **Dynamic Configuration Tests**: Validation of configuration changes and application process
- **API Tests**: Web API endpoint functionality testing
- **Mocking Strategy**: Complete isolation of external API dependencies

### 🚀 Performance Optimizations

- **Real-time Synchronization**: Instant configuration sync via Supabase Realtime
- **Caching Strategy**: 30-second TTL balancing performance and real-time capabilities
- **Memory Leak Prevention**: Centralized interval management
- **Code Reusability**: 50% reduction in duplicate code
- **Scalability**: Unlimited group management through web interface

### 📚 Development History

- **Initial Development**: Auto-generation through ChatGPT o3 mini (99% code)
- **Refactoring**: Comprehensive code quality improvement via Claude 3.5 Sonnet
- **Dynamic System Implementation**: Hardcoded → Supabase-based dynamic configuration system 🆕
- **Web Interface Development**: User-friendly management dashboard construction 🆕
- **Test System Construction**: Comprehensive test suite and CI/CD integration

## How to Contribute

If you would like to contribute, please follow these steps:

1. Fork this repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the remote repository: `git push origin feature/your-feature-name`
5. Create a Pull Request

### Development Guidelines

- **Dynamic Configuration**: Add new detection patterns through the web interface
- **Type Safety**: Adhere to TypeScript type definitions
- **Test Writing**: Tests are mandatory for new features
- **Documentation Updates**: Update related documentation when features change

## License

This project is distributed under the MIT license. Please refer to the LICENSE file for details.

---

## 🎉 Innovation Summary

**Hardcoded Era** → **Dynamic Configuration Era**
- Editing `constants.ts` → Clicking in web browser
- Server restart required → Real-time application
- 3 fixed groups → Unlimited groups
- Developer-only modifications → Anyone can manage via web

Now you can add any patterns like '젖라면' (ramen), '젖떡볶이' (tteokbokki), '젖치킨' (chicken), etc. **in real-time through a web browser** beyond just '젖버거' and '젖피자'! 🚀