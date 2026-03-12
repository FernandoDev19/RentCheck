type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function TitleSpan({ children, className }: Props) {
  return (
    <span className={`text-xs uppercase font-semibold text-neutral-600 ${className || ''}`}>
      {children}
    </span>
  );
}