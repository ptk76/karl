import React from "react";

function Destination(props: { onNext: () => void }): React.JSX.Element {
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
        <p className="eyebrow">Step 1 of 3 · before we make your address</p>
        <h1>Where your mail lands</h1>
        <p className="lede">
          In a folder in your own Google Drive. We create it, we write to it, and
          that folder is the only part of your Drive we can see.
        </p>
        <p>
          Your mail sits in your storage, not ours. You can open it, download it,
          or cut us off — and nothing of ours is needed to read it.
        </p>

        <div className="choice on">
          <span className="dot" aria-hidden="true" />
          <span>
            <span className="t">Your Google Drive</span>
            <br />
            <span className="d">You hold your mail.</span>
          </span>
        </div>
        <div className="choice off">
          <span className="dot" aria-hidden="true" />
          <span>
            <span className="t">Dropbox · a GitHub repo · storage we run</span>
            <br />
            <span className="d">
              Each one holds your mail somewhere different. When they arrive,
              they arrive here, by name.
            </span>
          </span>
          <span className="pill-later">Not yet</span>
        </div>

        <div className="btn-row">
          <button className="btn" onClick={props.onNext}>
            Make my folder
          </button>
        </div>
      </div>
    </>
  );
}

export default Destination;
