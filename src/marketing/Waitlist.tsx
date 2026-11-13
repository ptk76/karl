import React from "react";

// The waiting-list form. A plain GET to Tally: the browser builds
// ?email=… itself, so the page runs no JavaScript and makes no request to
// Tally until the visitor presses the button (CSP: form-action https://tally.so).
export default function Waitlist(props: {
  id: string;
  label?: string;
}): React.JSX.Element {
  const label = props.label ?? "Join the waiting list";
  return (
    <form className="signup" method="get" action="https://tally.so/r/jaXgz9">
      <label className="visually-hidden" htmlFor={props.id}>
        Your email address
      </label>
      <input
        className="field"
        id={props.id}
        type="email"
        name="email"
        required
        autoComplete="email"
        spellCheck={false}
        placeholder="you@example.com"
      />
      <button className="btn" type="submit">
        {label}
      </button>
    </form>
  );
}
