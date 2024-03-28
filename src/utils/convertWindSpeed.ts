export const convertWindSpeed = (speedInMetersPerSecond: number): string => {
    const speedInMetersPerHour = speedInMetersPerSecond * 3.6;
    return `${speedInMetersPerHour.toFixed(0)} km/h`
}