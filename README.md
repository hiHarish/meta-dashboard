# NDC – Centralised Lead Management System

A centralised lead management platform developed for **National Dental Care (NDC)** to bring leads from multiple acquisition channels into one unified system. The platform aims to simplify lead collection, monitoring, assignment, tracking and management while providing a central dashboard for operational visibility.

**Live Application:** https://meta-dashboard-theta.vercel.app/

---

## 1. Project Overview

The NDC Centralised Lead Management System is designed to streamline the complete lead management process across multiple digital channels.

Traditionally, leads generated through different sources such as the company website, Meta Ads and other marketing platforms may be managed separately. This creates challenges in tracking, monitoring, assigning and analysing leads.

This platform addresses that problem by bringing lead data into a unified system where authorised users can manage and monitor leads from a central dashboard.

### Key Objectives

- Centralise leads from multiple acquisition channels.
- Integrate website-generated enquiries with the lead management workflow.
- Simplify lead tracking and assignment.
- Improve visibility into lead status and performance.
- Reduce manual lead management and fragmented workflows.
- Provide a scalable foundation for future CRM and automation integrations.

---

## 2. Core Modules

### A. Centralised Lead Collection

Designed to collect and consolidate leads generated through different channels.

Potential acquisition sources include:

- NDC Official Website
- Meta Ads (Facebook and Instagram)
- Other marketing and lead-generation platforms

The goal is to maintain a unified source of lead information rather than managing leads independently across platforms.

### B. Website Integration

The NDC website acts as one of the primary lead-generation channels.

Website visitors can submit enquiry or appointment forms, generating leads that can be incorporated into the centralised lead management workflow.

The integration is intended to capture relevant information such as:

- Customer name
- Contact number
- Location or preferred clinic
- Enquiry details
- Marketing attribution parameters (UTM)

### C. Lead Management Dashboard

A central interface for authorised users to access and manage collected leads.

Core lead management capabilities may include:

- View and monitor leads.
- Perform CRUD operations in dashboard
- Role based architecture
- Search and filter lead records.
- Track lead status.
- Manage lead assignments.
- Review lead information.
- Monitor lead acquisition sources.

### D. Marketing Performance and Tracking

The system is designed to improve visibility into marketing-generated leads through source and campaign attribution.

Relevant tracking parameters may include:

- UTM Source
- UTM Medium
- UTM Campaign
- UTM Term
- UTM Content

These parameters help identify where leads originate and support marketing performance analysis.

---

## 3. System Architecture

The platform follows a centralised application architecture built around a Next.js application.

Conceptually, the data flow is:

```text
          LEAD ACQUISITION
                 |
       +---------+---------+
       |         |         |
     Website   Meta Ads   Other Sources
       |         |         |
       +---------+---------+
                 |
          DATA COLLECTION
                 |
          BACKEND / APIs
                 |
          DATA PROCESSING
                 |
             DATABASE
                 |
       CENTRALISED DASHBOARD
                 |
       LEAD MANAGEMENT
       /       |       \
    Track   Assign    Analyse
```

### Application Layers

**Frontend Layer**
- Provides the user interface.
- Displays lead information and dashboard views.
- Handles user interactions and form submissions.

**Backend Layer**
- Handles server-side operations.
- Processes incoming requests.
- Performs data validation and business logic.
- Communicates with external services and the database.

**Database Layer**
- Stores and retrieves lead records and related application data.
- Supports centralised lead management.

**Integration Layer**
- Connects the platform with external lead-generation sources.
- Supports website and marketing platform integrations.

*The exact implementation of each layer depends on the configured API routes, database and integrations.*

---

## 4. Technology Stack

The project uses the following technology categories:

| Technology | Purpose |
|---|---|
| Next.js | Full-stack application framework |
| React.js | Component-based user interface |
| TypeScript | Type safety and maintainability |
| Node.js | JavaScript runtime for server-side execution |
| API Routes / Route Handlers | Backend request handling |
| Database | Persistent lead and application data storage |
| Vercel | Application hosting and deployment |
| Git & GitHub | Source code management and version control |

