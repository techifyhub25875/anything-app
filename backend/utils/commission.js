export function daysOverdue(dateStr) {
  const due = new Date(`${dateStr}T23:59:59`);
  const diffMs = Date.now() - due.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
