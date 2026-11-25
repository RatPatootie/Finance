import { TestBed } from '@angular/core/testing';
import { CLOCK } from '../date/clock';
import { FinanceDb } from './finance-db';
import { DEFAULT_SETTINGS } from './models';
import { SettingsRepository } from './settings.repository';
import { provideTestDb, until } from './testing';

describe('SettingsRepository', () => {
  let now: Date;
  let db: FinanceDb;

  function setup() {
    now = new Date('2026-11-24T07:00:00Z'); // 09:00 Kyiv
    const test = provideTestDb();
    db = test.db;
    TestBed.configureTestingModule({ providers: [...test.providers, { provide: CLOCK, useValue: () => now }] });
    return TestBed.inject(SettingsRepository);
  }

  it('returns defaults when nothing is saved: no balance, income 0, payday 1', async () => {
    const repo = setup();
    expect(await repo.get()).toEqual(DEFAULT_SETTINGS);
    const s = await until(
      () => repo.settings(),
      (v) => v !== undefined,
    );
    expect(s).toMatchObject({ balanceKopecks: null, monthlyIncomeKopecks: 0, payday: 1 });
  });

  it('setBalance stores the amount, the instant and the Kyiv day', async () => {
    const repo = setup();
    now = new Date('2026-11-23T22:30:00Z'); // 00:30 on 24 Nov in Kyiv
    await repo.setBalance(1_200_000);
    expect(await repo.get()).toMatchObject({
      balanceKopecks: 1_200_000,
      balanceSetAt: '2026-11-23T22:30:00.000Z',
      balanceDate: '2026-11-24',
    });
    await until(
      () => repo.settings()?.balanceKopecks,
      (v) => v === 1_200_000,
    );
  });

  it('stores income and payday without touching the balance', async () => {
    const repo = setup();
    await repo.setBalance(500_000);
    await repo.setMonthlyIncome(3_000_000);
    await repo.setPayday(25);
    expect(await repo.get()).toMatchObject({ balanceKopecks: 500_000, monthlyIncomeKopecks: 3_000_000, payday: 25 });
  });

  it('allows zero income and a zero balance', async () => {
    const repo = setup();
    await repo.setMonthlyIncome(0);
    await repo.setBalance(0);
    expect(await repo.get()).toMatchObject({ balanceKopecks: 0, monthlyIncomeKopecks: 0 });
  });

  it('bumps updatedAt on every write, even in the same millisecond', async () => {
    const repo = setup();
    await repo.setPayday(5);
    const first = (await repo.get()).updatedAt;
    await repo.setPayday(6);
    expect((await repo.get()).updatedAt > first).toBe(true);
  });

  it('reads a settings row saved by the previous version: no daily share, everything else unchanged', async () => {
    const repo = setup();
    await db.settings.put({
      id: 'budget',
      balanceKopecks: 1_200_000,
      balanceSetAt: '2026-11-20T07:00:00.000Z',
      balanceDate: '2026-11-20',
      monthlyIncomeKopecks: 3_000_000,
      payday: 25,
      showFrozen: false,
      updatedAt: '2026-11-20T07:00:00.000Z',
    });
    const s = await repo.get();
    expect(s.dailySharePercent).toBeUndefined();
    expect(s).toMatchObject({ balanceKopecks: 1_200_000, monthlyIncomeKopecks: 3_000_000, payday: 25, showFrozen: false });

    await repo.setDailyShare(40);
    expect(await repo.get()).toMatchObject({
      dailySharePercent: 40,
      balanceKopecks: 1_200_000,
      balanceSetAt: '2026-11-20T07:00:00.000Z',
      monthlyIncomeKopecks: 3_000_000,
      payday: 25,
      showFrozen: false,
    });
  });

  it('daily share takes a whole percent from 1 to 100', async () => {
    const repo = setup();
    expect(() => repo.setDailyShare(0)).toThrow();
    expect(() => repo.setDailyShare(101)).toThrow();
    expect(() => repo.setDailyShare(2.5)).toThrow();
    await repo.setDailyShare(1);
    await repo.setDailyShare(100);
    expect((await repo.get()).dailySharePercent).toBe(100);
  });

  it('rejects invalid values', async () => {
    const repo = setup();
    expect(() => repo.setBalance(-1)).toThrow();
    expect(() => repo.setBalance(1.5)).toThrow();
    expect(() => repo.setMonthlyIncome(1_000_000_000)).toThrow();
    expect(() => repo.setPayday(0)).toThrow();
    expect(() => repo.setPayday(32)).toThrow();
    expect(() => repo.setPayday(2.5)).toThrow();
  });

  it('values survive a new database instance', async () => {
    const repo = setup();
    await repo.setBalance(1_000);
    await repo.setPayday(10);
    const reopened = new FinanceDb(db.name);
    expect(await reopened.settings.get('budget')).toMatchObject({ balanceKopecks: 1_000, payday: 10 });
    reopened.close();
  });
});
