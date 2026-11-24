import { TestBed } from '@angular/core/testing';
import { CLOCK } from './clock';
import { TodayService } from './today.service';

describe('TodayService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(startIso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(startIso));
    TestBed.configureTestingModule({
      providers: [{ provide: CLOCK, useValue: () => new Date() }],
    });
    return TestBed.inject(TodayService);
  }

  it('starts with the Kyiv day', () => {
    // 23:30 Kyiv on 30 Nov
    const service = setup('2026-11-30T21:30:00Z');
    expect(service.today()).toBe('2026-11-30');
  });

  it('changes at the next Kyiv midnight', () => {
    const service = setup('2026-11-30T21:30:00Z');
    vi.advanceTimersByTime(29 * 60_000);
    expect(service.today()).toBe('2026-11-30');
    vi.advanceTimersByTime(2 * 60_000);
    expect(service.today()).toBe('2026-12-01');
  });

  it('keeps rolling over on following days', () => {
    const service = setup('2026-11-30T21:30:00Z');
    vi.advanceTimersByTime(24.6 * 3_600_000);
    expect(service.today()).toBe('2026-12-02');
  });

  it('refreshes when the app comes back to the foreground', () => {
    const service = setup('2026-11-30T21:30:00Z');
    // Simulate a suspended timer: move the clock without running timers.
    vi.setSystemTime(new Date('2026-12-01T06:00:00Z'));
    expect(service.today()).toBe('2026-11-30');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(service.today()).toBe('2026-12-01');
  });
});
