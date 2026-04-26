/**
 * Skill Configuration Registry
 *
 * Adding a new skill:
 * 1. Add a SkillConfig entry to the SKILLS array below
 * 2. Create an evaluator Edge Function (supabase/functions/evaluate-<id>)
 * 3. (Optional) Create a generator Edge Function for question-based skills
 * 4. Add a frontend module component in src/components/
 */

export type SkillStatus = "active" | "coming_soon";
export type SkillType = "dsa" | "webdev" | "sql" | "ml" | "devops";

export interface SkillConfig {
  id: SkillType;
  name: string;
  description: string;
  icon: string;              // Lucide icon name
  status: SkillStatus;
  color: string;             // Tailwind color for accent
  gradient: string;          // Gradient for card hover
}

export const SKILLS: SkillConfig[] = [
  {
    id: "dsa",
    name: "DSA",
    description: "Data Structures & Algorithms — AI-generated coding challenges with live evaluation.",
    icon: "Code",
    status: "active",
    color: "text-blue-400",
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    id: "webdev",
    name: "Web Dev",
    description: "Submit your GitHub projects for AI-powered portfolio evaluation.",
    icon: "Globe",
    status: "active",
    color: "text-brand-primary",
    gradient: "from-brand-primary/10 to-emerald-500/10",
  },
  {
    id: "sql",
    name: "SQL",
    description: "Database querying and optimization challenges.",
    icon: "Database",
    status: "coming_soon",
    color: "text-amber-400",
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    id: "ml",
    name: "Machine Learning",
    description: "ML concepts, model evaluation, and feature engineering.",
    icon: "Brain",
    status: "coming_soon",
    color: "text-purple-400",
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    id: "devops",
    name: "DevOps",
    description: "CI/CD, containerization, and infrastructure as code.",
    icon: "Container",
    status: "coming_soon",
    color: "text-green-400",
    gradient: "from-green-500/10 to-lime-500/10",
  },
];

/** Helper: get only active skills */
export const getActiveSkills = () => SKILLS.filter((s) => s.status === "active");

/** Helper: get a single skill by ID */
export const getSkillById = (id: SkillType) => SKILLS.find((s) => s.id === id);
