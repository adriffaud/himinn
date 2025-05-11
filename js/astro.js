import constants from "./constants.js";

const { ASTRONOMICAL_DAWN_OFFSET_MS, ASTRONOMICAL_DUSK_OFFSET_MS } = constants;

/**
 * Calculates the astronomical night period based on sunrise and sunset data.
 * Astronomical night is defined as the period between astronomical dusk
 * (when the sun is 18° below the horizon after sunset) and astronomical dawn
 * (when the sun is 18° below the horizon before sunrise).
 *
 * @param {Object} weatherData - Weather data containing sunrise and sunset times
 * @param {Object} weatherData.daily - Daily weather information
 * @param {Array<string>} weatherData.daily.sunset - Array of sunset timestamps
 * @param {Array<string>} weatherData.daily.sunrise - Array of sunrise timestamps
 * @returns {Object} Object containing evening sunset (dusk) and morning sunrise (dawn) times
 * @returns {Date} eveningSunsetTime - The time of astronomical dusk
 * @returns {Date} morningSunriseTime - The time of astronomical dawn
 */
export function calculateAstronomicalNightPeriod(weatherData) {
  const currentDateTime = new Date();

  // Calculate astronomical dusk (18 degrees below horizon after sunset)
  // For astronomical purposes, dusk is ~2 hours after sunset
  let eveningSunsetTime = new Date(weatherData.daily.sunset[0]);
  eveningSunsetTime = new Date(
    eveningSunsetTime.getTime() + ASTRONOMICAL_DUSK_OFFSET_MS,
  );

  // Calculate astronomical dawn (18 degrees below horizon before sunrise)
  // For astronomical purposes, dawn is ~2 hours before sunrise
  let morningSunriseTime = new Date(weatherData.daily.sunrise[1]);
  morningSunriseTime = new Date(
    morningSunriseTime.getTime() + ASTRONOMICAL_DAWN_OFFSET_MS,
  );

  // If we're currently in the astronomical night period, use today's sunset and tomorrow's sunrise
  if (
    currentDateTime > eveningSunsetTime &&
    currentDateTime < morningSunriseTime
  ) {
    console.log("Currently in astronomical night");
  } else if (currentDateTime > morningSunriseTime) {
    // If we're past dawn, use tonight's sunset and tomorrow's sunrise
    eveningSunsetTime = new Date(weatherData.daily.sunset[0]);
    eveningSunsetTime = new Date(
      eveningSunsetTime.getTime() + ASTRONOMICAL_DUSK_OFFSET_MS,
    );

    // Use tomorrow's sunrise if available, otherwise keep today's
    if (weatherData.daily.sunrise.length > 1) {
      morningSunriseTime = new Date(weatherData.daily.sunrise[1]);
      morningSunriseTime = new Date(
        morningSunriseTime.getTime() + ASTRONOMICAL_DAWN_OFFSET_MS,
      );
    }
  }

  return { eveningSunsetTime, morningSunriseTime };
}
