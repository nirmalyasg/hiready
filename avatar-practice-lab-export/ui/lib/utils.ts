import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COMMON_CHARACTER_NAMES = [
  "Elena", "James", "Sarah", "Michael", "Maria", "David", "Lisa", "John",
  "Jennifer", "Robert", "Emily", "Daniel", "Amanda", "Chris", "Jessica",
  "Alex", "Rachel", "Kevin", "Michelle", "Brian", "Priya", "Raj", "Amit",
  "Deepa", "Vikram", "Ananya", "Rahul", "Meera", "Arjun", "Sneha"
];

export function anonymizeScenarioText(text: string, roleLabel?: string): string {
  if (!text) return text;
  
  let result = text;
  const genericRole = roleLabel || "they";
  
  COMMON_CHARACTER_NAMES.forEach(name => {
    result = result.replace(new RegExp(`, ${name},`, 'gi'), ',');
    result = result.replace(new RegExp(`\\(${name}\\)`, 'gi'), '');
    result = result.replace(new RegExp(`\\b${name}'s\\b`, 'gi'), 'their');
    result = result.replace(new RegExp(`\\b${name} is\\b`, 'gi'), 'They are');
    result = result.replace(new RegExp(`\\b${name} has\\b`, 'gi'), 'They have');
    result = result.replace(new RegExp(`\\b${name} starts\\b`, 'gi'), 'They start');
    result = result.replace(new RegExp(`\\b${name} responds\\b`, 'gi'), 'They respond');
    result = result.replace(new RegExp(`\\bwith ${name}\\b`, 'gi'), 'with them');
    result = result.replace(new RegExp(`\\bto ${name}\\b`, 'gi'), 'to them');
    result = result.replace(new RegExp(`\\b${name}\\b`, 'gi'), genericRole);
  });
  
  result = result.replace(/She starts/gi, 'They start');
  result = result.replace(/He starts/gi, 'They start');
  result = result.replace(/She responds/gi, 'They respond');
  result = result.replace(/He responds/gi, 'They respond');
  result = result.replace(/, is under/gi, ' is under');
  result = result.replace(/, has been/gi, ' has been');
  result = result.replace(/, wants/gi, ' wants');
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}
