export interface SampleJobTemplate {
  id: string;
  title: string;
  department: string;
  requirementText: string;
  dealbreakers: string[];
  weights: {
    skills: number;
    experience: number;
    impact: number;
    education: number;
  };
}

export interface SampleCvItem {
  fileName: string;
  rawText: string;
}

export const SAMPLE_JOB_TEMPLATES: SampleJobTemplate[] = [
  {
    id: "senior-ai-fullstack",
    title: "Senior Full-Stack AI Engineer",
    department: "AI Platform Engineering",
    requirementText: `We are seeking a Senior Full-Stack AI Engineer (5+ years experience) to architect and scale our core AI recruitment & document intelligence platform.

Mandatory Technical Requirements:
- Deep production expertise in Next.js, React, TypeScript, and Node.js.
- Strong Python backend experience (FastAPI) and direct integration with frontier LLM APIs (Google Gemini, Anthropic Claude, OpenAI).
- Hands-on production experience building RAG pipelines, embeddings, and Vector Databases (Pinecone, pgvector, or Milvus).
- Cloud-native deployment experience on Cloudflare Workers/D1, AWS, and Docker/Kubernetes with CI/CD automation.
- Demonstrated track record of shipping low-latency, high-accuracy systems with measurable business KPIs.

Education & Nice-to-Haves:
- B.S. or M.S. in Computer Science, Software Engineering, or equivalent.
- Experience with SQL, PostgreSQL, GraphQL, and security/encryption best practices.`,
    dealbreakers: ["TypeScript", "Python", "LLM"],
    weights: {
      skills: 45,
      experience: 30,
      impact: 15,
      education: 10,
    },
  },
  {
    id: "cloud-devops-architect",
    title: "Principal Cloud & DevOps Architect",
    department: "Infrastructure & SRE",
    requirementText: `Seeking a Principal Cloud & DevOps Architect with 6+ years experience leading multi-region infrastructure on AWS, Cloudflare edge networks, Kubernetes, and Terraform.

Core Requirements:
- Expert in Kubernetes (EKS/GKE), Docker, Terraform (IaC), and GitOps CI/CD pipelines.
- Production proficiency in Go, Python, and Linux systems engineering.
- Proven experience reducing cloud costs, improving SLA uptime to 99.99%, and securing PostgreSQL / distributed SQL databases.`,
    dealbreakers: ["Kubernetes", "Terraform", "AWS"],
    weights: {
      skills: 40,
      experience: 35,
      impact: 15,
      education: 10,
    },
  },
];

