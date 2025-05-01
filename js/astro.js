import constants from "./constants.js";

const { ASTRONOMICAL_DAWN_OFFSET_MS, ASTRONOMICAL_DUSK_OFFSET_MS } = constants;

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

function calculateSeeingIndex(temperature, dewPoint, windSpeed, humidity) {
  const tempWeight = 0.25;
  const windWeight = 0.4;
  const humidityWeight = 0.15;
  const dewPointWeight = 0.2;

  const tempDifference = Math.abs(temperature - dewPoint);

  const tempFactor = Math.max(0.1, Math.min(1, (15 - tempDifference) / 15));
  const windFactor = Math.max(0.1, Math.min(1, 1 - windSpeed / 25));
  const humidityFactor = Math.max(0.1, Math.min(1, 1 - humidity / 100));
  const dewPointFactor = Math.max(0.1, Math.min(1, (10 - tempDifference) / 10));

  const weightedIndex =
    tempWeight * tempFactor +
    windWeight * windFactor +
    humidityWeight * humidityFactor +
    dewPointWeight * dewPointFactor;

  return Math.round(Math.max(1, weightedIndex * 5));
}

export function calculateAverageSeeingIndex(forecast) {
  const { totalIndex, count } = forecast.reduce(
    (acc, { temperature, windSpeed, humidity, dewPoint }) => {
      const seeingIndex = calculateSeeingIndex(
        temperature,
        dewPoint,
        windSpeed,
        humidity,
      );

      return {
        totalIndex: acc.totalIndex + seeingIndex,
        count: acc.count + 1,
      };
    },
    { totalIndex: 0, count: 0 },
  );

  return count > 0 ? Math.round(totalIndex / count) : 0;
}
