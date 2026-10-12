# EtVacancy 🇪🇹

### A Smart Platform for Finding Job Opportunities in Ethiopia

**EtVacancy** is a digital job and vacancy platform designed to connect job seekers with employers in Ethiopia. The platform aims to simplify job searching, improve recruitment processes, and make employment opportunities more accessible through web and mobile applications.

## 📌 About the Project

Finding job opportunities can be challenging due to scattered vacancy announcements and limited access to centralized employment information. EtVacancy aims to address this problem by providing a centralized platform where users can discover vacancies, manage applications, and connect with potential employers.

The project combines modern web and mobile technologies with AI-powered features to improve the job-search experience.

## 🎯 Objectives

* Centralize job and vacancy announcements.
* Help job seekers discover relevant employment opportunities.
* Simplify the recruitment and application process.
* Provide employers with tools to manage vacancies and applications.
* Explore AI integration for smarter job matching and recommendations.
* Improve access to employment opportunities across Ethiopia.

## ✨ Key Features

* **Job Listings:** Browse available job opportunities.
* **Search and Filtering:** Find vacancies based on relevant criteria.
* **Job Applications:** Support the process of applying for vacancies.
* **User Accounts:** Provide personalized experiences for users.
* **Employer Management:** Support vacancy creation and application management.
* **AI Integration:** Explore intelligent job recommendations and matching.
* **Web and Mobile Applications:** Make the platform accessible across devices.

*Note: Features may vary depending on the current implementation stage.*

## 🛠️ Technology Stack

| Technology          | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| Next.js             | Web application development                         |
| React               | User interface development                          |
| TypeScript          | Type-safe development                               |
| React Native / Expo | Mobile application development                      |
| Node.js             | JavaScript runtime for backend tooling and services |
| PostgreSQL          | Relational database                                 |
| Prisma ORM          | Database access and management                      |
| Turborepo           | Monorepo task orchestration                         |
| pnpm Workspaces     | Package and dependency management                   |
| Git and GitHub      | Version control and collaboration                   |
| AI Technologies     | Intelligent features and recommendations            |

## 📂 Project Structure

The project is organized as a monorepo to support web and mobile applications and shared code.

```text
EtVacancy/
├── apps/
│   ├── web/              # Web application
│   └── mobile/           # Mobile application
├── packages/
│   └── shared/           # Shared code and utilities
├── turbo.json            # Turborepo configuration
├── package.json          # Root scripts and dependencies
├── pnpm-workspace.yaml   # Workspace configuration
└── README.md
```

*The structure above is illustrative. Adjust it to match the actual folders in your repository.*

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

Install the following tools:

* Node.js
* pnpm
* Git
* PostgreSQL

For mobile development, you may also need Expo Go or an appropriate mobile emulator.

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Navigate into the project directory:

```bash
cd EtVacancy
```

### 2. Install Dependencies

If the project uses pnpm workspaces, run:

```bash
pnpm install
```

### 3. Configure Environment Variables

Create the required `.env` file or files based on the project's configuration.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/etvacancy"
```

Replace the example database credentials with your actual PostgreSQL configuration.

**Important:** Never commit real passwords, API keys, tokens, or other secrets to GitHub.

### 4. Set Up the Database

If the project uses Prisma, configure the database connection and run the appropriate migrations.

For example:

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

Run these commands from the directory where Prisma is configured. Your project may require different commands depending on its workspace setup.

### 5. Run the Application

Use the development commands defined in your root `package.json`.

For example:

```bash
pnpm run dev
```

If separate scripts are configured for the web and mobile applications, run the appropriate script, such as:

```bash
pnpm run dev:mobile
```

Check your `package.json` to confirm the available scripts.

## 🧪 Development

Before contributing changes, consider running the available checks:

```bash
pnpm run typecheck
pnpm run build
```

These commands work only if the corresponding scripts are configured in the project.

## 🔐 Security

* Keep environment variables and credentials private.
* Validate user input.
* Protect user accounts and personal information.
* Apply appropriate authentication and authorization.
* Use secure database access practices.
* Never expose private API keys in frontend code.

## 🗺️ Future Improvements

* Advanced job recommendations.
* AI-powered CV analysis and job matching.
* Notifications for new vacancies.
* Improved employer dashboards.
* Application tracking.
* Additional language support.
* Enhanced mobile experience.
* Analytics for employers and administrators.

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Commit and push your branch.
6. Open a pull request.

## 🎯 Our Mission

Our mission is to make employment opportunities in Ethiopia easier to discover and access by connecting job seekers and employers through technology.

## 📄 License

A license has not yet been specified. Add a `LICENSE` file before declaring the project's license.

---

**EtVacancy — Connecting Talent with Opportunity. 🇪🇹**
