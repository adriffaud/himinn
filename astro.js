const ASTRONOMICAL_DUSK_OFFSET_MS = 2 * 60 * 60 * 1000; // 2 hours
const ASTRONOMICAL_DAWN_OFFSET_MS = -2 * 60 * 60 * 1000; // -2 hours

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
