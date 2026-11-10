import React from "react";
import { Link } from "react-router-dom";
import Base from "./Base";
import usePageMeta from "./usePageMeta";

export default function NotFound(): React.JSX.Element {
  usePageMeta({
    title: "Not here — dearkarl",
    description: "This page does not exist.",
  });

  return (
    <Base title="Not here — dearkarl" description="This page does not exist.">
      <div className="flow">
        <h1>Nothing at this address.</h1>
        <p className="lede">Even Karl cannot deliver to a page that does not exist.</p>
        <div className="btnrow">
          <Link className="btn" to="/">
            Back to dearkarl
          </Link>
        </div>
      </div>
    </Base>
  );
}
