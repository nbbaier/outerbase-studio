import createEditableCell from "./create-editable-cell";

const TextCell = createEditableCell<string>({
  valueToString: (v) => v,
  toValue: (v) => v,
});

export default TextCell;
