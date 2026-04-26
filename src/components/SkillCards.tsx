/**
 * SkillCards — Grid of all skills from the config registry.
 *
 * Active skills are clickable, coming_soon skills show a disabled state.
 */

import React from "react";
import { motion } from "motion/react";
import {
  Code,
  Globe,
  Database,
  Brain,
  Container,
  Lock,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { SKILLS, type SkillConfig, type SkillType } from "../lib/skillConfig";

/** Map icon name (string) → Lucide component */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {  // eslint-disable-line
  Code,
  Globe,
  Database,
  Brain,
  Container,
};

interface SkillCardsProps {
  onSelectSkill: (skillId: SkillType) => void;
}

export const SkillCards = ({ onSelectSkill }: SkillCardsProps) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Skill Verification</h2>
        <p className="text-zinc-500 mt-1">
          Select a skill to prove your expertise. Results are saved to your
          immutable profile.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SKILLS.map((skill, idx) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            index={idx}
            onSelect={onSelectSkill}
          />
        ))}
      </div>
    </div>
  );
};

// ── Individual Card ───────────────────────────────────────────────────────────

const SkillCard = ({
  skill,
  index,
  onSelect,
}: {
  key?: string;
  skill: SkillConfig;
  index: number;
  onSelect: (id: SkillType) => void;
}) => {
  const Icon = iconMap[skill.icon] ?? ShieldCheck;
  const isActive = skill.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={isActive ? { y: -5 } : undefined}
      className={`glass p-8 rounded-[2.5rem] border flex flex-col justify-between transition-all ${
        isActive
          ? "border-white/5 hover:border-brand-primary/20 cursor-pointer"
          : "border-white/5 opacity-60"
      }`}
      onClick={() => isActive && onSelect(skill.id)}
    >
      <div>
        {/* Icon + status badge */}
        <div className="flex justify-between items-start mb-6">
          <div
            className={`p-3 rounded-2xl border border-white/10 bg-gradient-to-br ${skill.gradient}`}
          >
            <Icon className={`w-6 h-6 ${skill.color}`} />
          </div>
          <span
            className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-zinc-900 border border-white/5 ${
              isActive ? "text-green-400" : "text-zinc-600"
            }`}
          >
            {isActive ? "Active" : "Coming Soon"}
          </span>
        </div>

        <h3 className="text-xl font-bold mb-2">{skill.name}</h3>
        <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
          {skill.description}
        </p>
      </div>

      {isActive ? (
        <button className="w-full py-4 rounded-2xl bg-white text-black font-bold hover:bg-zinc-100 transition-all flex items-center justify-center gap-2">
          Start Verification <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <div className="w-full py-4 rounded-2xl glass border border-white/5 font-bold flex items-center justify-center gap-2 text-zinc-600 cursor-not-allowed">
          <Lock className="w-4 h-4" /> Coming Soon
        </div>
      )}
    </motion.div>
  );
};
