type Props = {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  value?: string | number | boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  readonly?: boolean;
};

export default function Input({id, name, type, required = false, value, onChange, className, placeholder, readonly = false}: Props) {
  const isCheckbox = type === "checkbox";
  const defaultValue =
    !isCheckbox && typeof value !== "boolean"
      ? (value as string | number | undefined)
      : undefined;
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue}
      defaultChecked={isCheckbox ? Boolean(value) : undefined}
      onChange={onChange}
      className={(className || "") + " mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"}
      placeholder={placeholder}
      required={required}
      readOnly={readonly}
    />
  );
}
