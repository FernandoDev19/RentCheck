type Props = {
  id: string;
  name: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  value?: string | number | string[] | undefined;
};

export default function Select({
  id,
  name,
  className,
  children,
  disabled,
  required,
  value,
}: Props) {
  return (
    <select
      name={name}
      id={id}
      className={
        (className || "") +
        " mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
      }
      disabled={disabled}
      required={required}
      defaultValue={value}
    >
      {children}
    </select>
  );
}
