type Props = {
    children: React.ReactNode;
    className?: string;
}

export default function Paragraph({children, className}: Props) {
  return (
    <p className={`m-0 text-neutral-500 font-medium ${className || ''}`}>{children}</p>
  )
}