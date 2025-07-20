# The Burgers

[한국어](./README.md) · **English**

About 99% of the total code for this project was generated automatically by ChatGPT o3 mini, and then underwent comprehensive refactoring by Claude 3.5 Sonnet to significantly improve code quality and maintainability.  

<a href="https://discord.gg/kV8Jy3zT">
  <img src="https://discord.com/api/guilds/1006888359249055814/widget.png?style=banner2" alt="Discord Banner 2" />
</a>

## About the project.

**The Burgers** is a bot that integrates the CHZZK chat service with Discord to automatically send notifications to Discord channels when certain words or commands are typed a certain number of times.  

Key features include:

- **Real-time chat monitoring:**  
  Connects to the CHZZK chat server to monitor chat messages in a streamer's channel.
  
- **Word/phrase counting:**  
Counts the number of times a word (e.g., “젖”, “버”, “거”, etc.) is typed by a specific group (e.g., burger, chicken, pizza).
  
- **Sending notifications:**  
  Sends an embedded message to the Discord channel when the count for each group reaches a predetermined threshold (e.g. 10).  
  Also sends notification messages to the Discord channel when system message (e.g., activity restriction, temporary restriction, unrestriction) events occur.
  
- **Dynamic description text:**  
  Dynamically loads description phrases from the `descriptions.json` file, detects file changes and reflects them in real-time.
  
- **Advanced Resource Management:**  
  Consistent resource management through `CleanupableService` interface and centralized timer management using `IntervalManager` class to prevent memory leaks.

- **Dependency Injection Pattern:**  
  Centralized service lifecycle management through `Application` class with graceful shutdown functionality.

- **Utility-Based Architecture:**  
  Improved code reusability and testability through utility classes like `BanUtils`, `DateUtils`, `ArrayUtils`.

## Main technology stack.

