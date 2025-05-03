import { formatTimestamp } from './formatTimestamp';

vi.useFakeTimers().setSystemTime(new Date('1999-03-12'));

describe('formatTimestamp', () => {
  it('Should correctly format timestamp', () => {
    expect(formatTimestamp(944199296789)).toBe('03.12.1999, 12:34:56,789');
  });
});
