"use client";
import { StackMinus, TreeStructure } from "@phosphor-icons/react";
import { scc } from "@/core/command";
import ListButtonItem from "../list-button-item";

export default function SettingSidebar() {
  return (
    <div className="flex flex-col grow p-2">
      <ListButtonItem
        text="Relational Diagram"
        onClick={() => {
          scc.tabs.openBuiltinERD({});
        }}
        icon={TreeStructure}
      />
      <ListButtonItem
        text="Drop & Empty Multiple Tables"
        onClick={() => {
          scc.tabs.openBuiltinMassDropTable({});
        }}
        icon={StackMinus}
      />
    </div>
  );
}
