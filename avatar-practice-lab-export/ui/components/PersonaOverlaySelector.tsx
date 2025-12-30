import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Users,
  Briefcase,
  Crown,
  Plus,
  Check,
  ChevronRight,
  Shield,
  Target,
  AlertTriangle,
  MessageSquare,
  Zap,
  Search,
  ArrowRight,
  Edit2,
} from "lucide-react";
import {
  PersonaOverlay,
  PersonaOverlayLevel,
  DEFAULT_PERSONA_OVERLAYS,
} from "@/lib/conversation-framework";
import { cn } from "@/lib/utils";
import {
  matchRoleToLevel,
  roleLevelToPersonaLevel,
  ROLE_LEVEL_OPTIONS,
  type RoleMatchResult,
  type RoleLevelCategory,
} from "@/lib/role-level-mapping";

interface PersonaOverlaySelectorProps {
  selectedLevel: PersonaOverlayLevel | null;
  selectedOverlay: PersonaOverlay | null;
  onSelect: (level: PersonaOverlayLevel, overlay: PersonaOverlay) => void;
  customPersonas?: Array<{ id: number; name: string; overlay: PersonaOverlay }>;
  showCreateCustom?: boolean;
  onCreateCustom?: (overlay: PersonaOverlay) => void;
  className?: string;
}

const PERSONA_OPTIONS: Array<{
  level: Exclude<PersonaOverlayLevel, "custom">;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    level: "ic",
    label: "Individual Contributor",
    shortLabel: "Individual Contributor",
    description: "Limited authority, must follow process",
    icon: User,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    level: "manager",
    label: "People Manager",
    shortLabel: "Manager",
    description: "Can negotiate within limits",
    icon: Users,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    level: "senior",
    label: "Senior Leader",
    shortLabel: "Director",
    description: "Approve significant decisions",
    icon: Briefcase,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    level: "exec",
    label: "Executive",
    shortLabel: "CXO",
    description: "Commit resources, set strategy",
    icon: Crown,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
];

