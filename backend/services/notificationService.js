export const sendNotification = (to, message, role) => {
  console.log(`\n============================`);
  console.log(`🔔 NOTIFICATION SENT TO: ${role.toUpperCase()}`);
  console.log(`To ID: ${to}`);
  console.log(`Message: ${message}`);
  console.log(`============================\n`);
};