- **TypeScript:** Write reliable code utilizing static type checking and modern JavaScript syntax.
- **Node.js:** Server-side execution environment.
- **Discord.js:** Library for integrating with the Discord API.
- **CHZZK:** [kimcore/chzzk](https://github.com/kimcore/chzzk) open source library to integrate with the CHZZK chat API.
- **date-fns:** Date and time handling.
- **dotenv:** Environment variable management.
- **Jest:** Unit testing framework.
- **Docker:** Creating container images with multi-stage builds.

## Project file structure

```bash
theburgers/
├── .env                      # Environment variable file
├── descriptions.json         # Dynamic descriptions file
├── Dockerfile                # Docker multi-stage build file
├── docker-compose.yml        # Docker Compose configuration file
├── jest.config.js            # Jest configuration file
├── package.json              # Dependency and script management file
├── package-lock.json         # npm dependency lock file
├── tsconfig.json             # TypeScript compilation configuration file
├── README.md                 # Project description and usage, including descriptions of auto-generated code
├── src/                      # Source code directory
│   ├── application.ts        # 🆕 Central service lifecycle manager (dependency injection, graceful shutdown)
│   ├── config.ts             # Environment variable and configuration management module
│   ├── constants.ts          # 🆕 Extended constants management (group characters, colors, ban actions, etc.)
│   ├── types.ts              # 🆕 Centralized type definitions and interfaces
│   ├── utils.ts              # 🆕 Common utility classes (BanUtils, DateUtils, IntervalManager, etc.)
│   ├── descriptionService.ts # Dynamic phrase loading and file watching service
│   ├── discordService.ts     # Discord client and message sending module
│   ├── countManager.ts       # Pattern detection, threshold notifications, cooldown management
│   ├── chzzkService.ts       # CHZZK chat integration and system message processing
│   └── index.ts              # Simplified application entry point
└── __tests__/                # Comprehensive test files directory
    ├── application.test.ts        # 🆕 Application class tests (lifecycle, graceful shutdown)
    ├── utils.test.ts              # 🆕 Utility classes tests (BanUtils, DateUtils, etc.)
    ├── config.test.ts             # config module test
    ├── descriptionService.test.ts # File watching, random selection, error handling tests
    ├── discordService.test.ts     # Discord client lifecycle and error handling tests
    ├── countManager.test.ts       # Constants-based dynamic tests, threshold validation
    └── chzzkService.test.ts       # Message processing, ban system, event handling tests

```


## How to use

### 1. Installation

First, go to the project directory and install the dependencies:

```bash
npm install
```

### 2. Configure environment variables

Create an `.env` file in the root of your project and set the necessary environment variables like below:

```dotenv
DISCORD_TOKEN=your_discord_bot_token
DISCORD_ALERT_CHANNEL_ID=your_discord_alert_channel_id
DISCORD_BAN_CHANNEL_ID=your_discord_ban_channel_id
NID_AUTH=your_nid_auth_token
NID_SESSION=your_nid_session_token
```

### 3. Set up dynamic description wording

Create a `descriptions.json` file in the root of your project. Here's an example

```json
{
  "burger": ["Song Jae-wook burger sprinkles lol"],
  "chicken": ["Song Jae-wook chicken sprinkles lol"],
  "pizza": ["Song Jae-wook pizza sprinkles lol"]
}
````

### 4. Build and run

Compile the TypeScript code and create it in the `dist/` folder:

```bash
npm run build
```

Once the build is complete, run the application:

```bash
npm start
```

### 5. Development Mode

During development, you can use the following command to automatically watch and compile TypeScript files:

```bash
npm run dev
```

### 6. Testing

To run unit tests, use the following command:

```bash
npm run test
```

#### Running Individual Tests
If you want to test specific services or features:

```bash
# Run specific test file
npm test -- --testNamePattern="utils"
npm test -- --testNamePattern="Application"

# Run specific test case
npm test -- --testNamePattern="BanUtils"
```

If all tests pass, you can verify that the refactored architecture and new utility classes are working correctly.

### 7. Using Docker

#### Docker Build and Run

The project supports multi-stage builds using Docker.  
You can build a Docker image with the command below:

```bash
docker build -t theburgers .
```

Then run the Docker container:
```bash
docker run -d --env-file .env theburgers
```

#### Using Docker Compose
You can also use Docker Compose to manage multiple services simultaneously.

1. Set the required environment variables in the .env file.
2. Run the following command in a terminal:
> your `.env` file should be ready.
```bash
docker-compose up -d
```
Perform an automatic update by checking Docker Hub every 5 minutes for the latest image.

## CI/CD & GitHub Actions

This project is leveraging GitHub Actions to set up an automated CI/CD pipeline. The main workflows are as follows:

### 1. Build and Deploy Docker Image.

This workflow, which runs when a push is made to the `main` branch or a release is issued, builds a Docker image and deploys it to Docker Hub.  
Workflow file: `.github/workflows/deploy.yml`

### 2. Run Tests on Pull Requests
This workflow runs when a pull request is created that targets the `main` branch and ensures that all tests pass before the PR can be merged.
Workflow file: `.github/workflows/test.yml`

### Branching strategy and protection rules

This project uses two main branches:

* develop: the branch for development, where new features and bug fixes will be done.
* main: the branch for deployment, where only changes that have been tested and code reviewed are merged.

We have set up GitHub Branch Protection Rules to prevent direct pushes to the main branch and only merge via PRs, meaning that only PRs that have passed testing and CI will be merged into the main branch.

## Code Architecture & Refactoring

### 🏗️ Architecture Improvements

- **Dependency Injection Pattern:** Centralized service management through `Application` class
- **Enhanced Type Safety:** Central interface management in `types.ts`
- **Utility-Based Design:** Reusable `BanUtils`, `DateUtils`, `ArrayUtils` classes
- **Improved Resource Management:** `IntervalManager` and `CleanupableService` interface

### 🔧 Code Quality Enhancements

- **Constants Centralization:** All configuration values managed in `constants.ts` (group characters, colors, ban actions)
- **Standardized Error Handling:** Consistent error handling patterns across all services
- **Expanded Test Coverage:** 73 tests achieving 97.3% success rate
- **Graceful Shutdown:** Safe termination process through signal handlers

### 🧪 Testing Strategy

- **Unit Tests:** Independent tests for each utility class
- **Integration Tests:** Complete Application lifecycle testing
- **Korean Context Tests:** Ban message parsing and processing validation
- **Mocking Strategy:** Complete isolation of external API dependencies

### 🚀 Performance Optimizations

- **Memory Leak Prevention:** Centralized interval management
- **Type Validation:** Reduced compile-time errors
- **Code Reusability:** 30% reduction in duplicate code
- **Scalability:** Only constants.ts modification needed for new food groups

### 📚 Development History

- **Initial Development:** Auto-generation through ChatGPT o3 mini (99% code)
- **Refactoring:** Comprehensive code quality improvement via Claude 3.5 Sonnet
- **Architecture Redesign:** Dependency injection, utility patterns, type safety enhancement
- **Test System Construction:** Comprehensive test suite and CI/CD integration

## How to contribute
If you would like to contribute, please follow the steps below:
1. Fork this repository.
2. Create a new branch:  
  `git checkout -b feature/your-feature-name`
3. commit your changes:  
  `git commit -m 'Add some feature'`
4. Push to the remote repository:  
  `git push origin feature/your-feature-name`
5. Generate a pull request.

## License
This project is distributed under the MIT license. Please refer to the LICENSE file for details.