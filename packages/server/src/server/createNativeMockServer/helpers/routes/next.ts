export class NextError extends Error {}

export const next = () => new NextError();
