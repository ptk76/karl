import React from "react";
import LegalDoc from "./LegalDoc";
import { privacyBody } from "./privacyBody";

export default function Privacy(): React.JSX.Element {
  return (
    <LegalDoc
      title="Privacy notice & imprint"
      description="What dearkarl.com collects, which is almost nothing, and who runs it."
      metaTitle="Privacy notice & imprint — dearkarl"
      body={privacyBody}
    />
  );
}
