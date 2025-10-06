"use client";

import { useId } from "react";
import Block from "@/components/orbit/block";
import { Input } from "@/components/orbit/input";
import Inset from "@/components/orbit/inset";
import { Label } from "@/components/orbit/label";
import Section from "@/components/orbit/section";

export default function LabelStorybook() {
  return (
    <Section>
      <Inset>
        <Block title="Label">
          <Label title="Name" className="w-1/2">
            <Input
              onValueChange={() => {}}
              placeholder="e.g. Joe Smith"
              id={useId()}
            />
          </Label>
        </Block>
      </Inset>
    </Section>
  );
}
