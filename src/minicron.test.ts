import { CronJob, isValidCron, parseInput, predictNextRun } from './minicron';

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

describe('isValidCron', () => {
  it('returns true for a valid daily cron', () => {
    expect(
      isValidCron({
        command: '/bin/daily',
        config: { hour: '12', minutes: '12' },
      })
    ).toBe(true);
  });

  it('returns true for a valid hourly cron', () => {
    expect(
      isValidCron({
        command: '/bin/hourly',
        config: { hour: '*', minutes: '12' },
      })
    ).toBe(true);
  });

  it('returns true for a valid cron that runs 60 times', () => {
    expect(
      isValidCron({
        command: '/bin/sixty',
        config: { hour: '12', minutes: '*' },
      })
    ).toBe(true);
  });

  it('returns true for a valid cron that runs every minute of the day', () => {
    expect(
      isValidCron({
        command: '/bin/sixty',
        config: { hour: '*', minutes: '*' },
      })
    ).toBe(true);
  });

  it('returns false for a cron with an empty command', () => {
    expect(
      isValidCron({
        command: '',
        config: { hour: '12', minutes: '12' },
      })
    ).toBe(false);
  });

  it('returns false for a cron with an empty hour', () => {
    expect(
      isValidCron({
        command: '/bin/empty_hour',
        config: { hour: '', minutes: '12' },
      })
    ).toBe(false);
  });

  it('returns false for a cron with an empty minutes', () => {
    expect(
      isValidCron({
        command: '/bin/empty_minutes',
        config: { hour: '12', minutes: '' },
      })
    ).toBe(false);
  });

  it('returns false for a cron with hour over 23', () => {
    expect(
      isValidCron({
        command: '/bin/hour_too_big',
        config: { hour: '24', minutes: '12' },
      })
    ).toBe(false);
  });

  it('returns false for a cron with a negative hour', () => {
    expect(
      isValidCron({
        command: '/bin/hour_too_big',
        config: { hour: '-1', minutes: '12' },
      })
    ).toBe(false);
  });

  it('returns false for a cron with hour over 59', () => {
    expect(
      isValidCron({
        command: '/bin/hour_too_big',
        config: { hour: '12', minutes: '60' },
      })
    ).toBe(false);
  });

  it('returns false for a cron with a negative minutes', () => {
    expect(
      isValidCron({
        command: '/bin/hour_too_big',
        config: { hour: '12', minutes: '-1' },
      })
    ).toBe(false);
  });
});

describe('predictNextRun', () => {
  describe('once a day', () => {
    const dailyAtNoon: CronJob = {
      command: '/bin/run_daily_noon',
      config: {
        hour: '12',
        minutes: '00',
      },
    };

    test('later today', () => {
      expect(predictNextRun('10:33', dailyAtNoon)).toEqual({
        day: 'today',
        hour: '12',
        minutes: '00',
      });
    });

    test('tomorrow', () => {
      expect(predictNextRun('14:55', dailyAtNoon)).toEqual({
        day: 'tomorrow',
        hour: '12',
        minutes: '00',
      });
    });

    test('now', () => {
      expect(predictNextRun('12:00', dailyAtNoon)).toEqual({
        day: 'today',
        hour: '12',
        minutes: '00',
      });
    });
  });

  describe('hourly', () => {
    const hourlyAtQuarterPast: CronJob = {
      command: '/bin/run_hourly_quarter_past',
      config: {
        hour: '*',
        minutes: '15',
      },
    };

    test('later today', () => {
      expect(predictNextRun('10:00', hourlyAtQuarterPast)).toEqual({
        day: 'today',
        hour: '10',
        minutes: '15',
      });
    });

    test('now', () => {
      expect(predictNextRun('10:15', hourlyAtQuarterPast)).toEqual({
        day: 'today',
        hour: '10',
        minutes: '15',
      });
    });

    test('first run tomorrow', () => {
      expect(predictNextRun('23:30', hourlyAtQuarterPast)).toEqual({
        day: 'tomorrow',
        hour: '00',
        minutes: '15',
      });
    });
  });

  describe('sixty times at a given hour', () => {
    const sixtyTimesAtNoon: CronJob = {
      command: '/bin/run_sixty_times_in_a_given_hour',
      config: {
        hour: '12',
        minutes: '*',
      },
    };

    test('before the hour', () => {
      expect(predictNextRun('10:00', sixtyTimesAtNoon)).toEqual({
        day: 'today',
        hour: '12',
        minutes: '00',
      });
    });

    test('during the hour', () => {
      expect(predictNextRun('12:22', sixtyTimesAtNoon)).toEqual({
        day: 'today',
        hour: '12',
        minutes: '22',
      });
    });

    test('after the hour', () => {
      expect(predictNextRun('16:00', sixtyTimesAtNoon)).toEqual({
        day: 'tomorrow',
        hour: '12',
        minutes: '00',
      });
    });
  });

  describe('every minute of the day', () => {
    const everyMinuteOfTheDay: CronJob = {
      command: '/bin/run_every_minute',
      config: {
        hour: '*',
        minutes: '*',
      },
    };

    it('always returns the current time', () => {
      const minutes = new Array(60).fill(null).map((_, i) => i);
      const hours = new Array(24).fill(null).map((_, i) => i);

      const everyMinute = hours.flatMap((hour) => {
        return minutes.map((minute) => [
          hour.toString().padStart(2, '0'),
          minute.toString().padStart(2, '0'),
        ]);
      });

      everyMinute.forEach((time) => {
        const currentTime = `${time[0]}:${time[1]}`;

        expect(predictNextRun(currentTime, everyMinuteOfTheDay)).toEqual({
          day: 'today',
          hour: time[0],
          minutes: time[1],
        });
      });
    });
  });
});