export const SAMPLE_CANDIDATE_CVS: SampleCvItem[] = [
  {
    fileName: "Alex_Rivera_Principal_AI_Engineer_CV.pdf",
    rawText: `Alex Rivera
Principal Full-Stack & AI Systems Engineer
Email: alex.rivera@techmail.io | Location: San Francisco, CA | Experience: 7+ years

EXECUTIVE SUMMARY
Principal Full-Stack AI Engineer with 7+ years of experience building high-scale Next.js, React, TypeScript, and Python (FastAPI) applications. Architected production multi-LLM orchestration engines integrating Google Gemini, Anthropic Claude, and OpenAI with RAG pipelines and Pinecone Vector databases.

WORK EXPERIENCE
Lead AI Platform Engineer — NexusCloud AI (2023 – Present)
- Architected a multi-tenant RAG & document evaluation platform using Next.js 15, React, TypeScript, Python, and FastAPI serving 120,000+ daily users.
- Integrated Google Gemini, Claude, and OpenAI APIs with custom thinking token budgets and Pinecone / PostgreSQL pgvector indexing, improving retrieval accuracy by 41%.
- Deployed edge-native services across Cloudflare Workers, AWS, Docker, and Kubernetes with automated CI/CD pipelines, reducing p95 latency by 58%.

Senior Full-Stack Software Engineer — ScaleStack Inc. (2019 – 2023)
- Built real-time analytics dashboards using React, TypeScript, Node.js, GraphQL, and SQL/PostgreSQL.
- Led system design reviews and mentored 8 engineers across frontend and backend squads.

EDUCATION
M.S. in Computer Science — Stanford University
B.S. in Computer Science — UC Berkeley`,
  },
  {
    fileName: "Elena_Rostova_Senior_FullStack_CV.pdf",
    rawText: `Elena Rostova
Senior Full-Stack Software Engineer
Email: elena.rostova@devhub.org | Experience: 5 years

SUMMARY
Senior Full-Stack Developer with 5 years of hands-on experience in React, Next.js, TypeScript, Node.js, Python, and FastAPI. Passionate about building AI-powered SaaS workflows with OpenAI, Anthropic Claude, and Google Gemini LLM APIs.

EXPERIENCE
Senior Software Engineer — FinFlow Systems (2022 – Present)
- Developed customer-facing web applications using Next.js, React, TypeScript, Tailwind CSS, and Node.js.
- Built internal AI document RAG pipeline and semantic Vector search using Python, FastAPI, REST APIs, and OpenAI / Gemini LLM endpoints, cutting manual analyst review time by 35%.
- Managed PostgreSQL SQL schemas and containerized deployments using Docker and AWS ECS with CI/CD workflows.

Software Engineer — BrightWave Digital (2020 – 2022)
- Created responsive SaaS portals with React, JavaScript, and GraphQL.

EDUCATION
B.S. in Software Engineering — University of Washington`,
  },
  {
    fileName: "Liam_Kowalski_Mid_AI_Developer_CV.pdf",
    rawText: `Liam Kowalski
Full-Stack & AI Developer
Email: liam.kowalski@codecraft.dev | Experience: 3 years

SUMMARY
Full-Stack Developer with 3 years of experience building web apps with React, TypeScript, Python, and LLM API integrations.

EXPERIENCE
Software Engineer — OrbitLabs (2023 – Present)
- Built chat interfaces in React and TypeScript connected to OpenAI LLM APIs and Pinecone Vector search for customer support bots.
- Wrote Python scripts and REST endpoints to parse customer documents and store records in SQL databases.
- Assisted with Docker containerization for staging environments.

Junior Web Developer — PixelStudio (2022 – 2023)
- Maintained frontend components in React and JavaScript.

EDUCATION
B.S. in Information Technology — State University`,
  },
  {
    fileName: "Marcus_Vance_Backend_Python_Lead_CV.pdf",
    rawText: `Marcus Vance
Senior Backend & Data Engineer
Email: marcus.vance@datapipe.io | Experience: 6 years

SUMMARY
Backend Data Engineer with 6 years of experience specializing in Python, FastAPI, SQL, PostgreSQL, AWS, and Docker microservices.

EXPERIENCE
Senior Backend Engineer — DataPulse Corp (2021 – Present)
- Engineered high-throughput ETL pipelines and backend microservices using Python, FastAPI, PostgreSQL, and AWS Lambda, processing 10 million events daily.
- Integrated LLM classification batch jobs using Python and OpenAI APIs.
- Managed Kubernetes clusters, Terraform scripts, and CI/CD pipelines.
- Note: Strictly backend focused; no production experience with React, Next.js, or TypeScript frontend frameworks.

EDUCATION
B.S. in Computer Science — Georgia Tech`,
  },
  {
    fileName: "Chloe_Bennett_Junior_UI_Designer_CV.pdf",
    rawText: `Chloe Bennett
Junior UI/UX Designer & Frontend Intern
Email: chloe.bennett@designfolio.me | Experience: 1 year

SUMMARY
Creative UI/UX Designer with 1 year of internship experience in Figma, HTML/CSS, and basic JavaScript prototypes.

EXPERIENCE
Product Design Intern — CreativeSpark Agency (2025 – Present)
- Designed wireframes and interactive prototypes in Figma for marketing websites.
- Collaborated with developers to style landing pages using Tailwind CSS and basic React templates.
- No experience with Python, backend systems, LLM APIs, Vector databases, or cloud infrastructure.

EDUCATION
B.A. in Graphic Design — Parsons School of Design`,
  },
];
