export const ENGLISH_ACCENTS = [
    {
        id: "american",
        label: "American English",
        description: "Standard American accent",
        heygenLanguageCode: "en",
    },
    {
        id: "british",
        label: "British English",
        description: "British received pronunciation",
        heygenLanguageCode: "en",
    },
    {
        id: "indian",
        label: "Indian English",
        description: "Indian-accented English",
        heygenLanguageCode: "en",
    },
    {
        id: "australian",
        label: "Australian English",
        description: "Australian accent",
        heygenLanguageCode: "en",
    },
];
export function getAccentById(id) {
    return ENGLISH_ACCENTS.find(a => a.id === id);
}
export function getAccentFromEthnicity(ethnicity) {
    if (!ethnicity)
        return "american";
    const normalizedEthnicity = ethnicity.toLowerCase();
    if (normalizedEthnicity.includes("indian")) {
        return "indian";
    }
    if (normalizedEthnicity.includes("british")) {
        return "british";
    }
    if (normalizedEthnicity.includes("australian")) {
        return "australian";
    }
    if (normalizedEthnicity.includes("american") || normalizedEthnicity.includes("african-american")) {
        return "american";
    }
    if (normalizedEthnicity.includes("asian") || normalizedEthnicity.includes("east asian") || normalizedEthnicity.includes("southeast asian")) {
        return "american";
    }
    if (normalizedEthnicity.includes("german") || normalizedEthnicity.includes("french") || normalizedEthnicity.includes("caucasian")) {
        return "american";
    }
    if (normalizedEthnicity.includes("middle eastern")) {
        return "american";
    }
    if (normalizedEthnicity.includes("latinx") || normalizedEthnicity.includes("latin")) {
        return "american";
    }
    return "american";
}
export function getAccentInstruction(accentId) {
    switch (accentId) {
        case "indian":
            return "Speak with an Indian English accent, using characteristic intonation patterns and rhythm typical of Indian speakers.";
        case "british":
            return "Speak with a British accent, using received pronunciation with characteristic British intonation.";
        case "australian":
            return "Speak with an Australian accent, with the characteristic rising intonation and Australian vowel sounds.";
        case "american":
        default:
            return "Speak with a standard American English accent.";
    }
}
