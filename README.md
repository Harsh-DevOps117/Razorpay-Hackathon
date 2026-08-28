# AI Revenue Recovery Agent

A production-ready agentic payment recovery system built for the Razorpay Hackathon. This project demonstrates how to safely close the loop from detecting failed payments to determining the root cause and autonomously executing the correct recovery intervention.

## 🚀 The Architecture

This project solves the "AI Safety & Bounded Execution" problem by strictly decoupling LLM reasoning from deterministic rule enforcement.

The agentic loop relies on a multi-stage execution pipeline:

1. **Context Hydration**: Aggregates payment state, customer risk profiles, and historical transaction data.
2. **AI Decision Agent (`gpt-4o-mini`)**: Analyzes the context and proposes the optimal recovery tool (e.g., `RETRY_PAYMENT`, `CREATE_PAYMENT_LINK`, `ESCALATE`).
3. **Deterministic Policy Engine**: A strict ruleset that acts as the ultimate guardrail. It prevents the AI from exceeding maximum recovery amounts, overriding retry limits, or acting on high-risk customers. If the AI proposes an unsafe action, the policy engine immediately blocks it and forces an escalation.
4. **AI Reviewer (`gpt-4o`)**: For allowed actions, a stronger, secondary model reviews the proposed action against the context to ensure logical consistency and prevent hallucinations.
5. **Tool Execution**: Safe, typed, server-side execution of the selected action.

## 📊 Batch Evaluation & Metrics

The project includes an **Evaluation Pipeline** (`/evaluation`) designed to process large batches (e.g., 500+ synthetic records) to mathematically prove the agent's deterministic safety, false-positive rates, and recovery throughput.

The UI tracks exact metrics:
- **Revenue at Risk**: Total value of failed, recoverable payments.
- **Revenue Recovered**: Value of payments where the agent successfully executed a tool and the payment state transitioned to `SUCCESS`.
- **Blocked Actions**: Number of times the Policy Engine intercepted and prevented an unsafe AI hallucination.
- **Unresolved / Escalated**: Cases gracefully handed off to human operators when automated recovery was impossible or unsafe.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **AI Models:** OpenAI API (`gpt-4o-mini` for speed/decision, `gpt-4o` for review)
- **Styling:** Tailwind CSS (Strictly typed to the Composio brutalist developer-infrastructure design language)

## 🎨 Design System

The frontend strictly adheres to a premium developer-infrastructure visual language:
- **Monolithic Canvas**: A near-black `#0f0f0f` background with `#000000` deep panels.
- **Elevation without Shadows**: Depth is created purely through surface brightness steps and subtle borders.
- **Signature UI**: A distinct `2x2` terminal mockup grid for the transaction audit trails, featuring JetBrains Mono logs.

## 💻 Running Locally

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment variables and add your keys:
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY and DATABASE_URL
   ```

3. Generate the Prisma client and push the schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Generate the synthetic dataset and seed the database:
   ```bash
   npx tsx scripts/generate-dataset.ts
   npx tsx scripts/seed.ts
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to view the control center dashboard.
