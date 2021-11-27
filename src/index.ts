/* cron prediction script */

const stdin = process.openStdin();

var data = '';

stdin.on('data', function (chunk: string) {
  data += chunk;
});

stdin.on('end', function () {
  const crons = parseInput(data);
  const currentTime = process.argv.slice(2)[0];
  const nextRuns = crons.map((cron) => {
    const nextRun = predictNextRun(currentTime, cron);

    return `${nextRun.hour}:${nextRun.minutes} ${nextRun.day} - ${cron.command}`;
  });

  nextRuns.forEach((run) => console.log(run));
});

/* ------------------------------------ */
/* support functions & type definitions */
/* ------------------------------------ */
export interface CronJob {
  command: string;
  config: {
    minutes: string;
    hour: string;
  };
}

export function parseInput(input: string): CronJob[] {
  const inputLines = input.trim().split('\n');

  return inputLines.map((line) => {
    const [minutes, hour, command] = line.trim().split(' ');

    if (!minutes || !hour || !command) {
      throw new Error('Invalid cron input: ' + input);
    }

    return {
      command,
      config: {
        minutes,
        hour,
      },
    };
  });
}

interface CronJobRun {
  day: 'today' | 'tomorrow';
  minutes: string;
  hour: string;
}

export function predictNextRun(
  currentTime: string,
  cronJob: CronJob
): CronJobRun {
  const [currentHour, currentMinutes] = currentTime
    .split(':')
    .map((field) => parseInt(field, 10));
  const isEveryHour = cronJob.config.hour === '*';
  const isEveryMinute = cronJob.config.minutes === '*';

  // might try a less brute-forcey way if I had the time
  // for example only generating possible run times that
  // are equal or greater than the current time
  const cronHours = isEveryHour
    ? generateEveryHour()
    : [parseInt(cronJob.config.hour, 10)];

  const cronMinutes = isEveryMinute
    ? generateEveryMinute()
    : [parseInt(cronJob.config.minutes, 10)];

  const cronRunTimes = cronHours.flatMap((hour) => {
    return cronMinutes.map((minutes) => {
      return [hour, minutes];
    });
  });

  const nextRunTime = cronRunTimes.find(([hour, minutes]) => {
    const isFutureHour = hour > currentHour;
    if (isFutureHour) return true; // if hour is in the future, we don't care about minutes

    const isCurrentHour = hour === currentHour;
    if (isCurrentHour) return minutes >= currentMinutes;

    return false;
  });

  if (nextRunTime === undefined) {
    // no more runs today after the current time
    return {
      day: 'tomorrow',
      hour: cronRunTimes[0][0].toString().padStart(2, '0'),
      minutes: cronRunTimes[0][1].toString().padStart(2, '0'),
    };
  }

  return {
    // return the next run time (possibly now)
    day: 'today',
    hour: nextRunTime[0].toString().padStart(2, '0'),
    minutes: nextRunTime[1].toString().padStart(2, '0'),
  };
}

function generateEveryHour(): number[] {
  return new Array(24).fill(null).map((_, i) => i);
}
function generateEveryMinute(): number[] {
  return new Array(60).fill(null).map((_, i) => i);
}
