"use client";

import { useId, useState } from "react";
import Block from "@/components/orbit/block";
import { Input } from "@/components/orbit/input";
import Inset from "@/components/orbit/inset";
import { Label } from "@/components/orbit/label";
import Section from "@/components/orbit/section";

export default function InputStorybook() {
  const [isValid, setIsValid] = useState(true);

  const checkIfValid = (value: string) => {
    if (value === "dog" || value === "") {
      setIsValid(true);
    } else setIsValid(false);
  };

  const nameId = useId();
  const resourceNameId = useId();
  const monthId = useId();

  return (
    <Section>
      <Inset>
        <Block title="Input">
          <Label title="Name" htmlFor={nameId}>
            <Input
              onValueChange={() => {}}
              placeholder="e.g. Joe Smith"
              id={nameId}
              size="sm"
              disabled
            />
          </Label>
          <Label
            title="Resource name"
            htmlFor={resourceNameId}
            required
            requiredDescription="text must be 'dog' "
            isValid={isValid}
          >
            <Input
              isValid={isValid}
              preText="outerbase.com/"
              onValueChange={checkIfValid}
              placeholder="my-cool-base"
              id={resourceNameId}
              size="base"
            />
          </Label>
          <Label title="Month" htmlFor={monthId}>
            <Input
              onValueChange={() => {}}
              placeholder="e.g. April"
              id={monthId}
              size="lg"
            />
          </Label>
        </Block>
      </Inset>
    </Section>
  );
}
