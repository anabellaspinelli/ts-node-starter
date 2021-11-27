/* cron prediction script */

const stdin = process.openStdin();

var data = '';

stdin.on('data', function (chunk: string) {
  data += chunk;
});

stdin.on('end', function () {
  const crons = parseInput(data);
  var currentTime = process.argv.slice(2)[0];
  console.log({ crons, currentTime });
});

/* ------------------------------------ */
/* support functions & type definitions */
/* ------------------------------------ */
interface CronJob {
  command: string;
  config: {
    minutes: string;
    hour: string;
  };
}

function parseInput(input: string): CronJob[] {
  const inputLines = input
    .trim()
    .split('\n')
    .map((line) => line.trim());

  return inputLines.map((line) => {
    const [minutes, hour, command] = line.split(' ');

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

export { parseInput };
