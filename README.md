# SOPly — AI-Powered SOP Management Platform

> Turn any business process into a documented SOP in 5 minutes. Manage, assign, and enforce SOPs across your entire team.

🚀 **Live Demo:** [your-vercel-url.vercel.app](https://sop-generator-ecru.vercel.app/)

---

## The Problem

Every business needs Standard Operating Procedures — but creating and managing them is painful:
- Writing SOPs manually takes hours
- Nobody knows which SOPs are outdated
- Managers can't track who has read what
- Knowledge is lost when employees leave

## The Solution

SOPly uses AI to create, manage, and enforce SOPs automatically.

---

## Features

| Feature | Description |
|---|---|
| 🤖 AI SOP Generator | Describe any process in plain English — AI writes a complete professional SOP |
| 📋 Templates Library | 9 ready-made templates across HR, Engineering, Marketing, Finance, Sales |
| ✏️ AI-Powered Editor | Edit SOPs with AI assistance — "make it simpler", "add more detail" |
| 📄 PDF Export | Download beautiful branded PDFs with page numbers and formatting |
| 🏥 Health Dashboard | See which SOPs are outdated, healthy, or need review at a glance |
| 👥 Employee Management | Add team members and assign SOPs with due dates |
| ✅ Read Receipts | Track exactly who has read each SOP with timestamps |
| 🧠 Knowledge Quiz | AI generates quiz questions to test employee understanding |
| ✔️ Approval Workflow | Submit SOPs for manager approval before publishing |
| 🕐 Version History | Every edit is saved — preview and restore any previous version |
| 💬 AI Chat Assistant | Employees ask questions in plain English — AI answers from your SOPs |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| AI | Google Gemini 2.0 Flash |
| PDF Export | jsPDF |
| Deployment | Vercel |

---

## Screenshots

> Dashboard — manage all your SOPs in one place

> Health Dashboard — see which SOPs need attention

> AI Chat — employees ask questions, AI answers from your docs

> Quiz — test employee understanding with AI-generated questions

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Google Gemini API key (free tier available)

### Installation

```bash
git clone https://github.com/Sumamasonia/sop-generator.git
cd sop-generator
npm install
```

### Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Setup

Run this SQL in your Supabase SQL editor to set up all required tables:

```sql
-- SOPs table
create table sops (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  title text not null,
  description text,
  content text,
  approval_status text default 'draft',
  version_number integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- Employees, assignments, quizzes — see full schema in docs
```

---

## Project Status

🟢 **Active development** — core features complete, actively improving based on user feedback.

**Completed:**
- [x] AI SOP generation
- [x] PDF export
- [x] Employee assignments + read receipts
- [x] Knowledge quizzes
- [x] Approval workflow
- [x] Version history
- [x] AI chat over SOPs

**Coming soon:**
- [ ] Stripe payments
- [ ] Team collaboration in real time
- [ ] Slack integration
- [ ] Mobile app

---

## Author

**Sumama Sonia**
- GitHub: [@Sumamasonia](https://github.com/Sumamasonia)
- LinkedIn: [sumamasonia](https://www.linkedin.com/in/sumamasonia/)
- Email: sumamasonia@gmail.com

---

## License

MIT License — free to use and modify.

---

⭐ If you find this useful, give it a star on GitHub!
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
