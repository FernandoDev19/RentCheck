type Props = {
  onClick: () => void;
  children: React.ReactNode;
  color: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export default function ButtonActionDataTable({
  onClick,
  children,
  color,
  disabled = false,
  className,
  id
}: Props) {
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer px-3 py-2 text-xs rounded-md bg-${color}-50 text-${color}-600 hover:bg-${color}-100 transition ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className || ""}`}
    >
      {children}
    </button>
  );
}