*Confirm the actual database, authentication library and other dependencies against the project configuration.*

---

## 5. Data Flow

A typical lead management workflow follows these stages:

1. A potential customer submits an enquiry through the NDC website or an integrated marketing platform.
2. The lead information is collected from the respective source.
3. The backend receives and processes the incoming data.
4. The lead is validated and stored in the centralised data system.
5. The dashboard retrieves and displays the available lead information.
6. Authorised users can manage, track and update lead records.
7. Lead information can be used for operational monitoring and marketing analysis.

This workflow aims to provide a consistent lead management experience across multiple acquisition channels.

---

## 6. Project Setup

### Prerequisites

- Node.js (LTS recommended)
- npm, yarn, pnpm or bun
- Git

### Clone the Repository

```bash
git clone https://github.com/hiHarish/meta-dashboard.git

cd meta-dashboard
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the project root.

```env
# Add the environment variables required by the application

# Database connection
# DATABASE_URL=

# Authentication configuration
# AUTH_SECRET=

# External API configuration
# META_ACCESS_TOKEN=
# META_APP_ID=
# META_APP_SECRET=
```

Use the actual variable names and values required by your application. Never commit credentials, access tokens or secrets to GitHub.

### Run Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

---

## 7. Deployment

The application is deployed on Vercel.

**Live URL:** https://meta-dashboard-theta.vercel.app/

### Vercel Deployment Workflow

1. Push the latest source code to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables.
4. Configure the production branch.
5. Deploy the application.
6. Verify the application and its backend integrations.

### Alternative Hosting

The Next.js application can also be deployed on other Node.js-compatible hosting environments.

**Hostinger VPS**
- Install Node.js.
- Clone the repository.
- Configure environment variables.
- Build and run the Next.js application.
- Use PM2 for process management.
- Configure Nginx and SSL.

**AWS**
- Deploy through EC2 or a suitable managed application hosting service.
- Configure application runtime and environment variables.
- Connect the required database.
- Configure networking, security and domain settings.

The database and external integrations must also be configured independently when migrating hosting providers.

---

## 8. Security Considerations

- Keep API credentials and environment variables secure.
- Restrict dashboard access to authorised users.
- Validate incoming lead data on the server.
- Protect backend endpoints against unauthorised access.
- Avoid exposing sensitive customer information.
- Use HTTPS for application communication.
- Follow appropriate data privacy and retention practices.

---

## 9. Future Enhancements

The platform can be extended into a more comprehensive CRM and marketing automation ecosystem.

Potential enhancements include:

- Automated lead assignment based on clinic location.
- WhatsApp and SMS communication integrations.
- Automated follow-up reminders.
- Lead quality scoring and prioritisation.
- Real-time dashboard analytics.
- Advanced campaign and conversion reporting.
- AI-powered lead classification.
- Integration with telecalling systems.
- Multi-branch clinic performance monitoring.
- Automated lead nurturing workflows.

---

## 10. Project Impact

The centralised platform aims to solve the operational challenges associated with fragmented lead management.

By bringing website enquiries and marketing-generated leads into one system, NDC can work towards:

- Better visibility of incoming leads.
- More organised lead management.
- Improved tracking and accountability.
- Reduced manual coordination.
- Better understanding of marketing performance.
- A scalable foundation for CRM and automation.

---

## 11. Project Information

| Field | Details |
|---|---|
| Project | NDC Centralised Lead Management System |
| Organisation | National Dental Care |
| Category | Full-Stack Web Application |
| Framework | Next.js |
| Repository | [GitHub](https://github.com/hiHarish/meta-dashboard) |
| Deployment | [Vercel](https://meta-dashboard-theta.vercel.app/) |

---

**Developed to create a unified lead management ecosystem for National Dental Care.**
