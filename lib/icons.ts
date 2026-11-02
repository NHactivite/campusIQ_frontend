import {
  Landmark, FlaskConical, Users, GraduationCap, Leaf, ShieldCheck,
  Rocket, Lightbulb, BookOpen, Cpu, Sprout, Compass, type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  Landmark, FlaskConical, Users, GraduationCap, Leaf, ShieldCheck,
  Rocket, Lightbulb, BookOpen, Cpu, Sprout, Compass,
};

export const getIcon = (name: string): LucideIcon => icons[name] ?? Landmark;