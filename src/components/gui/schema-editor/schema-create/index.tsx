import type React from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { SchemaDatabaseCreateForm } from "./schema-create-form";

interface Props {
  schemaName?: string;
  onClose: () => void;
}

export default function SchemaCreateDialog(
  props: React.PropsWithChildren<Props>,
) {
  return (
    <Dialog defaultOpen onOpenChange={props.onClose}>
      <DialogContent>
        <DialogHeader>
          {!props.schemaName
            ? "New Schema/Database"
            : `${props.schemaName}-Schema`}
        </DialogHeader>
        <SchemaDatabaseCreateForm
          schemaName={props.schemaName}
          onClose={props.onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
