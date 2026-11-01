import React from "react";

function SignInRefused(props: { onRetry: () => void }): React.JSX.Element {
  return (
    <>
      <nav className="steps" aria-label="Progress">
        <ol>
          <li className="on">
            <span className="n">1</span>
            <span>Sign in</span>
          </li>
          <li className="sep" aria-hidden="true" />
          <li>
            <span className="n">2</span>
            <span>Your address</span>
          </li>
          <li className="sep" aria-hidden="true" />
          <li>
            <span className="n">3</span>
            <span>Connect Claude Code</span>
          </li>
        </ol>
      </nav>

      <div className="card narrow">
        <h1>You didn't approve it</h1>
        <p className="lede">No account was made, and nothing was stored.</p>
        <p>
          Karl needs to write into a folder somewhere, and Google Drive is the
          only destination we support today. Without that approval there is
          nowhere for your mail to go.
        </p>

        <div className="btn-row">
          <button className="btn" onClick={props.onRetry}>
            Try again
          </button>
          <a
            className="btn ghost"
            href="#"
            onClick={(e) => e.preventDefault()}
          >
            Self-host instead
          </a>
        </div>

        <p className="small" style={{ marginTop: 16 }}>
          Self-hosting runs the same pipe on your own infrastructure — free,
          complete, no account with us. It needs a domain and a GitHub account,
          and takes about fifteen minutes.
        </p>
      </div>
    </>
  );
}

export default SignInRefused;
