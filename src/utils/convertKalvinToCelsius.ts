export function convertKelvinToCelsius(tempInKelvin: number): number {
    const tempInCelcius = tempInKelvin - 273.15;
    return Math.floor(tempInCelcius)
}