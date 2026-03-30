type Props = {
  onClick: () => void;
  children: React.ReactNode;
  color: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  title?: string;
};

export default function ButtonActionDataTable({
  onClick,
  children,
  color,
  disabled = false,
  className,
  id,
  title
}: Props) {
  return (
    <button
      id={id}
      title={title}
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
