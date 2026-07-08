export function percentageOf(value: number, percent: number): number {
  return (value * percent) / 100;
}

export function addPercentage(value: number, percent: number): number {
  return value * (1 + percent / 100);
}

export function subtractPercentage(value: number, percent: number): number {
  return value * (1 - percent / 100);
}

export function simpleInterest(principal: number, ratePercent: number, periods: number) {
  const interest = principal * (ratePercent / 100) * periods;
  return { interest, total: principal + interest };
}

export function compoundInterest(principal: number, ratePercent: number, periods: number) {
  const total = principal * Math.pow(1 + ratePercent / 100, periods);
  return { interest: total - principal, total };
}
