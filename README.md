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
| V
