type Props = {
  children: React.ReactNode;
  htmlFor: string;
};

export default function Label({ children, htmlFor }: Props) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}
