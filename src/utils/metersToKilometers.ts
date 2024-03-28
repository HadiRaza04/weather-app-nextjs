export const meterToKilometers = (visibilityInMeters: number): string => {
    const visibilityInKilometers = visibilityInMeters / 1000;
    return `${visibilityInKilometers.toFixed(0)} km`;
}