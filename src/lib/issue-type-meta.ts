import {
  CircleOff,
  Construction,
  FootprintsIcon,
  Trash2,
  Trash,
  FlashlightOff,
  TrafficCone,
  Droplets,
  TriangleAlert,
  HardHat,
  GitBranchPlus,
  HelpCircle,
} from "lucide-react";

export const ISSUE_TYPE_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  POTHOLE:             { label: "Pothole",              icon: CircleOff,       color: "text-orange-600", bg: "bg-orange-100" },
  BROKEN_ROAD:         { label: "Broken Road",          icon: Construction,    color: "text-red-600",    bg: "bg-red-100" },
  SIDEWALK_DAMAGE:     { label: "Sidewalk Damage",      icon: FootprintsIcon,  color: "text-yellow-600", bg: "bg-yellow-100" },
  OVERFLOWING_BIN:     { label: "Overflowing Bin",      icon: Trash2,          color: "text-green-700",  bg: "bg-green-100" },
  GARBAGE:             { label: "Illegal Garbage",      icon: Trash,           color: "text-lime-700",   bg: "bg-lime-100" },
  BROKEN_STREET_LIGHT:  { label: "Broken Street Light",  icon: FlashlightOff,   color: "text-purple-600", bg: "bg-purple-100" },
  TRAFFIC_LIGHT_DAMAGE: { label: "Traffic Light Damage", icon: TrafficCone,     color: "text-red-500",    bg: "bg-red-50" },
  WATER_LEAKAGE:       { label: "Water Leakage",        icon: Droplets,        color: "text-blue-600",   bg: "bg-blue-100" },
  TRAFFIC_SIGN_DAMAGE: { label: "Traffic Sign Damage",  icon: TriangleAlert,   color: "text-amber-600",  bg: "bg-amber-100" },
  CONSTRUCTION_HAZARD: { label: "Construction Hazard",  icon: HardHat,         color: "text-rose-600",   bg: "bg-rose-100" },
  ROAD_CRACK:          { label: "Road Crack",           icon: GitBranchPlus,   color: "text-stone-600",  bg: "bg-stone-100" },
  OTHER:               { label: "Other",                icon: HelpCircle,      color: "text-gray-500",   bg: "bg-gray-100" },
};
