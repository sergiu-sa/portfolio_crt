# Workflow - Repo for CA

## Installation

```bash
npm install
```

## Environment Variables

This project uses environment variables for sensitive data like test credentials.

**Required variables:**

- `TEST_EMAIL` - Email for E2E test login
- `TEST_PASSWORD` - Password for E2E test login

**Setup:**

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:

   ```bash
   TEST_EMAIL=your-email@stud.noroff.no
   TEST_PASSWORD=your-password
   ```

## Available Scripts

### Development

```bash
npm run dev                    # Start Tailwind CSS watch mode
```

### Testing Development

```bash
npm test                       # Run unit tests in watch mode
npm run test:run              # Run unit tests once
npm run test:e2e              # Run all e2e tests
npm run test:e2e:ui           # Run e2e tests in UI mode
npm run test:e2e:headed       # Run e2e tests in headed mode
npm run test:e2e:report       # Show e2e test report
```

## Testing Tools

This project uses **Vitest** for unit testing and **Playwright** for end-to-end (e2e) testing.

### Unit Tests

Unit tests verify that individual functions work correctly in isolation.

**Location:** `js/utils/`

#### `isActivePath` Function

Tests navigation link highlighting logic.

**Test file:** `js/utils/isActivePath.test.js`

**What it tests:**

- ✅ Returns `true` when current path matches href exactly
- ✅ Returns `true` for root path ("/") when path is "/" or "/index.html"
- ✅ Returns `true` when current path includes the href (nested paths)
- ✅ Returns `false` when paths don't match

**Example:**

```javascript
isActivePath('/venue/123', '/venue'); // returns true
isActivePath('/login', '/register'); // returns false
```

#### `getUserName` Function

Retrieves the logged-in user's name from localStorage.

**Test file:** `js/utils/getUserName.test.js`

**What it tests:**

- ✅ Returns the user's name when user exists in storage
- ✅ Returns `null` when no user exists in storage
- ✅ Returns `null` when stored data is invalid JSON (error handling)
- ✅ Returns `null` when user object has no name property
- ✅ Returns `null` when user name is an empty string

**Example:**

```javascript
// After login, user data is stored in localStorage
getUserName(); // returns "Sergiu"

// When no user is logged in
getUserName(); // returns null
```

#### Running Unit Tests

**Run all tests in watch mode:**

```bash
npm test
```

**Run tests once (CI mode):**

```bash
npm run test:run
```

**Expected output when all tests pass:**

```bash
✓ js/utils/isActivePath.test.js (4 tests)
✓ js/utils/getUserName.test.js (5 tests)

Test Files  2 passed (2)
Tests  9 passed (9)
```

### End-to-End (E2E) Tests

E2E tests verify that the application works correctly from the user's perspective by simulating real user interactions in a browser.

**Location:** `e2e/`

#### Login Tests

Tests user authentication functionality.

**Test file:** `e2e/login.spec.js`

**What it tests:**

- ✅ User can successfully log in with valid credentials from environment variables
- ✅ User sees an error message with invalid credentials

**Example flow:**

1. Navigate to login page
2. Enter credentials from `.env` file
3. Click login button
4. Verify redirect to home page
5. Verify logout button is visible

#### Navigation Tests

Tests venue browsing and navigation functionality.

**Test file:** `e2e/navigation.spec.js`

**What it tests:**

- ✅ Navigate to home page
- ✅ Wait for venue list to load
- ✅ Click the first venue
- ✅ Verify venue details page loads with "Venue details" in the heading

**Example flow:**

1. Navigate to home page (`/`)
2. Wait for venue cards to load
3. Click first venue card
4. Verify URL contains `/venue/?id=`
5. Verify heading contains "Venue details"

#### Running E2E Tests

**Run all e2e tests:**

```bash
npm run test:e2e
```

**Run tests in UI mode (recommended for debugging):**

```bash
npm run test:e2e:ui
```

**Run tests in headed mode (see browser):**

```bash
npm run test:e2e:headed
```

**Show test report:**

```bash
npm run test:e2e:report
```

**Expected output when all tests pass:**

```bash
Running 3 tests using 3 workers

  3 passed (6.9s)

To open last HTML report run:
  npx playwright show-report
```

## Technologies Used

### Core

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript (ES6+ Modules)

### Build Tools

- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

### Testings

- [Vitest](https://vitest.dev/) - Unit testing framework
- [Playwright](https://playwright.dev/) - E2E testing framework
- [jsdom](https://github.com/jsdom/jsdom) - Browser environment for unit testing
- [dotenv](https://github.com/motdotla/dotenv) - Environment variable management

### Code Quality

- [ESLint](https://eslint.org/) - JavaScript linting
- [Prettier](https://prettier.io/) - Code formatting
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [lint-staged](https://github.com/okonet/lint-staged) - Run linters on staged files

### API

- [Noroff API](https://docs.noroff.dev/docs/v2) - Backend API for venue bookings

## Project Structure

```bash
workflow-repo-ca/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── .husky/
│   └── pre-commit              # Pre-commit hook
├── e2e/                        # E2E tests
│   ├── login.spec.js           # Login functionality tests
│   └── navigation.spec.js      # Navigation tests
├── js/
│   ├── api/                    # API calls
│   ├── constants/              # Constants and configuration
│   │   └── config.js
│   ├── listeners/              # Event listeners
│   │   ├── auth/
│   │   └── venues/
│   ├── ui/                     # UI components
│   │   └── common/
│   └── utils/                  # Utility functions
│       ├── getUserName.js
│       ├── getUserName.test.js
│       ├── isActivePath.js
│       ├── isActivePath.test.js
│       ├── storage.js
│       └── validation.js
├── css/
│   ├── input.css               # Tailwind input
│   └── style.css               # Compiled CSS
├── login/
│   └── index.html              # Login page
├── register/
│   └── index.html              # Register page
├── venue/
│   └── index.html              # Venue detail page
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── .prettierrc                 # Prettier configuration
├── eslint.config.mjs           # ESLint configuration
├── index.html                  # Homepage
├── package.json                # Dependencies and scripts
├── playwright.config.js        # Playwright configuration
├── tailwind.config.js          # Tailwind configuration
├── vitest.config.js            # Vitest configuration
└── README.md                   # This file
```

## Development Workflow

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Run tests:**

   ```bash
   npm test              # Unit tests
   npm run test:e2e      # E2E tests
   ```

5. **Before committing:**
   - Husky pre-commit hook will automatically:
     - Format HTML files with Prettier
     - Format and lint JavaScript files with Prettier and ESLint

## Git Workflow

This project uses Git hooks (via Husky) to ensure code quality:

- **Pre-commit:** Automatically formats and lints staged files
- **Staged files:** Only files you `git add` are checked

**To commit:**

```bash
git add .
git commit -m "Your commit message"
# Husky will run prettier and eslint automatically
```

## License

ISC
