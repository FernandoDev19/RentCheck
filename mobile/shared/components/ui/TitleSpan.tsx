type Props = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export default function TitleSpan({ children, className, id }: Props) {
  return (
    <span id={id} className={`text-xs uppercase font-semibold text-neutral-600 ${className || ''}`}>
      {children}
    </span>
  );
}