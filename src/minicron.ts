/* cron prediction script */

const stdin = process.openStdin();

var data = '';

stdin.on('data', function (chunk: string) {
  data += chunk;
});

stdin.on('end', function () {
  if (data.length === 0) return '';

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

interface CronJobRun {
  day: 'today' | 'tomorrow';
  minutes: string;
  hour: string;
}

export function parseInput(input: string): CronJob[] {
  const inputLines = input.trim().split('\n');

  const cronJobs: CronJob[] = [];

  for (const line of inputLines) {
    const [minutes, hour, command] = line.trim().split(' ');
    const cronJob: CronJob = {
      command,
      config: {
        minutes,
        hour,
      },
    };

    if (isValidCron(cronJob)) {
      cronJobs.push(cronJob);
    }
  }

  return cronJobs;
}

export function isValidCron({
  config: { minutes, hour },
  command,
}: CronJob): boolean {
  const numericMinutes = parseInt(minutes, 10);
  const numericHour = parseInt(hour, 10);

  const isValidMinutes =
    minutes === '*' ||
    (!Number.isNaN(numericMinutes) &&
      numericMinutes >= 0 &&
      numericMinutes <= 59);

  const isValidHour =
    hour === '*' ||
    (!Number.isNaN(numericHour) && numericHour >= 0 && numericHour <= 23);

  return isValidMinutes && isValidHour && command.length > 0;
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
