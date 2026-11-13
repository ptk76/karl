import React from "react";
import LegalDoc from "./LegalDoc";
import { termsBody } from "./termsBody";

export default function Terms(): React.JSX.Element {
  return (
    <LegalDoc
      title="Terms of use"
      description="The terms for dearkarl.com, the waiting list, and the open-source template."
      metaTitle="Terms of use — dearkarl"
      body={termsBody}
    />
  );
}
