export const TYPE_TRANSMISSION = {
    MANUAL: "manual",
    AUTOMATICO: "automático",
    AMBOS: "ambos",
} as const;

export type TypeTransmission =
    (typeof TYPE_TRANSMISSION)[keyof typeof TYPE_TRANSMISSION];
