export const getStatusColor = (status: number) => {
  if (status < 300) return 'bg-additional-success/15 text-additional-success';
  if (status < 400) return 'bg-additional-warning/15 text-additional-warning';
  return 'bg-additional-fail/15 text-additional-fail';
};
