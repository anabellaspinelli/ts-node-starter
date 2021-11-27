import { parseInput } from './index';

describe('parseInput', () => {
  it('returns an array of a single cron for a single line of input', () => {
    expect(parseInput('30 1 /bin/run_me_daily')).toEqual([
      {
        command: '/bin/run_me_daily',
        config: {
          minutes: '30',
          hour: '1',
        },
      },
    ]);
  });

  it('returns an array crons for a multiline input', () => {
    expect(
      parseInput(`30 1 /bin/run_me_daily
      45 * /bin/run_me_hourly
      * * /bin/run_me_every_minute
      * 19 /bin/run_me_sixty_times`)
    ).toEqual([
      {
        command: '/bin/run_me_daily',
        config: {
          minutes: '30',
          hour: '1',
        },
      },
      {
        command: '/bin/run_me_hourly',
        config: {
          minutes: '45',
          hour: '*',
        },
      },
      {
        command: '/bin/run_me_every_minute',
        config: {
          minutes: '*',
          hour: '*',
        },
      },
      {
        command: '/bin/run_me_sixty_times',
        config: {
          minutes: '*',
          hour: '19',
        },
      },
    ]);
  });
});
