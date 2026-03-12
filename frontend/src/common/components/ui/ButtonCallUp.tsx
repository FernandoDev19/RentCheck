type Props = {
  isLoading: boolean;
  children: React.ReactNode;
  type?: 'submit' | 'button';
  onClick?: () => void;
  id?: string;
};

export default function ButtonCallUp({ isLoading, children, type = 'button', onClick, id }: Props) {
  return (
    <button
      type={type}
      disabled={isLoading}
      id={id || undefined}
      onClick={onClick}
      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm cursor-pointer font-medium text-white ${
        isLoading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      }`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      ) : (
        children
      )}
    </button>
  );
}
