const MIN_TEMPERATURE = 0;
const MAX_TEMPERATURE = 2;

export const formatTemperature = (value: number): number =>
	Math.round(Math.min(Math.max(value, MIN_TEMPERATURE), MAX_TEMPERATURE) * 10) /
	10;
