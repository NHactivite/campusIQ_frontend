import type { DashboardFilter } from "@/store/slices/dashboardSlice";
import { Compass, Globe2, Rocket } from "lucide-react";

export const nav = [
  { label: "Home", href: "/" },
  { label: "Assistant", href: "/chat" },
  { label: "Facilities", href: "/facilities" },
  { label: "Notices", href: "/notices" },
  { label: "Events", href: "/dashboard" },
  { label: "Vision & Mission", href: "/#vision" },
  { label: "Incubation Pathway", href: "/#incubation" },
  { label: "Linkages", href: "/#linkages" },
];

export const pathway = [
{
name: "Research",
text: "Faculty and scholar research supported by RDC governance, seed grants, research training, expert talks, and collaborative academic projects."
},
{
name: "Ideation",
text: "Design thinking, hackathons, IIC activities, and innovation competitions help students identify real-world problems and develop practical solutions."
},
{
name: "Validation",
text: "Ideas are evaluated through user feedback, feasibility studies, problem research, and market analysis to assess their potential."
},
{
name: "Prototype",
text: "Technical guidance, mentoring, and prototype development support help innovators transform concepts into initial working models."
},
{
name: "IPR",
text: "The IPR Cell under RDC promotes intellectual property awareness and supports the identification, protection, and management of intellectual property assets."
},
{
name: "Pre-Incubation",
text: "Early-stage innovators receive mentoring, idea refinement, prototype support, and guidance on business models and venture development."
},
{
name: "Startup Formation",
text: "Promising innovations are developed into startup ventures through business planning, team building, registration guidance, and entrepreneurial mentoring."
},
{
name: "Funding",
text: "Innovators are guided towards suitable grants, government startup schemes, institutional support, competitions, and potential investors."
},
{
name: "Incubation & Growth",
text: "The proposed Sibsagar University Innovation & Incubation Centre (SUCIIE) aims to provide a foundation for future startup mentoring, industry connections, business development, and venture growth."
},
{
name: "Impact",
text: "Startups, products, and research-driven solutions address regional challenges, generate employment, promote sustainable development, and connect university knowledge with societal needs."
},
];


export type Stat = {
  value: string;
  label: string;
  text: string;
  category: Exclude<DashboardFilter, "All">;
  status: string;
};
export const stats: Stat[] = [
  {
    value: "2025",
    label: "RDC established",
    text: "RDC established with five subcommittees.",
    category: "RDC",
    status: "Established",
  },
  {
    value: "5",
    label: "RDC subcommittees",
    text: "Research, finance, collaboration, IPR/product and legal/regulatory areas.",
    category: "RDC",
    status: "Established",
  },
  {
    value: "1",
    label: "Seed grant scheme",
    text: "SMRGYF introduced for faculty research support.",
    category: "RDC",
    status: "Introduced",
  },
  {
    value: "10+3+4",
    label: "Research scholars",
    text: "Enrolled scholars in Entrepreneurship & Management, Law and Computer Science.",
    category: "RDC",
    status: "Reported",
  },
  {
    value: "1",
    label: "IIC / IEC platform",
    text: "Institutional platform for innovation and entrepreneurship.",
    category: "IIC",
    status: "Active",
  },
  {
    value: "6th",
    label: "FYUGP internship",
    text: "In-house internship initiated for 6th semester students.",
    category: "Learning",
    status: "Initiated",
  },
  {
    value: "1",
    label: "Pre-Incubation Centre",
    text: "Supports ideation, mentoring and prototype development.",
    category: "Incubation",
    status: "Established",
  },
  {
    value: "1",
    label: "RFRI MoU",
    text: "Industry/research linkage reported as completed.",
    category: "Incubation",
    status: "Completed",
  },
];

export const heroStats = [
  { value: "5", label: "RDC subcommittees" },
  { value: "1", label: "Pre-Incubation Centre" },
  { value: "1", label: "Seed grant scheme" },
  { value: "1", label: "MoU completed (RFRI)" },
];

export const vision = [
  {
    icon: Compass,
    title: "Vision",
    text: "To foster a vibrant culture of research, innovation and entrepreneurship that connects knowledge with regional needs, sustainable development and societal impact.",
  },
  {
    icon: Rocket,
    title: "Mission",
    text: "To strengthen research capacity, promote interdisciplinary and applied research, enable experiential and skill-based learning, nurture innovation and entrepreneurship, and create pathways from ideas and prototypes to incubation and impact.",
  },
  {
    icon: Globe2,
    title: "Core approach",
    text: "Research, experiential learning, innovation, IPR, entrepreneurship, incubation, industry–academia linkages and Indian Knowledge Systems.",
  },
];

export const visits = [
  "NEEPCO",
  "Tea Research Centre Jorhat",
  "NEATEHUB",
  "ONGC",
  "Government Solar Plant Amguri",
  "RFRI-linked exposure",
  "Heritage / IKS sites",
];

export const incubationSteps = [
  {
    title: "Pre-Incubation Centre",
    status: "Established",
    text: "Supports ideation, mentoring and prototype development.",
  },
  {
    title: "University Incubation Centre",
    status: "Initiated",
    text: "Preliminary process initiated for the Sibsagar University Innovation & Incubation Centre.",
  },
  {
    title: "Assam start-up linkage",
    status: "Initiated",
    text: "Process initiated for an MoU with Assam Innovation & Start-up Foundation.",
  },
  {
    title: "Technical & mentoring support",
    status: "Initiated",
    text: "Proposals / communications initiated with NECTAR and NRL.",
  },
  {
    title: "Section 8 company",
    status: "Initiated",
    text: "Preliminary registration process initiated as an institutional framework for innovation, incubation and entrepreneurship.",
  },
];
export const incubationFlow = [
  "Idea",
  "Design Thinking",
  "Prototype",
  "IPR",
  "Pre-Incubation",
  "SUCIIE",
  "Start-up",
];

export const linkages = [
  {
    title: "RFRI",
    status: "Completed",
    text: "MoU reported as completed; supports research, internships, training and knowledge exchange.",
  },
  {
    title: "Assam Start-up",
    status: "Initiated",
    text: "Process initiated for mentoring, networking and start-up support.",
  },
  {
    title: "NECTAR",
    status: "Initiated",
    text: "Collaboration process initiated for technical, mentoring and incubation support.",
  },
  {
    title: "NRL",
    status: "Initiated",
    text: "Expert engagement and proposed technical / mentoring support for research and incubation.",
  },
  {
    title: "IASST",
    status: "Linked",
    text: "Research, training, knowledge exchange and industry-oriented learning linkage.",
  },
  {
    title: "CUPAC-NE",
    status: "Planned",
    text: "Planned collaboration with Cotton University Particle Accelerator Centre and North East.",
  },
];
