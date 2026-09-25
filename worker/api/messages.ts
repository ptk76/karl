interface EmailContent {
  subject: string;
  message: string;
}

export const authError = {
  subject: "Access Denied",
  message: `
Hello!
<br><br>
Your access token expired. Please log in to Dear Karl again: <a href="https://karl.przemekkudla.pl">dearkarl.com</a>
<br><br>
Regards, Karl
`,
} satisfies EmailContent;

export const unknownUser = {
  subject: "Unknown User",
  message: `
Hello!
<br><br>
You have sent an email to me, but I didn't recognize you. Please visit Dear Karl's page to create an account and learn more: <a href="https://karl.przemekkudla.pl">dearkarl.com</a>
<br><br>
Regards, Karl
`,
} satisfies EmailContent;