export function PersonaOverlaySelector({
  selectedLevel,
  selectedOverlay,
  onSelect,
  customPersonas = [],
  showCreateCustom = false,
  onCreateCustom,
  className,
}: PersonaOverlaySelectorProps) {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customForm, setCustomForm] = useState<Partial<PersonaOverlay>>({
    userRoleTitle: "",
    authorityAndConstraints: [],
    successCriteria: [],
    commonMistakes: [],
    toneGuidance: "",
    avatarPushbackLevel: "medium",
  });

  const handlePresetSelect = (level: Exclude<PersonaOverlayLevel, "custom">) => {
    onSelect(level, DEFAULT_PERSONA_OVERLAYS[level]);
  };

  const handleCustomSelect = (customPersona: { id: number; name: string; overlay: PersonaOverlay }) => {
    onSelect("custom", customPersona.overlay);
  };

  const handleCreateCustom = () => {
    if (
      customForm.userRoleTitle &&
      customForm.toneGuidance &&
      customForm.avatarPushbackLevel &&
      onCreateCustom
    ) {
      onCreateCustom({
        userRoleTitle: customForm.userRoleTitle,
        authorityAndConstraints: customForm.authorityAndConstraints || [],
        successCriteria: customForm.successCriteria || [],
        commonMistakes: customForm.commonMistakes || [],
        toneGuidance: customForm.toneGuidance,
        avatarPushbackLevel: customForm.avatarPushbackLevel as "low" | "medium" | "high",
      });
      setIsCustomDialogOpen(false);
      setCustomForm({
        userRoleTitle: "",
        authorityAndConstraints: [],
        successCriteria: [],
        commonMistakes: [],
        toneGuidance: "",
        avatarPushbackLevel: "medium",
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-gray-900">Who are you in this scenario?</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PERSONA_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedLevel === option.level;
          const overlay = DEFAULT_PERSONA_OVERLAYS[option.level];

          return (
            <Card
              key={option.level}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border-2",
                isSelected
                  ? "border-primary shadow-md ring-2 ring-primary/20"
                  : "border-gray-100 hover:border-gray-200"
              )}
              onClick={() => handlePresetSelect(option.level)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      isSelected ? "bg-primary text-white" : option.color
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {option.shortLabel}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {option.description}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-1.5 py-0",
                      overlay.avatarPushbackLevel === "high"
                        ? "text-red-600 border-red-200"
                        : overlay.avatarPushbackLevel === "medium"
                        ? "text-amber-600 border-amber-200"
                        : "text-green-600 border-green-200"
                    )}
                  >
                    <Zap className="w-2.5 h-2.5 mr-0.5" />
                    {overlay.avatarPushbackLevel}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {customPersonas.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Personas</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {customPersonas.map((persona) => (
              <Card
                key={persona.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  selectedLevel === "custom" && selectedOverlay?.userRoleTitle === persona.overlay.userRoleTitle
                    ? "border-primary shadow-md ring-2 ring-primary/20"
                    : "border-gray-100 hover:border-gray-200"
                )}
                onClick={() => handleCustomSelect(persona)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                      <User className="w-4 h-4" />
                    </div>
                    {selectedLevel === "custom" &&
                      selectedOverlay?.userRoleTitle === persona.overlay.userRoleTitle && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    {persona.name}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {persona.overlay.userRoleTitle}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showCreateCustom && onCreateCustom && (
        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Persona
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Persona</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleTitle">Role Title</Label>
                <Input
                  id="roleTitle"
                  placeholder="e.g., Sales Representative"
                  value={customForm.userRoleTitle}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, userRoleTitle: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authority">Authority & Constraints (one per line)</Label>
                <Textarea
                  id="authority"
                  placeholder="e.g., Can offer up to 10% discount&#10;Must get manager approval for refunds"
                  rows={3}
                  value={(customForm.authorityAndConstraints || []).join("\n")}
                  onChange={(e) =>
                    setCustomForm({
                      ...customForm,
                      authorityAndConstraints: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success">Success Criteria (one per line)</Label>
                <Textarea
                  id="success"
                  placeholder="e.g., Close the deal&#10;Build rapport with client"
                  rows={3}
                  value={(customForm.successCriteria || []).join("\n")}
                  onChange={(e) =>
                    setCustomForm({
                      ...customForm,
                      successCriteria: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mistakes">Common Mistakes (one per line)</Label>
                <Textarea
                  id="mistakes"
                  placeholder="e.g., Talking too much&#10;Not listening to objections"
                  rows={3}
                  value={(customForm.commonMistakes || []).join("\n")}
                  onChange={(e) =>
                    setCustomForm({
                      ...customForm,
                      commonMistakes: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone Guidance</Label>
                <Textarea
                  id="tone"
                  placeholder="e.g., Confident but not pushy. Listen actively."
                  rows={2}
                  value={customForm.toneGuidance}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, toneGuidance: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pushback">Avatar Pushback Level</Label>
                <Select
                  value={customForm.avatarPushbackLevel}
                  onValueChange={(value) =>
                    setCustomForm({
                      ...customForm,
                      avatarPushbackLevel: value as "low" | "medium" | "high",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pushback level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Gentle resistance</SelectItem>
                    <SelectItem value="medium">Medium - Moderate challenge</SelectItem>
                    <SelectItem value="high">High - Strong pushback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustom}
                disabled={!customForm.userRoleTitle || !customForm.toneGuidance}
              >
                Create Persona
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedOverlay && (
        <Card className="mt-4 bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Selected: {selectedOverlay.userRoleTitle}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="font-medium">Authority</span>
                </div>
                <ul className="text-gray-500 text-xs space-y-0.5">
                  {selectedOverlay.authorityAndConstraints.slice(0, 2).map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-medium">Watch Out For</span>
                </div>
                <ul className="text-gray-500 text-xs space-y-0.5">
                  {selectedOverlay.commonMistakes.slice(0, 2).map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PersonaOverlayCompact({
  selectedLevel,
  selectedOverlay,
  onSelect,
  className,
}: Omit<PersonaOverlaySelectorProps, "customPersonas" | "showCreateCustom" | "onCreateCustom">) {
  const [roleInput, setRoleInput] = useState("");
  const [showManualSelect, setShowManualSelect] = useState(false);
  const [lastAppliedLevel, setLastAppliedLevel] = useState<string | null>(null);

  useEffect(() => {
    if (roleInput.trim().length < 2) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const result = matchRoleToLevel(roleInput);
      
      if (result.level && (result.confidence === "exact" || result.confidence === "high" || result.confidence === "medium")) {
        const personaLevel = roleLevelToPersonaLevel(result.level);
        if (lastAppliedLevel !== personaLevel) {
          onSelect(personaLevel, DEFAULT_PERSONA_OVERLAYS[personaLevel]);
          setLastAppliedLevel(personaLevel);
          setShowManualSelect(false);
        }
      } else if (result.confidence === "low" || result.confidence === "none") {
        setShowManualSelect(true);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [roleInput, onSelect, lastAppliedLevel]);

  const handleManualSelect = (level: Exclude<PersonaOverlayLevel, "custom">) => {
    onSelect(level, DEFAULT_PERSONA_OVERLAYS[level]);
    setLastAppliedLevel(level);
    setShowManualSelect(false);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ic":
        return <User className="w-3.5 h-3.5" />;
      case "manager":
        return <Users className="w-3.5 h-3.5" />;
      case "senior":
        return <Briefcase className="w-3.5 h-3.5" />;
      case "exec":
        return <Crown className="w-3.5 h-3.5" />;
      default:
        return <User className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          What's your role?
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Type your job title (e.g., Product Manager, Software Engineer)"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
      </div>

      {selectedLevel && roleInput.trim().length >= 2 && !showManualSelect && (
        <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-green-100 rounded">
              {getLevelIcon(selectedLevel)}
            </div>
            <span className="text-sm text-green-800">
              Seniority level: <strong>{PERSONA_OPTIONS.find(o => o.level === selectedLevel)?.shortLabel || selectedLevel}</strong>
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 h-7"
            onClick={() => setShowManualSelect(true)}
          >
            Change
          </Button>
        </div>
      )}

      {showManualSelect && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-gray-600">Select your practice level:</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_LEVEL_OPTIONS.map((option) => (
              <Button
                key={option.level}
                variant={selectedLevel === option.level ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs h-auto py-2 flex-col items-start",
                  selectedLevel === option.level && "ring-2 ring-primary/20"
                )}
                onClick={() => handleManualSelect(option.level)}
              >
                <span className="font-medium">{option.category}</span>
                <span className="text-[10px] text-gray-500 font-normal">
                  {option.examples.slice(0, 2).join(", ")}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {!roleInput && !selectedLevel && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">Or select directly:</p>
          <div className="flex flex-wrap gap-2">
            {PERSONA_OPTIONS.map((option) => {
              const isSelected = selectedLevel === option.level;
              return (
                <Button
                  key={option.level}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "text-xs",
                    isSelected && "ring-2 ring-primary/20"
                  )}
                  onClick={() => handleManualSelect(option.level)}
                >
                  {option.shortLabel}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonaOverlaySelector;
