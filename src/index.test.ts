import { sum } from './index';

describe('sum', () => {
  it('returns the sum of the 2 numbers passed in', () => {
    expect(sum(1, 6)).toEqual(7);
  });
});
