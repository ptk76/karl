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

export const driveError = {
  subject: "Could not save your file",
  message: `
Hello!
<br><br>
I could not save your file. Make sure that you have enough space on your drive. <br>
You may want to report the issue directly to us: <a href="mailto:support@przemekkudla.pl">support@dearkarl.com</a>
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
